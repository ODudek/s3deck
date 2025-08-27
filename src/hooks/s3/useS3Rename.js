import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { extractErrorMessage } from '../../utils/errorUtils';

export const useS3Rename = (selectedBucketRef) => {
  const [isRenaming, setIsRenaming] = useState(false);

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
    isRenaming,
    renameObject
  };
};