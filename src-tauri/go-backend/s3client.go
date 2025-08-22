package main

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// createS3Client creates a new S3 client with the given bucket configuration
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

// listS3Objects lists objects in an S3 bucket with optional prefix
func listS3Objects(client *s3.Client, bucketName, prefix string) ([]FileItem, error) {
	input := &s3.ListObjectsV2Input{
		Bucket:    aws.String(bucketName),
		Delimiter: aws.String("/"),
	}

	if prefix != "" {
		input.Prefix = aws.String(prefix)
	}

	out, err := client.ListObjectsV2(context.TODO(), input)
	if err != nil {
		return nil, fmt.Errorf("failed to list objects: %w", err)
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
			Key:          *obj.Key,
			Name:         fileName,
			Size:         aws.ToInt64(obj.Size),
			IsFolder:     false,
			LastModified: obj.LastModified,
		})
	}

	return items, nil
}

// uploadS3Object uploads a file to S3
func uploadS3Object(client *s3.Client, bucketName, key, contentType string, body io.Reader) error {
	_, err := client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	return err
}

// deleteS3Object deletes an object from S3
func deleteS3Object(client *s3.Client, bucketName, key string) error {
	_, err := client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	return err
}

// deleteS3Folder deletes all objects with a given prefix (folder)
func deleteS3Folder(client *s3.Client, bucketName, prefix string) (int, error) {
	// List all objects with this prefix
	listInput := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucketName),
		Prefix: aws.String(prefix),
	}

	result, err := client.ListObjectsV2(context.TODO(), listInput)
	if err != nil {
		return 0, fmt.Errorf("failed to list objects: %w", err)
	}

	// Delete all objects
	deletedCount := 0
	for _, obj := range result.Contents {
		err := deleteS3Object(client, bucketName, *obj.Key)
		if err != nil {
			return deletedCount, fmt.Errorf("failed to delete object %s: %w", *obj.Key, err)
		}
		deletedCount++
	}

	return deletedCount, nil
}

// getS3ObjectMetadata gets metadata for an S3 object
func getS3ObjectMetadata(client *s3.Client, bucketName, key string) (map[string]interface{}, error) {
	headInput := &s3.HeadObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	}

	result, err := client.HeadObject(context.TODO(), headInput)
	if err != nil {
		return nil, fmt.Errorf("failed to get object metadata: %w", err)
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

	// Add computed fields
	if result.ContentLength != nil {
		size := aws.ToInt64(result.ContentLength)
		metadata["sizeFormatted"] = formatFileSize(size)
	}

	return metadata, nil
}
