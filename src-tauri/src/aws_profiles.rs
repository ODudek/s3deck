use crate::models::{AwsProfile, ProfileBucket, ProfileStatus, Result, S3DeckError};
use aws_config::BehaviorVersion;
use aws_sdk_s3::Client;
use chrono::DateTime;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

pub struct AwsProfileManager;

impl AwsProfileManager {
    pub fn new() -> Self {
        Self
    }

    /// Get list of available AWS profiles from ~/.aws/config
    pub fn get_aws_profiles(&self) -> Result<Vec<AwsProfile>> {
        let config_path = self.get_aws_config_path().map_err(|e| {
            S3DeckError::AwsProfile(format!("Failed to find AWS config path: {}", e))
        })?;

        if !config_path.exists() {
            return Ok(Vec::new());
        }

        let config_content = fs::read_to_string(&config_path).map_err(|e| {
            S3DeckError::AwsProfile(format!("Failed to read AWS config file: {}", e))
        })?;

        let profiles = self
            .parse_aws_config(&config_content)
            .map_err(|e| S3DeckError::AwsProfile(format!("Failed to parse AWS config: {}", e)))?;

        // Empty list is OK - will be handled by UI

        Ok(profiles)
    }

    /// Validate AWS profile and check if credentials are working
    pub async fn validate_aws_profile(&self, profile_name: &str) -> Result<ProfileStatus> {
        match self.create_s3_client_for_profile(profile_name).await {
            Ok(client) => {
                // Try to list buckets to validate credentials
                match client.list_buckets().send().await {
                    Ok(_) => Ok(ProfileStatus::Valid),
                    Err(e) => {
                        let error_msg = e.to_string().to_lowercase();
                        if error_msg.contains("expired") || error_msg.contains("invalid") {
                            Ok(ProfileStatus::Expired)
                        } else if error_msg.contains("access denied")
                            || error_msg.contains("forbidden")
                        {
                            Ok(ProfileStatus::Invalid)
                        } else {
                            Ok(ProfileStatus::Unknown)
                        }
                    }
                }
            }
            Err(_) => Ok(ProfileStatus::Invalid),
        }
    }

    /// Get buckets for a specific AWS profile
    pub async fn get_buckets_for_profile(&self, profile_name: &str) -> Result<Vec<ProfileBucket>> {
        let client = self.create_s3_client_for_profile(profile_name).await
            .map_err(|e| {
                let error_msg = e.to_string().to_lowercase();
                if error_msg.contains("no credentials") || error_msg.contains("credential") {
                    S3DeckError::S3(format!("No valid credentials found for profile '{}'. Please configure your AWS credentials.", profile_name))
                } else if error_msg.contains("profile") && error_msg.contains("not found") {
                    S3DeckError::S3(format!("AWS profile '{}' not found. Please check your AWS configuration.", profile_name))
                } else if error_msg.contains("region") {
                    S3DeckError::S3(format!("Invalid or missing region for profile '{}'. Please check your AWS configuration.", profile_name))
                } else {
                    S3DeckError::S3(format!("Failed to initialize AWS client for profile '{}': {}", profile_name, e))
                }
            })?;

        let response = client
            .list_buckets()
            .send()
            .await
            .map_err(|e| {
                let error_msg = e.to_string().to_lowercase();
                if error_msg.contains("expired") {
                    S3DeckError::S3(format!("Profile '{}' credentials have expired. Please run 'aws sso login' or refresh your credentials.", profile_name))
                } else if error_msg.contains("invalid") || error_msg.contains("access denied") || error_msg.contains("forbidden") {
                    S3DeckError::S3(format!("Profile '{}' credentials are invalid or access is denied. Please check your AWS permissions.", profile_name))
                } else if error_msg.contains("no credentials") || error_msg.contains("credential") {
                    S3DeckError::S3(format!("No valid credentials found for profile '{}'. Please configure your AWS credentials.", profile_name))
                } else if error_msg.contains("network") || error_msg.contains("connection") || error_msg.contains("timeout") {
                    S3DeckError::S3(format!("Network error when connecting with profile '{}'. Please check your internet connection.", profile_name))
                } else if error_msg.contains("region") {
                    S3DeckError::S3(format!("Invalid or missing region for profile '{}'. Please check your AWS configuration.", profile_name))
                } else {
                    S3DeckError::S3(format!("Failed to list buckets for profile '{}': {}. Please check your AWS configuration and credentials.", profile_name, e))
                }
            })?;

        let mut buckets = Vec::new();

        for bucket in response.buckets() {
            if let Some(bucket_name) = bucket.name() {
                // Get bucket location to determine region
                let region = self
                    .get_bucket_region(&client, bucket_name)
                    .await
                    .unwrap_or_else(|_| "us-east-1".to_string());

                let creation_date = bucket.creation_date().map(|dt| {
                    DateTime::from_timestamp(dt.secs(), dt.subsec_nanos()).unwrap_or_default()
                });

                buckets.push(ProfileBucket {
                    name: bucket_name.to_string(),
                    region,
                    creation_date,
                });
            }
        }

        buckets.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(buckets)
    }

