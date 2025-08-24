use crate::models::{BucketConfig, Config, Result, S3DeckError};
use std::fs;
use std::path::PathBuf;

pub struct ConfigManager {
    config_path: PathBuf,
}

impl ConfigManager {
    pub fn new() -> Result<Self> {
        let config_dir = dirs::home_dir()
            .ok_or_else(|| S3DeckError::Config("Could not find home directory".to_string()))?
            .join(".s3deck");

        // Create config directory if it doesn't exist
        if !config_dir.exists() {
            fs::create_dir_all(&config_dir)?;
        }

        let config_path = config_dir.join("config.json");

        Ok(Self { config_path })
    }

    pub fn load_config(&self) -> Result<Config> {
        if !self.config_path.exists() {
            return Ok(Config::default());
        }

        let content = fs::read_to_string(&self.config_path)?;
        let config: Config = serde_json::from_str(&content)?;
        Ok(config)
    }

    pub fn save_config(&self, config: &Config) -> Result<()> {
        let content = serde_json::to_string_pretty(config)?;
        fs::write(&self.config_path, content)?;
        Ok(())
    }

    pub fn add_bucket(&self, mut bucket: BucketConfig) -> Result<Vec<BucketConfig>> {
        let mut config = self.load_config()?;
        
        // Generate ID if not provided
        if bucket.id.is_empty() {
            bucket.id = uuid::Uuid::new_v4().to_string();
        }

        config.buckets.push(bucket);
        self.save_config(&config)?;
        Ok(config.buckets)
    }

    pub fn update_bucket(&self, updated_bucket: BucketConfig) -> Result<Vec<BucketConfig>> {
        let mut config = self.load_config()?;
        
        if let Some(bucket) = config.buckets.iter_mut().find(|b| b.id == updated_bucket.id) {
            *bucket = updated_bucket;
            self.save_config(&config)?;
            Ok(config.buckets)
        } else {
            Err(S3DeckError::BucketNotFound(updated_bucket.id))
        }
    }

    pub fn delete_bucket(&self, bucket_id: &str) -> Result<Vec<BucketConfig>> {
        let mut config = self.load_config()?;
        
        let original_len = config.buckets.len();
        config.buckets.retain(|b| b.id != bucket_id);
        
        if config.buckets.len() == original_len {
            return Err(S3DeckError::BucketNotFound(bucket_id.to_string()));
        }

        self.save_config(&config)?;
        Ok(config.buckets)
    }

    pub fn get_bucket(&self, bucket_id: &str) -> Result<BucketConfig> {
        let config = self.load_config()?;
        config
            .buckets
            .into_iter()
            .find(|b| b.id == bucket_id)
            .ok_or_else(|| S3DeckError::BucketNotFound(bucket_id.to_string()))
    }

    pub fn get_all_buckets(&self) -> Result<Vec<BucketConfig>> {
        let config = self.load_config()?;
        Ok(config.buckets)
    }
}