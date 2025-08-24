import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const useS3Operations = () => {
  const [buckets, setBuckets] = useState([]);
  const [objects, setObjects] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [bucketConfig, setBucketConfig] = useState({
    name: "",
    displayName: "",
    region: "",
    accessKey: "",
    secretKey: "",
    endpoint: ""
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState(null);

  const selectedBucketRef = useRef(null);

  // Update ref when selectedBucket changes
  useEffect(() => {
    selectedBucketRef.current = selectedBucket;
  }, [selectedBucket]);

  // Load buckets on mount
  useEffect(() => {
    invoke('get_buckets')
      .then(setBuckets)
      .catch(error => console.error('Error loading buckets:', error));
  }, []);

  const loadObjects = async (bucketId, prefix = "") => {
    setSelectedBucket(bucketId);
    setLoadingObjects(true);

    try {
      const data = await invoke('list_objects', { 
        bucketId, 
        prefix: prefix || null 
      });
      setObjects(data);
    } catch (error) {
      console.error('Error loading objects:', error);
      setObjects([]);
    } finally {
      setLoadingObjects(false);
    }
  };

  const addBucketConfig = async (onSuccess, onError) => {
    if (!bucketConfig.name.trim() || !bucketConfig.accessKey.trim() ||
        !bucketConfig.secretKey.trim() || !bucketConfig.region.trim()) {
      return false;
    }

    setIsAdding(true);

    try {
      const updatedBuckets = await invoke('add_bucket', {
        bucket: {
          id: "", // will be generated
          name: bucketConfig.name,
          displayName: bucketConfig.displayName,
          region: bucketConfig.region,
          accessKey: bucketConfig.accessKey,
          secretKey: bucketConfig.secretKey,
          endpoint: bucketConfig.endpoint || null
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
      onError(`Error: ${error}`);
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const deleteObject = async (item, currentPathRef, onSuccess, onError, refreshCallback) => {
    if (!item) return false;

    setIsDeleting(true);
    const deleteBucket = selectedBucketRef.current;
    const deleteCurrentPath = currentPathRef.current;

    try {
      const result = await invoke('delete_object', {
        bucketId: deleteBucket,
        key: item.key
      });
      
      onSuccess(result.message);

      // Refresh the objects list using callback or fallback to internal method
      if (refreshCallback) {
        refreshCallback(deleteBucket, deleteCurrentPath);
      } else {
        loadObjects(deleteBucket, deleteCurrentPath);
      }
      return true;
    } catch (error) {
      onError(`Delete failed: ${error}`);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const loadMetadata = async (item) => {
    if (!item || item.isFolder) return;

    setIsLoadingMetadata(true);
    setMetadata(null);
    setMetadataError(null);

    const metadataBucket = selectedBucketRef.current;

    try {
      const data = await invoke('get_object_metadata', {
        bucketId: metadataBucket,
        key: item.key
      });
      setMetadata(data);
    } catch (error) {
      setMetadataError(error.toString());
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const clearMetadata = () => {
    setMetadata(null);
    setMetadataError(null);
  };

  return {
    // State
    buckets,
    objects,
    selectedBucket,
    loadingObjects,
    bucketConfig,
    isAdding,
    isDeleting,
    metadata,
    isLoadingMetadata,
    metadataError,
    selectedBucketRef,

    // Actions
    loadObjects,
    addBucketConfig,
    deleteObject,
    loadMetadata,
    clearMetadata,
    setSelectedBucket,
    setBucketConfig,
    setObjects
  };
};
