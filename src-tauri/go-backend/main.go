package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// Initialize configuration
	initConfig()

	// Setup HTTP routes with CORS middleware
	http.HandleFunc("/buckets", corsHandler(listBucketsHandler))
	http.HandleFunc("/objects", corsHandler(listObjectsHandler))
	http.HandleFunc("/add-bucket", corsHandler(addBucketConfigHandler))
	http.HandleFunc("/upload", corsHandler(uploadFileHandler))
	http.HandleFunc("/upload-paths", corsHandler(uploadFromPathHandler))
	http.HandleFunc("/delete", corsHandler(deleteObjectHandler))
	http.HandleFunc("/metadata", corsHandler(getObjectMetadataHandler))
	http.HandleFunc("/bucket", corsHandler(deleteBucketConfigHandler))
	http.HandleFunc("/update-bucket", corsHandler(updateBucketConfigHandler))

	// Start the server
	port := "8082"
	fmt.Println("Go backend running on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
