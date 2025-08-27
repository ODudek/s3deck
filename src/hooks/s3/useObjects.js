import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { extractErrorMessage } from '../../utils/errorUtils';

export const useObjects = () => {
  const [objects, setObjects] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [loadingObjects, setLoadingObjects] = useState(false);

  const selectedBucketRef = useRef(null);

  // Update ref when selectedBucket changes
  useEffect(() => {
    selectedBucketRef.current = selectedBucket;
  }, [selectedBucket]);

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

  return {
    objects,
    selectedBucket,
    loadingObjects,
    selectedBucketRef,
    setObjects,
    setSelectedBucket,
    loadObjects
  };
};