    /// Get AWS config file path
    fn get_aws_config_path(&self) -> Result<PathBuf> {
        let home_dir = dirs::home_dir()
            .ok_or_else(|| S3DeckError::Config("Could not find home directory".to_string()))?;

        let config_path = home_dir.join(".aws").join("config");
        Ok(config_path)
    }

    /// Parse AWS config file and extract profiles
    fn parse_aws_config(&self, content: &str) -> Result<Vec<AwsProfile>> {
        let mut profiles = Vec::new();
        let mut current_profile: Option<String> = None;
        let mut profile_data: HashMap<String, String> = HashMap::new();

        for line in content.lines() {
            let line = line.trim();

            // Skip empty lines and comments
            if line.is_empty() || line.starts_with('#') {
                continue;
            }

            // Profile section header
            if line.starts_with('[') && line.ends_with(']') {
                // Save previous profile if exists
                if let Some(profile_name) = current_profile.take() {
                    let region = profile_data.get("region").cloned();
                    profiles.push(AwsProfile {
                        name: profile_name,
                        region,
                        status: ProfileStatus::Unknown, // Will be validated separately
                    });
                }

                // Parse new profile name
                let profile_section = &line[1..line.len() - 1];
                current_profile = if profile_section == "default" {
                    Some("default".to_string())
                } else if profile_section.starts_with("profile ") {
                    Some(profile_section[8..].to_string()) // Remove "profile " prefix
                } else {
                    Some(profile_section.to_string())
                };
                profile_data.clear();
            } else if let Some(eq_pos) = line.find('=') {
                // Key-value pair
                let key = line[..eq_pos].trim();
                let value = line[eq_pos + 1..].trim();
                profile_data.insert(key.to_string(), value.to_string());
            }
        }

        // Don't forget the last profile
        if let Some(profile_name) = current_profile {
            let region = profile_data.get("region").cloned();
            profiles.push(AwsProfile {
                name: profile_name,
                region,
                status: ProfileStatus::Unknown,
            });
        }

        Ok(profiles)
    }

    /// Create S3 client for a specific profile
    async fn create_s3_client_for_profile(&self, profile_name: &str) -> Result<Client> {
        let config = aws_config::defaults(BehaviorVersion::latest())
            .profile_name(profile_name)
            .load()
            .await;

        let s3_config = aws_sdk_s3::config::Builder::from(&config).build();
        let client = Client::from_conf(s3_config);

        Ok(client)
    }

    /// Get bucket region
    async fn get_bucket_region(&self, client: &Client, bucket_name: &str) -> Result<String> {
        match client
            .get_bucket_location()
            .bucket(bucket_name)
            .send()
            .await
        {
            Ok(response) => {
                let region = response
                    .location_constraint()
                    .map(|constraint| constraint.as_str())
                    .unwrap_or("us-east-1"); // Default to us-east-1 if no constraint

                // Handle special case where empty constraint means us-east-1
                if region.is_empty() {
                    Ok("us-east-1".to_string())
                } else {
                    Ok(region.to_string())
                }
            }
            Err(_) => Ok("us-east-1".to_string()), // Fallback to us-east-1
        }
    }
}
