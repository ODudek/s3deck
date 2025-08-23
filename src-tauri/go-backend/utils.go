package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"mime"
	"os"
	"path/filepath"
	"strings"
)

// generateRandomID generates a random hex ID
func generateRandomID() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// formatFileSize formats file size in human readable format
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

// detectContentType detects MIME type from file extension
func detectContentType(key string) string {
	contentType := mime.TypeByExtension(filepath.Ext(key))

	// Special handling for specific file types
	if strings.HasSuffix(strings.ToLower(key), ".map") || strings.HasSuffix(strings.ToLower(key), ".js.map") {
		contentType = "application/json"
	} else if contentType == "" {
		contentType = "application/octet-stream"
	}

	return contentType
}

// trimPathPrefix removes the prefix from a path and returns the relative path
func trimPathPrefix(fullPath, prefix string) string {
	if prefix == "" {
		return fullPath
	}

	result := strings.TrimPrefix(fullPath, prefix)
	result = strings.TrimPrefix(result, "/")
	return result
}

// buildS3Key builds an S3 key from current path and filename
func buildS3Key(currentPath, fileName string) string {
	if currentPath == "" {
		return fileName
	}
	return strings.TrimSuffix(currentPath, "/") + "/" + fileName
}

// isFolder checks if a key represents a folder (ends with /)
func isFolder(key string) bool {
	return strings.HasSuffix(key, "/")
}

// collectFilesFromPath recursively collects all files from a given path
// If path is a file, returns just that file
// If path is a directory, returns all files in the directory recursively
func collectFilesFromPath(path string) ([]string, error) {
	fileInfo, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("failed to stat path %s: %v", path, err)
	}

	var files []string

	if fileInfo.IsDir() {
		// Walk the directory recursively
		err := filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			// Skip directories, only collect files
			if !info.IsDir() {
				files = append(files, filePath)
			}

			return nil
		})
		if err != nil {
			return nil, fmt.Errorf("failed to walk directory %s: %v", path, err)
		}
	} else {
		// It's a single file
		files = append(files, path)
	}

	return files, nil
}
