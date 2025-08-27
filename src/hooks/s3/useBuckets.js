import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { extractErrorMessage } from '../../utils/errorUtils';

export const useBuckets = () => {
  const [buckets, setBuckets] = useState([]);
  const [bucketConfig, setBucketConfig] = useState({
    name: "",
    displayName: "",
    region: "",
    accessKey: "",
    secretKey: "",
    endpoint: ""
  });
  const [isAdding, setIsAdding] = useState(false);

  // Load buckets on mount
  useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    try {
      const buckets = await invoke('get_buckets');
      setBuckets(buckets);
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      console.error('Error loading buckets:', errorMessage);
    }
  };

  const addBucketConfig = async (onSuccess, onError, configMode = 'manual', selectedProfile = null) => {
    // For manual mode, all fields required
    if (configMode === 'manual') {
      if (!bucketConfig.name.trim() || !bucketConfig.accessKey.trim() ||
          !bucketConfig.secretKey.trim() || !bucketConfig.region.trim()) {
        return false;
      }
    } else {
      // For AWS Profile mode, only name and region required (credentials come from profile)
      if (!bucketConfig.name.trim() || !bucketConfig.region.trim()) {
        return false;
      }
    }

    setIsAdding(true);

    try {
      const updatedBuckets = await invoke('add_bucket', {
        bucket: {
          id: "", // will be generated
          name: bucketConfig.name,
          displayName: bucketConfig.displayName,
          region: bucketConfig.region,
          accessKey: configMode === 'manual' ? bucketConfig.accessKey : '',
          secretKey: configMode === 'manual' ? bucketConfig.secretKey : '',
          endpoint: bucketConfig.endpoint || null,
          awsProfile: configMode === 'aws-profile' ? selectedProfile : null
        }
      });

      setBucketConfig({
        name: "",
        displayName: "",
        region: "",
        accessKey: "",
        secretKey: "",
        endpoint: ""
      });

      setBuckets(updatedBuckets);
      onSuccess("Bucket configuration added successfully!");
      return true;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      onError(`Error: ${errorMessage}`);
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const deleteBucketConfig = async (bucketId) => {
    try {
      await invoke('delete_bucket_config', { bucketId });
      await loadBuckets();
      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      return { success: false, error: errorMessage };
    }
  };

  const updateBucketConfig = async (bucketConfig) => {
    try {
      await invoke('update_bucket', { bucket: bucketConfig });
      await loadBuckets();
      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      return { success: false, error: errorMessage };
    }
  };

  return {
    buckets,
    bucketConfig,
    isAdding,
    setBucketConfig,
    loadBuckets,
    addBucketConfig,
    deleteBucketConfig,
    updateBucketConfig
  };
};