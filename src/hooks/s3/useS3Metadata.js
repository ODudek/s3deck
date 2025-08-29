import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { extractErrorMessage } from '../../utils/errorUtils';

export const useS3Metadata = (selectedBucketRef) => {
  const [metadata, setMetadata] = useState(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState(null);

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

  return {
    metadata,
    isLoadingMetadata,
    metadataError,
    loadMetadata,
    clearMetadata
  };
};