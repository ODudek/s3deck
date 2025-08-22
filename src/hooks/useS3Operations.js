import { useState, useRef, useEffect } from 'react';

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
    fetch("http://localhost:8082/buckets")
      .then(res => res.json())
      .then(setBuckets)
      .catch(error => console.error('Error loading buckets:', error));
  }, []);

  const loadObjects = async (bucketId, prefix = "") => {
    setSelectedBucket(bucketId);
    setLoadingObjects(true);

    try {
      const url = `http://localhost:8082/objects?bucket=${bucketId}${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
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
      const response = await fetch("http://localhost:8082/add-bucket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bucketConfig),
      });

      if (response.ok) {
        setBucketConfig({
          name: "",
          displayName: "",
          region: "",
          accessKey: "",
          secretKey: "",
          endpoint: ""
        });

        // Refresh buckets list
        const bucketsResponse = await fetch("http://localhost:8082/buckets");
        const updatedBuckets = await bucketsResponse.json();
        setBuckets(updatedBuckets);

        onSuccess("Bucket configuration added successfully!");
        return true;
      } else {
        const error = await response.text();
        onError(`Error: ${error}`);
        return false;
      }
    } catch (error) {
      onError(`Error: ${error.message}`);
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
      const url = `http://localhost:8082/delete?bucket=${deleteBucket}&key=${encodeURIComponent(item.key)}`;
      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result.message);

        // Refresh the objects list using callback or fallback to internal method
        if (refreshCallback) {
          refreshCallback(deleteBucket, deleteCurrentPath);
        } else {
          loadObjects(deleteBucket, deleteCurrentPath);
        }
        return true;
      } else {
        const error = await response.text();
        onError(`Delete failed: ${error}`);
        return false;
      }
    } catch (error) {
      onError(`Delete failed: ${error.message}`);
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
      const url = `http://localhost:8082/metadata?bucket=${metadataBucket}&key=${encodeURIComponent(item.key)}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
      } else {
        const error = await response.text();
        setMetadataError(error);
      }
    } catch (error) {
      setMetadataError(error.message);
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
