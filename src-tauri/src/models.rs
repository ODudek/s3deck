use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BucketConfig {
    pub id: String,
    pub name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub region: String,
    #[serde(rename = "accessKey")]
    pub access_key: String,
    #[serde(rename = "secretKey")]
    pub secret_key: String,
    pub endpoint: Option<String>,
    #[serde(rename = "awsProfile")]
    pub aws_profile: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub buckets: Vec<BucketConfig>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            buckets: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub key: String,
    pub name: String,
    pub size: i64,
    #[serde(rename = "isFolder")]
    pub is_folder: bool,
    #[serde(rename = "lastModified")]
    pub last_modified: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadRequest {
    pub bucket: String,
    #[serde(rename = "basePath")]
    pub base_path: String,
    #[serde(rename = "currentPath")]
    pub current_path: String,
    pub files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadFileInfo {
    pub key: String,
    pub size: i64,
    pub status: String,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadResponse {
    pub message: String,
    #[serde(rename = "uploadedFiles")]
    pub uploaded_files: Vec<UploadFileInfo>,
    #[serde(rename = "failedFiles")]
    pub failed_files: Vec<UploadFileInfo>,
    #[serde(rename = "totalFiles")]
    pub total_files: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteResponse {
    pub message: String,
    pub key: String,
    pub count: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObjectMetadata {
    pub key: String,
    #[serde(rename = "contentType")]
    pub content_type: Option<String>,
    #[serde(rename = "contentLength")]
    pub content_length: i64,
    #[serde(rename = "lastModified")]
    pub last_modified: Option<DateTime<Utc>>,
    pub etag: Option<String>,
    #[serde(rename = "storageClass")]
    pub storage_class: Option<String>,
    #[serde(rename = "sizeFormatted")]
    pub size_formatted: String,
    pub metadata: std::collections::HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenameRequest {
    pub bucket_id: String,
    pub old_key: String,
    pub new_key: String,
    pub is_folder: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenameResponse {
    pub message: String,
    pub old_key: String,
    pub new_key: String,
    pub moved_files: Option<Vec<String>>,
    pub total_moved: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AwsProfile {
    pub name: String,
    pub region: Option<String>,
    pub status: ProfileStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProfileStatus {
    Valid,
    Expired,
    Invalid,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileBucket {
    pub name: String,
    pub region: String,
    #[serde(rename = "creationDate")]
    pub creation_date: Option<DateTime<Utc>>,
}

#[derive(Debug, thiserror::Error, Serialize)]
pub enum S3DeckError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("S3 error: {0}")]
    S3(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Bucket not found: {0}")]
    BucketNotFound(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("AWS Profile error: {0}")]
    AwsProfile(String),
}

impl From<std::io::Error> for S3DeckError {
    fn from(err: std::io::Error) -> Self {
        S3DeckError::Io(err.to_string())
    }
}

impl From<serde_json::Error> for S3DeckError {
    fn from(err: serde_json::Error) -> Self {
        S3DeckError::Serialization(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, S3DeckError>;
