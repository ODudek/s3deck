package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"mime"
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

func uploadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	bucketID := r.FormValue("bucket")
	if bucketID == "" {
		http.Error(w, "missing bucket ID", http.StatusBadRequest)
		return
	}

	key := r.FormValue("key")
	if key == "" {
		http.Error(w, "missing object key", http.StatusBadRequest)
		return
	}

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

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "failed to get file from request", http.StatusBadRequest)
		return
	}
	defer file.Close()

	client := createS3Client(*bucketConfig)

	// Detect content type from file extension
	contentType := mime.TypeByExtension(filepath.Ext(key))
	
	// Special handling for specific file types
	if strings.HasSuffix(strings.ToLower(key), ".map") || strings.HasSuffix(strings.ToLower(key), ".js.map") {
		contentType = "application/json"
	} else if contentType == "" {
		contentType = "application/octet-stream"
	}

	_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(bucketConfig.Name),
		Key:         aws.String(key),
		Body:        file,
		ContentType: aws.String(contentType),
	})

	if err != nil {
		http.Error(w, fmt.Sprintf("failed to upload file: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "File uploaded successfully",
		"key":     key,
		"size":    header.Size,
	})
}

func deleteObject(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	bucketID := r.URL.Query().Get("bucket")
	if bucketID == "" {
		http.Error(w, "missing bucket ID", http.StatusBadRequest)
		return
	}

	key := r.URL.Query().Get("key")
	if key == "" {
		http.Error(w, "missing object key", http.StatusBadRequest)
		return
	}

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

	// Check if it's a folder (ends with /) - delete all objects with this prefix
	if strings.HasSuffix(key, "/") {
		// List all objects with this prefix
		listInput := &s3.ListObjectsV2Input{
			Bucket: aws.String(bucketConfig.Name),
			Prefix: aws.String(key),
		}

		result, err := client.ListObjectsV2(context.TODO(), listInput)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to list objects: %v", err), http.StatusInternalServerError)
			return
		}

		// Delete all objects
		for _, obj := range result.Contents {
			_, err := client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
				Bucket: aws.String(bucketConfig.Name),
				Key:    obj.Key,
			})
			if err != nil {
				http.Error(w, fmt.Sprintf("failed to delete object %s: %v", *obj.Key, err), http.StatusInternalServerError)
				return
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Folder deleted successfully",
			"key":     key,
			"count":   len(result.Contents),
		})
	} else {
		// Delete single object
		_, err := client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
			Bucket: aws.String(bucketConfig.Name),
			Key:    aws.String(key),
		})

		if err != nil {
			http.Error(w, fmt.Sprintf("failed to delete object: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Object deleted successfully",
			"key":     key,
		})
	}
}

func getObjectMetadata(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	bucketID := r.URL.Query().Get("bucket")
	if bucketID == "" {
		http.Error(w, "missing bucket ID", http.StatusBadRequest)
		return
	}

	key := r.URL.Query().Get("key")
	if key == "" {
		http.Error(w, "missing object key", http.StatusBadRequest)
		return
	}

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

	// Get object metadata
	headInput := &s3.HeadObjectInput{
		Bucket: aws.String(bucketConfig.Name),
		Key:    aws.String(key),
	}

	result, err := client.HeadObject(context.TODO(), headInput)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to get object metadata: %v", err), http.StatusInternalServerError)
		return
	}

	metadata := map[string]interface{}{
		"key":           key,
		"contentType":   aws.ToString(result.ContentType),
		"contentLength": aws.ToInt64(result.ContentLength),
		"lastModified":  result.LastModified,
		"etag":          aws.ToString(result.ETag),
		"storageClass":  string(result.StorageClass),
		"metadata":      result.Metadata,
	}

	// Add additional computed fields
	if result.LastModified != nil {
		metadata["lastModifiedFormatted"] = result.LastModified.Format("2006-01-02 15:04:05 UTC")
	}

	if result.ContentLength != nil {
		size := aws.ToInt64(result.ContentLength)
		metadata["sizeFormatted"] = formatFileSize(size)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metadata)
}

