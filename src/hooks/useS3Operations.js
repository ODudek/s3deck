import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Utility function to extract error message from Tauri error objects
const extractErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  // Handle Tauri error objects like { "S3": "Failed to copy object: service error" }
  if (typeof error === 'object' && error !== null) {
    // Try to find the error message in common error object structures
    const errorKeys = ['S3', 'Config', 'Io', 'Serialization', 'BucketNotFound', 'InvalidPath'];
    for (const key of errorKeys) {
      if (error[key]) {
        return error[key];
      }
    }

    // Fallback to JSON representation
    try {
      return JSON.stringify(error);
    } catch {
      return error.toString();
    }
  }

  return 'Unknown error';
};

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
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const selectedBucketRef = useRef(null);

  // Update ref when selectedBucket changes
  useEffect(() => {
    selectedBucketRef.current = selectedBucket;
  }, [selectedBucket]);

  // Load buckets on mount
  useEffect(() => {
    invoke('get_buckets')
      .then(setBuckets)
      .catch(error => {
        const errorMessage = extractErrorMessage(error);
        console.error('Error loading buckets:', errorMessage);
      });
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
      const errorMessage = extractErrorMessage(error);
      console.error('Error loading objects:', errorMessage);
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
      const errorMessage = extractErrorMessage(error);
      onError(`Error: ${errorMessage}`);
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
      const errorMessage = extractErrorMessage(error);
      onError(`Delete failed: ${errorMessage}`);
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
      const errorMessage = extractErrorMessage(error);
      setMetadataError(errorMessage);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const clearMetadata = () => {
    setMetadata(null);
    setMetadataError(null);
  };

  const createFolder = async (folderName, currentPathRef, onSuccess, onError, refreshCallback) => {
    if (!folderName) return { success: false, error: 'Folder name is required' };

    setIsCreatingFolder(true);
    const bucket = selectedBucketRef.current;
    const currentPath = currentPathRef?.current || '';

    try {
      // Calculate the full folder path
      let folderPath;
      if (currentPath) {
        folderPath = currentPath.endsWith('/') 
          ? currentPath + folderName 
          : currentPath + '/' + folderName;
      } else {
        folderPath = folderName;
      }

      const result = await invoke('create_folder', {
        bucketId: bucket,
        folderPath: folderPath
      });

      onSuccess(result);

      // Refresh the objects list
      if (refreshCallback) {
        refreshCallback(bucket, currentPath);
      } else {
        loadObjects(bucket, currentPath);
      }
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const renameObject = async (item, newName, onSuccess, onError, refreshCallback, currentPathRef) => {
    if (!item || !newName) return false;

    setIsRenaming(true);
    const renameBucket = selectedBucketRef.current;
    // Keep original encoded key for S3 operations
    const originalKey = item.key;

    // Get current directory from navigation context
    const currentDirectory = currentPathRef?.current || '';

    try {
      // Calculate new key based on current directory and item type
      let newKey;

      // Simple logic: place the renamed item in the current directory
      if (currentDirectory) {
        newKey = currentDirectory.endsWith('/')
          ? currentDirectory + newName
          : currentDirectory + '/' + newName;
      } else {
        // We're in root directory
        newKey = newName;
      }

      // For folders, ensure the key ends with '/' if it's going to be a folder
      if (item.isFolder && !newKey.endsWith('/')) {
        newKey = newKey + '/';
      }

      const result = await invoke('rename_object', {
        request: {
          bucket_id: renameBucket,
          old_key: originalKey,
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
      const errorMessage = extractErrorMessage(error);
      onError(`Rename failed: ${errorMessage}`);
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
    isCreatingFolder,
    metadata,
    isLoadingMetadata,
    metadataError,
    selectedBucketRef,

    // Actions
    loadBuckets,
    loadObjects,
    addBucketConfig,
    deleteObject,
    renameObject,
    createFolder,
    loadMetadata,
    clearMetadata,
    setSelectedBucket,
    setBucketConfig,
    setObjects
  };
};
