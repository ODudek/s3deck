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
  const [isRenaming, setIsRenaming] = useState(false);

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

  const renameObject = async (item, newName, onSuccess, onError, refreshCallback, currentPathRef) => {
    if (!item || !newName) return false;

    setIsRenaming(true);
    const renameBucket = selectedBucketRef.current;
    const currentPath = item.key;

    try {
      // Calculate new key based on the item type
      let newKey;
      if (item.isFolder) {
        // For folders, replace the folder name
        const pathParts = currentPath.split('/').filter(part => part);
        pathParts[pathParts.length - 1] = newName;
        newKey = pathParts.join('/');
      } else {
        // For files, replace the filename (keeping the directory path)
        const lastSlashIndex = currentPath.lastIndexOf('/');
        if (lastSlashIndex === -1) {
          newKey = newName;
        } else {
          newKey = currentPath.substring(0, lastSlashIndex + 1) + newName;
        }
      }

      const result = await invoke('rename_object', {
        request: {
          bucket_id: renameBucket,
          old_key: currentPath,
          new_key: newKey,
          is_folder: item.isFolder
        }
      });

      onSuccess(result.message);

      // Refresh the objects list while staying in the current directory
      // We need to pass the current path, not calculate from the renamed item
      if (refreshCallback && currentPathRef) {
        // refreshCallback is loadObjectsWithNavigation(bucketId, prefix)
        // We want to stay in the same directory where we currently are
        refreshCallback(renameBucket, currentPathRef.current);
      } else {
        // Fallback: calculate current directory from the old key
        const currentDir = currentPath.includes('/') ? currentPath.substring(0, currentPath.lastIndexOf('/')) : '';
        loadObjects(renameBucket, currentDir);
      }
      return true;
    } catch (error) {
      onError(`Rename failed: ${error}`);
      return false;
    } finally {
      setIsRenaming(false);
    }
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
    isRenaming,
    metadata,
    isLoadingMetadata,
    metadataError,
    selectedBucketRef,

    // Actions
    loadObjects,
    addBucketConfig,
    deleteObject,
    renameObject,
    loadMetadata,
    clearMetadata,
    setSelectedBucket,
    setBucketConfig,
    setObjects
  };
};
