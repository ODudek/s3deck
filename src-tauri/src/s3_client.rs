use crate::models::{BucketConfig, FileItem, ObjectMetadata, Result, S3DeckError};
use aws_config::{BehaviorVersion, Region};
use aws_sdk_s3::{config::Credentials, primitives::ByteStream, Client, Config};
use chrono::DateTime;
use std::collections::HashMap;
use std::path::Path;
use tokio::fs;

pub struct S3Client {
    client: Client,
    bucket_name: String,
}

impl S3Client {
    pub async fn new(bucket_config: &BucketConfig) -> Result<Self> {
        let credentials = Credentials::new(
            &bucket_config.access_key,
            &bucket_config.secret_key,
            None,
            None,
            "s3deck",
        );

        let region = Region::new(bucket_config.region.clone());

        let mut config_builder = Config::builder()
            .credentials_provider(credentials)
            .region(region)
            .behavior_version(BehaviorVersion::latest());

        // Set custom endpoint if provided
        if let Some(endpoint) = &bucket_config.endpoint {
            config_builder = config_builder.endpoint_url(endpoint);
        }

        let config = config_builder.build();
        let client = Client::from_conf(config);

        Ok(Self {
            client,
            bucket_name: bucket_config.name.clone(),
        })
    }

    pub async fn list_objects(&self, prefix: Option<&str>) -> Result<Vec<FileItem>> {
        let mut request = self
            .client
            .list_objects_v2()
            .bucket(&self.bucket_name)
            .delimiter("/");

        if let Some(prefix) = prefix {
            request = request.prefix(prefix);
        }

        let response = request
            .send()
            .await
            .map_err(|e| S3DeckError::S3(format!("Failed to list objects: {}", e)))?;

        let mut items = Vec::new();

        // Add folders (common prefixes)
        for prefix in response.common_prefixes() {
            if let Some(prefix_str) = prefix.prefix() {
                let name = prefix_str.trim_end_matches('/');
                let name = if let Some(pos) = name.rfind('/') {
                    &name[pos + 1..]
                } else {
                    name
                };

                items.push(FileItem {
                    key: prefix_str.to_string(),
                    name: name.to_string(),
                    size: 0,
                    is_folder: true,
                    last_modified: None,
                });
            }
        }

        // Add files
        for object in response.contents() {
            if let Some(key) = object.key() {
                // Skip folder markers
                if key.ends_with('/') {
                    continue;
                }

                let name = if let Some(pos) = key.rfind('/') {
                    &key[pos + 1..]
                } else {
                    key
                };

                let last_modified = object
                    .last_modified()
                    .map(|dt| DateTime::from_timestamp(dt.secs(), dt.subsec_nanos()).unwrap_or_default());

                items.push(FileItem {
                    key: key.to_string(),
                    name: name.to_string(),
                    size: object.size().unwrap_or(0),
                    is_folder: false,
                    last_modified,
                });
            }
        }

        Ok(items)
    }

    pub async fn upload_file(&self, key: &str, file_path: &Path) -> Result<i64> {
        let file_content = fs::read(file_path).await?;
        let file_size = file_content.len() as i64;

        let content_type = self.detect_content_type(key);
        let body = ByteStream::from(file_content);

        self.client
            .put_object()
            .bucket(&self.bucket_name)
            .key(key)
            .content_type(content_type)
            .body(body)
            .send()
            .await
            .map_err(|e| S3DeckError::S3(format!("Failed to upload file: {}", e)))?;

        Ok(file_size)
    }

    pub async fn delete_object(&self, key: &str) -> Result<()> {
        self.client
            .delete_object()
            .bucket(&self.bucket_name)
            .key(key)
            .send()
            .await
            .map_err(|e| S3DeckError::S3(format!("Failed to delete object: {}", e)))?;

        Ok(())
    }

    pub async fn delete_folder(&self, prefix: &str) -> Result<i32> {
        let objects = self.list_all_objects_with_prefix(prefix).await?;
        let mut deleted_count = 0;

        for object_key in objects {
            match self.delete_object(&object_key).await {
                Ok(_) => deleted_count += 1,
                Err(e) => {
                    eprintln!("Failed to delete object {}: {}", object_key, e);
                }
            }
        }

        Ok(deleted_count)
    }

    pub async fn get_object_metadata(&self, key: &str) -> Result<ObjectMetadata> {
        let response = self
            .client
            .head_object()
            .bucket(&self.bucket_name)
            .key(key)
            .send()
            .await
            .map_err(|e| S3DeckError::S3(format!("Failed to get object metadata: {}", e)))?;

        let content_length = response.content_length().unwrap_or(0);
        let size_formatted = self.format_file_size(content_length);

        let last_modified = response
            .last_modified()
            .map(|dt| DateTime::from_timestamp(dt.secs(), dt.subsec_nanos()).unwrap_or_default());

        let mut metadata_map = HashMap::new();
        if let Some(metadata) = response.metadata() {
            for (k, v) in metadata {
                metadata_map.insert(k.clone(), v.clone());
            }
        }

        Ok(ObjectMetadata {
            key: key.to_string(),
            content_type: response.content_type().map(|s| s.to_string()),
            content_length,
            last_modified,
            etag: response.e_tag().map(|s| s.to_string()),
            storage_class: response.storage_class().map(|s| s.as_str().to_string()),
            size_formatted,
            metadata: metadata_map,
        })
    }

    async fn list_all_objects_with_prefix(&self, prefix: &str) -> Result<Vec<String>> {
        let mut objects = Vec::new();
        let mut continuation_token = None;

        loop {
            let mut request = self
                .client
                .list_objects_v2()
                .bucket(&self.bucket_name)
                .prefix(prefix);

            if let Some(token) = continuation_token {
                request = request.continuation_token(token);
            }

            let response = request
                .send()
                .await
                .map_err(|e| S3DeckError::S3(format!("Failed to list objects: {}", e)))?;

            for object in response.contents() {
                if let Some(key) = object.key() {
                    objects.push(key.to_string());
                }
            }

            if response.is_truncated().unwrap_or(false) {
                continuation_token = response.next_continuation_token().map(|s| s.to_string());
            } else {
                break;
            }
        }

        Ok(objects)
    }

    fn detect_content_type(&self, file_path: &str) -> String {
        let extension = Path::new(file_path)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");

        match extension.to_lowercase().as_str() {
            "html" | "htm" => "text/html",
            "css" => "text/css",
            "js" => "application/javascript",
            "json" => "application/json",
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "gif" => "image/gif",
            "svg" => "image/svg+xml",
            "pdf" => "application/pdf",
            "txt" => "text/plain",
            "md" => "text/markdown",
            "zip" => "application/zip",
            "tar" => "application/x-tar",
            "gz" => "application/gzip",
            _ => "application/octet-stream",
        }
        .to_string()
    }

    fn format_file_size(&self, size: i64) -> String {
        const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
        let mut size = size as f64;
        let mut unit_index = 0;

        while size >= 1024.0 && unit_index < UNITS.len() - 1 {
            size /= 1024.0;
            unit_index += 1;
        }

        if unit_index == 0 {
            format!("{} {}", size as i64, UNITS[unit_index])
        } else {
            format!("{:.1} {}", size, UNITS[unit_index])
        }
    }
}