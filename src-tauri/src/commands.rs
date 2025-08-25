use crate::{
    config::ConfigManager,
    content_type::validate_filename,
    models::{
        BucketConfig, DeleteResponse, FileItem, ObjectMetadata, RenameRequest, RenameResponse,
        Result, S3DeckError, UploadFileInfo, UploadRequest, UploadResponse,
    },
    s3_client::S3Client,
};
use std::future::Future;
use std::path::Path;
use std::pin::Pin;
use tauri::command;

// Config management commands
#[command]
pub async fn get_buckets() -> Result<Vec<BucketConfig>> {
    let config_manager = ConfigManager::new()?;
    config_manager.get_all_buckets()
}

#[command]
pub async fn add_bucket(bucket: BucketConfig) -> Result<Vec<BucketConfig>> {
    let config_manager = ConfigManager::new()?;
    config_manager.add_bucket(bucket)
}

#[command]
pub async fn update_bucket(bucket: BucketConfig) -> Result<Vec<BucketConfig>> {
    let config_manager = ConfigManager::new()?;
    config_manager.update_bucket(bucket)
}

#[command]
pub async fn delete_bucket_config(bucket_id: String) -> Result<Vec<BucketConfig>> {
    let config_manager = ConfigManager::new()?;
    config_manager.delete_bucket(&bucket_id)
}

#[command]
pub async fn get_bucket(bucket_id: String) -> Result<BucketConfig> {
    let config_manager = ConfigManager::new()?;
    config_manager.get_bucket(&bucket_id)
}

// S3 operations commands
#[command]
pub async fn list_objects(bucket_id: String, prefix: Option<String>) -> Result<Vec<FileItem>> {
    let config_manager = ConfigManager::new()?;
    let bucket_config = config_manager.get_bucket(&bucket_id)?;

    let s3_client = S3Client::new(&bucket_config).await?;
    s3_client.list_objects(prefix.as_deref()).await
}

#[command]
pub async fn delete_object(bucket_id: String, key: String) -> Result<DeleteResponse> {
    let config_manager = ConfigManager::new()?;
    let bucket_config = config_manager.get_bucket(&bucket_id)?;

    let s3_client = S3Client::new(&bucket_config).await?;

    if key.ends_with('/') {
        // It's a folder
        let count = s3_client.delete_folder(&key).await?;
        Ok(DeleteResponse {
            message: format!("Deleted folder and {} objects", count),
            key,
            count: Some(count),
        })
    } else {
        // It's a file
        s3_client.delete_object(&key).await?;
        Ok(DeleteResponse {
            message: "Object deleted successfully".to_string(),
            key,
            count: None,
        })
    }
}

#[command]
pub async fn get_object_metadata(bucket_id: String, key: String) -> Result<ObjectMetadata> {
    let config_manager = ConfigManager::new()?;
    let bucket_config = config_manager.get_bucket(&bucket_id)?;

    let s3_client = S3Client::new(&bucket_config).await?;
    s3_client.get_object_metadata(&key).await
}

#[command]
pub async fn upload_files(request: UploadRequest) -> Result<UploadResponse> {
    let config_manager = ConfigManager::new()?;
    let bucket_config = config_manager.get_bucket(&request.bucket)?;

    let s3_client = S3Client::new(&bucket_config).await?;

    let mut uploaded_files = Vec::new();
    let mut failed_files = Vec::new();

    for file_path in &request.files {
        let path = Path::new(file_path);

        if !path.exists() {
            failed_files.push(UploadFileInfo {
                key: file_path.clone(),
                size: 0,
                status: "failed".to_string(),
                error: Some("File does not exist".to_string()),
            });
            continue;
        }

        if path.is_dir() {
            // Handle directory: recursively upload all files
            match upload_directory(
                &s3_client,
                &request.base_path,
                &request.current_path,
                file_path,
            )
            .await
            {
                Ok(mut dir_results) => {
                    uploaded_files.append(&mut dir_results.0);
                    failed_files.append(&mut dir_results.1);
                }
                Err(e) => {
                    failed_files.push(UploadFileInfo {
                        key: file_path.clone(),
                        size: 0,
                        status: "failed".to_string(),
                        error: Some(format!("Failed to process directory: {}", e)),
                    });
                }
            }
        } else {
            // Handle single file
            let s3_key = build_s3_key(&request.base_path, &request.current_path, file_path)?;

            match s3_client.upload_file(&s3_key, path).await {
                Ok(size) => {
                    uploaded_files.push(UploadFileInfo {
                        key: s3_key,
                        size,
                        status: "completed".to_string(),
                        error: None,
                    });
                }
                Err(e) => {
                    failed_files.push(UploadFileInfo {
                        key: s3_key,
                        size: 0,
                        status: "failed".to_string(),
                        error: Some(e.to_string()),
                    });
                }
            }
        }
    }

    let total_files = request.files.len();
    let success_count = uploaded_files.len();
    let failed_count = failed_files.len();

    let message = if failed_count == 0 {
        format!("Successfully uploaded {} file(s)", success_count)
    } else if success_count == 0 {
        format!("Failed to upload all {} file(s)", failed_count)
    } else {
        format!(
            "Uploaded {} file(s), {} failed",
            success_count, failed_count
        )
    };

    Ok(UploadResponse {
        message,
        uploaded_files,
        failed_files,
        total_files,
    })
}

#[command]
pub async fn count_files(files: Vec<String>) -> Result<usize> {
    let mut count = 0;

    for file_path in files {
        let path = Path::new(&file_path);

        if path.is_file() {
            count += 1;
        } else if path.is_dir() {
            count += count_files_in_directory(path)?;
        }
    }

    Ok(count)
}

