package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Bucket struct {
	Name string `json:"name"`
}

type Object struct {
	Key  string `json:"key"`
	Size int64  `json:"size"`
}

var client *s3.Client

func initAWS() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("Unable to load SDK config: %v", err)
	}
	client = s3.NewFromConfig(cfg)
}

func listBuckets(w http.ResponseWriter, r *http.Request) {
	out, err := client.ListBuckets(context.TODO(), &s3.ListBucketsInput{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	buckets := []Bucket{}
	for _, b := range out.Buckets {
		buckets = append(buckets, Bucket{Name: *b.Name})
	}

	json.NewEncoder(w).Encode(buckets)
}

func listObjects(w http.ResponseWriter, r *http.Request) {
	bucket := r.URL.Query().Get("bucket")
	if bucket == "" {
		http.Error(w, "missing bucket", http.StatusBadRequest)
		return
	}

	out, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	objects := []Object{}
	for _, obj := range out.Contents {
		objects = append(objects, Object{
			Key:  *obj.Key,
			Size: aws.ToInt64(obj.Size),
		})
	}

	json.NewEncoder(w).Encode(objects)
}

func main() {
	initAWS()

	http.HandleFunc("/buckets", listBuckets)
	http.HandleFunc("/objects", listObjects)

	port := "8080"
	fmt.Println("Go backend running on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
