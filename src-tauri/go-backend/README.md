# S3 Deck - Go Backend

This is the Go backend for S3 Deck, providing HTTP API endpoints for S3 operations.

## Architecture

The backend has been refactored into a modular structure for better maintainability:

```
go-backend/
├── main.go         # Application entry point and HTTP server setup
├── models.go       # Data structures and type definitions
├── config.go       # Configuration management (load/save/access)
├── s3client.go     # S3 client creation and S3 operations
├── handlers.go     # HTTP request handlers
├── utils.go        # Utility functions (formatting, validation, etc.)
└── README.md       # This file
```

## File Descriptions

### `main.go`
- Application entry point
- HTTP server initialization
- Route registration with CORS middleware

### `models.go`
- `BucketConfig`: S3 bucket configuration structure
- `Config`: Application configuration wrapper
- `FileItem`: File/folder representation
- `UploadResponse`, `DeleteResponse`, `ErrorResponse`: API response structures

### `config.go`
- Configuration file management (`~/.s3deck/config.json`)
- Functions: `initConfig()`, `loadConfig()`, `saveConfig()`, `findBucketConfig()`
- Global configuration state management

### `s3client.go`
- S3 client creation with AWS SDK v2
- Core S3 operations: `listS3Objects()`, `uploadS3Object()`, `deleteS3Object()`, etc.
- Support for custom endpoints (MinIO, other S3-compatible services)

### `handlers.go`
- HTTP request handlers for all API endpoints
- Request validation and error handling
- JSON response formatting with proper HTTP status codes

### `utils.go`
- Utility functions: file size formatting, content type detection
- Helper functions for path manipulation and validation
- Random ID generation for bucket configurations

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/buckets` | List configured buckets |
| GET    | `/objects?bucket=ID&prefix=PATH` | List objects in bucket |
| POST   | `/add-bucket` | Add new bucket configuration |
| POST   | `/upload` | Upload single file |
| POST   | `/upload-paths` | Upload multiple files from local paths |
| DELETE | `/delete?bucket=ID&key=KEY` | Delete object or folder |
| GET    | `/metadata?bucket=ID&key=KEY` | Get object metadata |

## Development

### Build
```bash
go build -o s3deck-backend .
```

### Run
```bash
go run .
```

### Run with hot reload (requires `air`)
```bash
air
```

## Dependencies

- AWS SDK for Go v2: S3 operations
- Standard library only for HTTP server and JSON handling

## Configuration

Bucket configurations are stored in `~/.s3deck/config.json`:

```json
{
  "buckets": [
    {
      "id": "abcd1234",
      "name": "my-bucket",
      "displayName": "My S3 Bucket",
      "region": "us-east-1",
      "accessKey": "AKIA...",
      "secretKey": "...",
      "endpoint": "https://s3.example.com"
    }
  ]
}
```

## Security Notes

- Credentials are stored in plain text in the config file
- CORS is set to allow all origins for development (`Access-Control-Allow-Origin: *`)
- For production use, consider encrypting the config file or using OS credential stores

## Error Handling

All endpoints return consistent JSON error responses:

```json
{
  "error": "Bad Request",
  "message": "Detailed error description"
}
```

HTTP status codes are used appropriately:
- `200`: Success
- `400`: Bad Request (missing parameters, invalid JSON)
- `404`: Not Found (bucket config not found)
- `405`: Method Not Allowed
- `500`: Internal Server Error (S3 operation failed)