// Utility functions
fn build_s3_key(base_path: &str, current_path: &str, file_path: &str) -> Result<String> {
    let path = Path::new(file_path);
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| S3DeckError::InvalidPath(file_path.to_string()))?;

    let mut s3_key = String::new();

    // Add current path prefix (where we are in S3)
    if !current_path.is_empty() {
        s3_key.push_str(current_path);
        if !s3_key.ends_with('/') {
            s3_key.push('/');
        }
    }

    // Handle directory structure preservation
    if !base_path.is_empty() {
        // If we have a base path, try to get relative path from it
        if let Ok(relative_path) = path.strip_prefix(base_path) {
            // Use the full relative path (including subdirectories)
            if let Some(relative_str) = relative_path.to_str() {
                s3_key.push_str(relative_str);
                return Ok(s3_key);
            }
        }
    } else {
        // For drag & drop of folders, we want to preserve the folder name and structure
        // Find the top-level folder name from the path
        let path_components: Vec<&str> = file_path.split('/').collect();
        if path_components.len() > 1 {
            // Find a reasonable starting point - look for common parent directories to skip
            let mut start_idx = 0;
            for (i, component) in path_components.iter().enumerate() {
                if *component == "Documents" || *component == "Desktop" || *component == "Downloads"
                {
                    start_idx = i + 1;
                    break;
                }
            }

            // If no common directory found, and we have multiple components,
            // use the last 2 components (folder/file.ext)
            if start_idx == 0 && path_components.len() > 2 {
                start_idx = path_components.len() - 2;
            }

            if start_idx < path_components.len() {
                let relative_path = path_components[start_idx..].join("/");
                s3_key.push_str(&relative_path);
                return Ok(s3_key);
            }
        }
    }

    // Fallback: just add the filename
    s3_key.push_str(file_name);

    Ok(s3_key)
}

fn count_files_in_directory(dir: &Path) -> Result<usize> {
    let mut count = 0;

    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_file() {
                    count += 1;
                } else if path.is_dir() {
                    count += count_files_in_directory(&path)?;
                }
            }
        }
    }

    Ok(count)
}

#[command]
pub async fn get_folder_latest_modified(bucket_id: String, folder_key: String) -> Result<Option<chrono::DateTime<chrono::Utc>>> {
    let config_manager = ConfigManager::new()?;
    let bucket_config = config_manager.get_bucket(&bucket_id)?;

    let s3_client = S3Client::new(&bucket_config).await?;
    s3_client.get_folder_latest_modified(&folder_key).await
}

#[command]
pub async fn create_folder(bucket_id: String, folder_path: String) -> Result<String> {
    let config_manager = ConfigManager::new()?;
    let bucket_config = config_manager.get_bucket(&bucket_id)?;

    let s3_client = S3Client::new(&bucket_config).await?;
    s3_client.create_folder(&folder_path).await
}

#[command]
pub async fn rename_object(request: RenameRequest) -> Result<RenameResponse> {
    // Validate the new filename
    let new_name = if request.is_folder {
        // For folders, just validate the folder name
        std::path::Path::new(&request.new_key)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(&request.new_key)
    } else {
        // For files, validate the full filename including extension
        std::path::Path::new(&request.new_key)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(&request.new_key)
    };

    if !validate_filename(new_name) {
        return Err(S3DeckError::InvalidPath(
            "Invalid filename: contains invalid characters or reserved names".to_string(),
        ));
    }

    // Check if old and new keys are the same
    if request.old_key == request.new_key {
        return Err(S3DeckError::InvalidPath(
            "New name must be different from the current name".to_string(),
        ));
    }

    let config_manager = ConfigManager::new()?;
    let bucket_config = config_manager.get_bucket(&request.bucket_id)?;
    let s3_client = S3Client::new(&bucket_config).await?;

    s3_client
        .rename_object(&request.old_key, &request.new_key, request.is_folder)
        .await
}

// Helper function to recursively upload a directory
fn upload_directory<'a>(
    s3_client: &'a S3Client,
    base_path: &'a str,
    current_path: &'a str,
    dir_path: &'a str,
) -> Pin<Box<dyn Future<Output = Result<(Vec<UploadFileInfo>, Vec<UploadFileInfo>)>> + Send + 'a>> {
    Box::pin(async move {
        let mut uploaded_files = Vec::new();
        let mut failed_files = Vec::new();

        let dir = Path::new(dir_path);

        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                let path_str = path.to_string_lossy().to_string();

                if path.is_file() {
                    // Upload the file
                    let s3_key = build_s3_key(base_path, current_path, &path_str)?;

                    match s3_client.upload_file(&s3_key, &path).await {
                        Ok(size) => {
                            uploaded_files.push(UploadFileInfo {
                                key: s3_key,
                                size,
                                status: "completed".to_string(),
                                error: None,
                            });
                        }
                        Err(e) => {
                            failed_files.push(UploadFileInfo {
                                key: s3_key,
                                size: 0,
                                status: "failed".to_string(),
                                error: Some(e.to_string()),
                            });
                        }
                    }
                } else if path.is_dir() {
                    // Recursively process subdirectory
                    match upload_directory(s3_client, base_path, current_path, &path_str).await {
                        Ok(mut dir_results) => {
                            uploaded_files.append(&mut dir_results.0);
                            failed_files.append(&mut dir_results.1);
                        }
                        Err(e) => {
                            failed_files.push(UploadFileInfo {
                                key: path_str,
                                size: 0,
                                status: "failed".to_string(),
                                error: Some(format!("Failed to process subdirectory: {}", e)),
                            });
                        }
                    }
                }
            }
        } else {
            return Err(S3DeckError::Io(format!(
                "Cannot read directory: {}",
                dir_path
            )));
        }

        Ok((uploaded_files, failed_files))
    })
}
