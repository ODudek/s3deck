package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

// corsHandler adds CORS headers to HTTP responses
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

// writeJSONResponse writes a JSON response
func writeJSONResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// writeErrorResponse writes an error response
func writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.WriteHeader(statusCode)
	writeJSONResponse(w, ErrorResponse{
		Error:   http.StatusText(statusCode),
		Message: message,
	})
}

// listBucketsHandler handles GET /buckets
func listBucketsHandler(w http.ResponseWriter, r *http.Request) {
	config := getConfig()
	writeJSONResponse(w, config.Buckets)
}

// listObjectsHandler handles GET /objects
func listObjectsHandler(w http.ResponseWriter, r *http.Request) {
	bucketID := r.URL.Query().Get("bucket")
	if bucketID == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing bucket ID")
		return
	}

	prefix := r.URL.Query().Get("prefix")

	bucketConfig := findBucketConfig(bucketID)
	if bucketConfig == nil {
		writeErrorResponse(w, http.StatusNotFound, "bucket configuration not found")
		return
	}

	client := createS3Client(*bucketConfig)
	items, err := listS3Objects(client, bucketConfig.Name, prefix)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSONResponse(w, items)
}

// addBucketConfigHandler handles POST /add-bucket
func addBucketConfigHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var bucketConfig BucketConfig
	if err := json.NewDecoder(r.Body).Decode(&bucketConfig); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if bucketConfig.Name == "" || bucketConfig.AccessKey == "" || bucketConfig.SecretKey == "" || bucketConfig.Region == "" {
		writeErrorResponse(w, http.StatusBadRequest, "Name, AccessKey, SecretKey, and Region are required")
		return
	}

	if bucketConfig.DisplayName == "" {
		bucketConfig.DisplayName = bucketConfig.Name
	}

	bucketConfig.ID = generateRandomID()

	if err := addBucketToConfig(bucketConfig); err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to save config: %v", err))
		return
	}

	writeJSONResponse(w, map[string]string{
		"message": "Bucket configuration added successfully",
		"id":      bucketConfig.ID,
	})
}

// uploadFileHandler handles POST /upload
func uploadFileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	bucketID := r.FormValue("bucket")
	if bucketID == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing bucket ID")
		return
	}

	key := r.FormValue("key")
	if key == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing object key")
		return
	}

	bucketConfig := findBucketConfig(bucketID)
	if bucketConfig == nil {
		writeErrorResponse(w, http.StatusNotFound, "bucket configuration not found")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "failed to get file from request")
		return
	}
	defer file.Close()

	client := createS3Client(*bucketConfig)
	contentType := detectContentType(key)

	err = uploadS3Object(client, bucketConfig.Name, key, contentType, file)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to upload file: %v", err))
		return
	}

	writeJSONResponse(w, UploadResponse{
		Message: "File uploaded successfully",
		Key:     key,
		Size:    header.Size,
	})
}

// deleteObjectHandler handles DELETE /delete
func deleteObjectHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	bucketID := r.URL.Query().Get("bucket")
	if bucketID == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing bucket ID")
		return
	}

	key := r.URL.Query().Get("key")
	if key == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing object key")
		return
	}

	bucketConfig := findBucketConfig(bucketID)
	if bucketConfig == nil {
		writeErrorResponse(w, http.StatusNotFound, "bucket configuration not found")
		return
	}

	client := createS3Client(*bucketConfig)

	// Check if it's a folder (ends with /) - delete all objects with this prefix
	if isFolder(key) {
		count, err := deleteS3Folder(client, bucketConfig.Name, key)
		if err != nil {
			writeErrorResponse(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSONResponse(w, DeleteResponse{
			Message: "Folder deleted successfully",
			Key:     key,
			Count:   count,
		})
	} else {
		// Delete single object
		err := deleteS3Object(client, bucketConfig.Name, key)
		if err != nil {
			writeErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to delete object: %v", err))
			return
		}

		writeJSONResponse(w, DeleteResponse{
			Message: "Object deleted successfully",
			Key:     key,
		})
	}
}

// getObjectMetadataHandler handles GET /metadata
func getObjectMetadataHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	bucketID := r.URL.Query().Get("bucket")
	if bucketID == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing bucket ID")
		return
	}

	key := r.URL.Query().Get("key")
	if key == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing object key")
		return
	}

	bucketConfig := findBucketConfig(bucketID)
	if bucketConfig == nil {
		writeErrorResponse(w, http.StatusNotFound, "bucket configuration not found")
		return
	}

	client := createS3Client(*bucketConfig)
	metadata, err := getS3ObjectMetadata(client, bucketConfig.Name, key)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSONResponse(w, metadata)
}

