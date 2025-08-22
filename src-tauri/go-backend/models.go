package main

import "time"

// BucketConfig represents S3 bucket configuration
type BucketConfig struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Region      string `json:"region"`
	AccessKey   string `json:"accessKey"`
	SecretKey   string `json:"secretKey"`
	Endpoint    string `json:"endpoint,omitempty"`
}

// Config represents the application configuration
type Config struct {
	Buckets []BucketConfig `json:"buckets"`
}

// Object represents an S3 object (legacy, kept for compatibility)
type Object struct {
	Key  string `json:"key"`
	Size int64  `json:"size"`
}

// FileItem represents a file or folder in S3
type FileItem struct {
	Key          string     `json:"key"`
	Name         string     `json:"name"`
	Size         int64      `json:"size"`
	IsFolder     bool       `json:"isFolder"`
	LastModified *time.Time `json:"lastModified,omitempty"`
}

// UploadFromPathRequest represents the request structure for uploading files from local paths
type UploadFromPathRequest struct {
	BucketID    string   `json:"bucket"`
	BasePath    string   `json:"basePath"`
	CurrentPath string   `json:"currentPath"`
	Files       []string `json:"files"`
}

// UploadResponse represents the response structure for upload operations
type UploadResponse struct {
	Message       string                   `json:"message"`
	UploadedFiles []map[string]interface{} `json:"uploadedFiles,omitempty"`
	FailedFiles   []map[string]interface{} `json:"failedFiles,omitempty"`
	TotalFiles    int                      `json:"totalFiles,omitempty"`
	Key           string                   `json:"key,omitempty"`
	Size          int64                    `json:"size,omitempty"`
}

// DeleteResponse represents the response structure for delete operations
type DeleteResponse struct {
	Message string `json:"message"`
	Key     string `json:"key"`
	Count   int    `json:"count,omitempty"`
}

// ErrorResponse represents the standard error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}
