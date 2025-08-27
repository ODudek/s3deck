import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { extractErrorMessage } from '../../utils/errorUtils';

export const useS3Folders = (selectedBucketRef) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

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
      }
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return {
    isCreatingFolder,
    createFolder
  };
};