// uploadFromPathHandler handles POST /upload-paths
func uploadFromPathHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var requestData UploadFromPathRequest
	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if requestData.BucketID == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing bucket ID")
		return
	}

	if len(requestData.Files) == 0 {
		writeErrorResponse(w, http.StatusBadRequest, "no files provided")
		return
	}

	bucketConfig := findBucketConfig(requestData.BucketID)
	if bucketConfig == nil {
		writeErrorResponse(w, http.StatusNotFound, "bucket configuration not found")
		return
	}

	client := createS3Client(*bucketConfig)
	uploadedFiles := []map[string]interface{}{}
	failedFiles := []map[string]interface{}{}

	// Collect all files from paths (including directories)
	allFiles := []string{}
	for _, inputPath := range requestData.Files {
		files, err := collectFilesFromPath(inputPath)
		if err != nil {
			failedFiles = append(failedFiles, map[string]interface{}{
				"path":  inputPath,
				"error": fmt.Sprintf("failed to process path: %v", err),
			})
			continue
		}
		allFiles = append(allFiles, files...)
	}

	for _, filePath := range allFiles {
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

		// Skip directories (should not happen after collectFilesFromPath)
		if fileInfo.IsDir() {
			file.Close()
			continue
		}

		// Calculate the S3 key (relative path from base path + current path)
		var s3Key string
		if requestData.BasePath != "" {
			relPath := trimPathPrefix(filePath, requestData.BasePath)
			s3Key = relPath
		} else {
			// Find common base from all input paths for maintaining structure
			if len(requestData.Files) == 1 {
				// Single path input - check if it's a directory
				inputPath := requestData.Files[0]
				if inputFileInfo, err := os.Stat(inputPath); err == nil && inputFileInfo.IsDir() {
					// Include the directory name in the S3 key
					dirName := filepath.Base(inputPath)
					relPath := trimPathPrefix(filePath, inputPath)
					s3Key = dirName + "/" + relPath
				} else {
					s3Key = filepath.Base(filePath)
				}
			} else {
				s3Key = filepath.Base(filePath)
			}
		}

		// Prepend current path if we're in a subfolder
		if requestData.CurrentPath != "" {
			s3Key = buildS3Key(requestData.CurrentPath, s3Key)
		}

		// Detect content type and upload
		contentType := detectContentType(s3Key)
		err = uploadS3Object(client, bucketConfig.Name, s3Key, contentType, file)
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

	writeJSONResponse(w, UploadResponse{
		Message:       fmt.Sprintf("Uploaded %d files, %d failed", len(uploadedFiles), len(failedFiles)),
		UploadedFiles: uploadedFiles,
		FailedFiles:   failedFiles,
		TotalFiles:    len(allFiles),
	})
}

// countFilesHandler handles POST /count-files
func countFilesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var requestData struct {
		Path string `json:"path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if requestData.Path == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing path")
		return
	}

	files, err := collectFilesFromPath(requestData.Path)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to count files: %v", err))
		return
	}

	writeJSONResponse(w, map[string]interface{}{
		"count": len(files),
		"path":  requestData.Path,
	})
}

// deleteBucketConfigHandler handles DELETE /bucket
func deleteBucketConfigHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	bucketID := r.URL.Query().Get("id")
	if bucketID == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing bucket ID")
		return
	}

	err := removeBucketFromConfig(bucketID)
	if err != nil {
		writeErrorResponse(w, http.StatusNotFound, err.Error())
		return
	}

	writeJSONResponse(w, map[string]string{
		"message": "Bucket configuration deleted successfully",
		"id":      bucketID,
	})
}

// updateBucketConfigHandler handles PUT /bucket
func updateBucketConfigHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" {
		writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var bucketConfig BucketConfig
	if err := json.NewDecoder(r.Body).Decode(&bucketConfig); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if bucketConfig.ID == "" {
		writeErrorResponse(w, http.StatusBadRequest, "missing bucket ID")
		return
	}

	if bucketConfig.Name == "" || bucketConfig.AccessKey == "" || bucketConfig.SecretKey == "" || bucketConfig.Region == "" {
		writeErrorResponse(w, http.StatusBadRequest, "Name, AccessKey, SecretKey, and Region are required")
		return
	}

	if bucketConfig.DisplayName == "" {
		bucketConfig.DisplayName = bucketConfig.Name
	}

	err := updateBucketInConfig(bucketConfig)
	if err != nil {
		writeErrorResponse(w, http.StatusNotFound, err.Error())
		return
	}

	writeJSONResponse(w, map[string]string{
		"message": "Bucket configuration updated successfully",
		"id":      bucketConfig.ID,
	})
}
