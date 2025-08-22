package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type BucketConfig struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Region      string `json:"region"`
	AccessKey   string `json:"accessKey"`
	SecretKey   string `json:"secretKey"`
	Endpoint    string `json:"endpoint,omitempty"`
}

type Object struct {
	Key  string `json:"key"`
	Size int64  `json:"size"`
}

type Config struct {
	Buckets []BucketConfig `json:"buckets"`
}

var (
	appConfig  Config
	configPath string
)

func initConfig() {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatalf("Unable to get home directory: %v", err)
	}

	configDir := filepath.Join(homeDir, ".s3deck")
	if err := os.MkdirAll(configDir, 0o755); err != nil {
		log.Fatalf("Unable to create config directory: %v", err)
	}

	configPath = filepath.Join(configDir, "config.json")
	loadConfig()
}

func loadConfig() {
	data, err := os.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			appConfig = Config{Buckets: []BucketConfig{}}
			saveConfig()
			return
		}
		log.Fatalf("Unable to read config: %v", err)
	}

	if err := json.Unmarshal(data, &appConfig); err != nil {
		log.Fatalf("Unable to parse config: %v", err)
	}
}

func saveConfig() error {
	data, err := json.MarshalIndent(appConfig, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(configPath, data, 0o644)
}

func createS3Client(bucketConfig BucketConfig) *s3.Client {
	cfg := aws.Config{
		Region: bucketConfig.Region,
		Credentials: credentials.NewStaticCredentialsProvider(
			bucketConfig.AccessKey,
			bucketConfig.SecretKey,
			"",
		),
	}

	if bucketConfig.Endpoint != "" {
		cfg.EndpointResolverWithOptions = aws.EndpointResolverWithOptionsFunc(
			func(service, region string, options ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{URL: bucketConfig.Endpoint}, nil
			},
		)
	}

	return s3.NewFromConfig(cfg)
}

func listBuckets(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(appConfig.Buckets)
}

type FileItem struct {
	Key      string `json:"key"`
	Name     string `json:"name"`
	Size     int64  `json:"size"`
	IsFolder bool   `json:"isFolder"`
}

func listObjects(w http.ResponseWriter, r *http.Request) {
	bucketID := r.URL.Query().Get("bucket")
	if bucketID == "" {
		http.Error(w, "missing bucket ID", http.StatusBadRequest)
		return
	}

	prefix := r.URL.Query().Get("prefix")

	var bucketConfig *BucketConfig
	for _, bc := range appConfig.Buckets {
		if bc.ID == bucketID {
			bucketConfig = &bc
			break
		}
	}

	if bucketConfig == nil {
		http.Error(w, "bucket configuration not found", http.StatusNotFound)
		return
	}

	client := createS3Client(*bucketConfig)

	input := &s3.ListObjectsV2Input{
		Bucket:    aws.String(bucketConfig.Name),
		Delimiter: aws.String("/"),
	}

	if prefix != "" {
		input.Prefix = aws.String(prefix)
	}

	out, err := client.ListObjectsV2(context.TODO(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	items := []FileItem{}

	// Add folders (common prefixes)
	for _, commonPrefix := range out.CommonPrefixes {
		folderPath := *commonPrefix.Prefix
		folderName := folderPath
		if prefix != "" {
			folderName = folderPath[len(prefix):]
		}
		folderName = strings.TrimSuffix(folderName, "/")

		if folderName != "" {
			items = append(items, FileItem{
				Key:      folderPath,
				Name:     folderName,
				Size:     0,
				IsFolder: true,
			})
		}
	}

	// Add files
	for _, obj := range out.Contents {
		fileName := *obj.Key
		if prefix != "" {
			fileName = fileName[len(prefix):]
		}

		// Skip if it's just the prefix itself or empty
		if fileName == "" || fileName == "/" {
			continue
		}

		items = append(items, FileItem{
			Key:      *obj.Key,
			Name:     fileName,
			Size:     aws.ToInt64(obj.Size),
			IsFolder: false,
		})
	}

	json.NewEncoder(w).Encode(items)
}

func addBucketConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var bucketConfig BucketConfig
	if err := json.NewDecoder(r.Body).Decode(&bucketConfig); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if bucketConfig.Name == "" || bucketConfig.AccessKey == "" || bucketConfig.SecretKey == "" || bucketConfig.Region == "" {
		http.Error(w, "Name, AccessKey, SecretKey, and Region are required", http.StatusBadRequest)
		return
	}

	if bucketConfig.DisplayName == "" {
		bucketConfig.DisplayName = bucketConfig.Name
	}

	bytes := make([]byte, 4)
	rand.Read(bytes)
	bucketConfig.ID = hex.EncodeToString(bytes)

	appConfig.Buckets = append(appConfig.Buckets, bucketConfig)

	if err := saveConfig(); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save config: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Bucket configuration added successfully", "id": bucketConfig.ID})
}

func corsHandler(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			return
		}

		next(w, r)
	}
}

func main() {
	initConfig()

	http.HandleFunc("/buckets", corsHandler(listBuckets))
	http.HandleFunc("/objects", corsHandler(listObjects))
	http.HandleFunc("/add-bucket", corsHandler(addBucketConfig))

	port := "8082"
	fmt.Println("Go backend running on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
