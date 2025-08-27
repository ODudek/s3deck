import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { extractErrorMessage } from '../../utils/errorUtils';

export const useS3Delete = (selectedBucketRef) => {
  const [isDeleting, setIsDeleting] = useState(false);

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

  return {
    isDeleting,
    deleteObject
  };
};