func uploadFromPath(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var requestData struct {
		BucketID    string   `json:"bucket"`
		BasePath    string   `json:"basePath"`
		CurrentPath string   `json:"currentPath"`
		Files       []string `json:"files"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if requestData.BucketID == "" {
		http.Error(w, "missing bucket ID", http.StatusBadRequest)
		return
	}

	if len(requestData.Files) == 0 {
		http.Error(w, "no files provided", http.StatusBadRequest)
		return
	}

	var bucketConfig *BucketConfig
	for _, bc := range appConfig.Buckets {
		if bc.ID == requestData.BucketID {
			bucketConfig = &bc
			break
		}
	}

	if bucketConfig == nil {
		http.Error(w, "bucket configuration not found", http.StatusNotFound)
		return
	}

	client := createS3Client(*bucketConfig)
	uploadedFiles := []map[string]interface{}{}
	failedFiles := []map[string]interface{}{}

	for _, filePath := range requestData.Files {
		// Open the file from the local filesystem
		file, err := os.Open(filePath)
		if err != nil {
			failedFiles = append(failedFiles, map[string]interface{}{
				"path":  filePath,
				"error": fmt.Sprintf("failed to open file: %v", err),
			})
			continue
		}

		// Get file info
		fileInfo, err := file.Stat()
		if err != nil {
			file.Close()
			failedFiles = append(failedFiles, map[string]interface{}{
				"path":  filePath,
				"error": fmt.Sprintf("failed to get file info: %v", err),
			})
			continue
		}

		// Calculate the S3 key (relative path from base path + current path)
		var s3Key string
		if requestData.BasePath != "" {
			relPath := strings.TrimPrefix(filePath, requestData.BasePath)
			relPath = strings.TrimPrefix(relPath, "/")
			s3Key = relPath
		} else {
			s3Key = filepath.Base(filePath)
		}
		
		// Prepend current path if we're in a subfolder
		if requestData.CurrentPath != "" {
			s3Key = strings.TrimSuffix(requestData.CurrentPath, "/") + "/" + s3Key
		}

		// Detect content type
		contentType := mime.TypeByExtension(filepath.Ext(s3Key))
		if strings.HasSuffix(strings.ToLower(s3Key), ".map") || strings.HasSuffix(strings.ToLower(s3Key), ".js.map") {
			contentType = "application/json"
		} else if contentType == "" {
			contentType = "application/octet-stream"
		}

		// Upload to S3
		_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
			Bucket:      aws.String(bucketConfig.Name),
			Key:         aws.String(s3Key),
			Body:        file,
			ContentType: aws.String(contentType),
		})

		file.Close()

		if err != nil {
			failedFiles = append(failedFiles, map[string]interface{}{
				"path":  filePath,
				"key":   s3Key,
				"error": fmt.Sprintf("failed to upload: %v", err),
			})
		} else {
			uploadedFiles = append(uploadedFiles, map[string]interface{}{
				"path": filePath,
				"key":  s3Key,
				"size": fileInfo.Size(),
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":       fmt.Sprintf("Uploaded %d files, %d failed", len(uploadedFiles), len(failedFiles)),
		"uploadedFiles": uploadedFiles,
		"failedFiles":   failedFiles,
		"totalFiles":    len(requestData.Files),
	})
}

func formatFileSize(size int64) string {
	const unit = 1024
	if size < unit {
		return fmt.Sprintf("%d B", size)
	}
	div, exp := int64(unit), 0
	for n := size / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(size)/float64(div), "KMGTPE"[exp])
}

func corsHandler(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
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
	http.HandleFunc("/upload", corsHandler(uploadFile))
	http.HandleFunc("/upload-paths", corsHandler(uploadFromPath))
	http.HandleFunc("/delete", corsHandler(deleteObject))
	http.HandleFunc("/metadata", corsHandler(getObjectMetadata))

	port := "8082"
	fmt.Println("Go backend running on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
