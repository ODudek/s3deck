package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
)

var (
	appConfig  Config
	configPath string
)

// initConfig initializes the configuration system
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

// loadConfig loads the configuration from file
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

// saveConfig saves the current configuration to file
func saveConfig() error {
	data, err := json.MarshalIndent(appConfig, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(configPath, data, 0o644)
}

// getConfig returns the current application configuration
func getConfig() Config {
	return appConfig
}

// addBucketToConfig adds a new bucket configuration
func addBucketToConfig(bucketConfig BucketConfig) error {
	appConfig.Buckets = append(appConfig.Buckets, bucketConfig)
	return saveConfig()
}

// findBucketConfig finds a bucket configuration by ID
func findBucketConfig(bucketID string) *BucketConfig {
	for _, bc := range appConfig.Buckets {
		if bc.ID == bucketID {
			return &bc
		}
	}
	return nil
}

// removeBucketFromConfig removes a bucket configuration by ID
func removeBucketFromConfig(bucketID string) error {
	for i, bucket := range appConfig.Buckets {
		if bucket.ID == bucketID {
			// Remove bucket from slice
			appConfig.Buckets = append(appConfig.Buckets[:i], appConfig.Buckets[i+1:]...)
			return saveConfig()
		}
	}
	return fmt.Errorf("bucket with ID %s not found", bucketID)
}

// updateBucketInConfig updates an existing bucket configuration
func updateBucketInConfig(updatedBucket BucketConfig) error {
	for i, bucket := range appConfig.Buckets {
		if bucket.ID == updatedBucket.ID {
			appConfig.Buckets[i] = updatedBucket
			return saveConfig()
		}
	}
	return fmt.Errorf("bucket with ID %s not found", updatedBucket.ID)
}
