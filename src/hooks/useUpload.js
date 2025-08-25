import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { invoke } from '@tauri-apps/api/core';

export const useUpload = (selectedBucketRef, currentPathRef, showNotification, loadObjects) => {
  const [uploadProgress, setUploadProgress] = useState([]);
  const { settings } = useSettings();

  // Helper function to check file size
  const isFileSizeValid = (file) => {
    const maxSizeBytes = settings.maxFileSize * 1024 * 1024; // Convert MB to bytes
    return file.size <= maxSizeBytes;
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Debug logging function
  const debugLog = (message, data = null) => {
    if (settings.debugMode) {
      console.log(`[Upload Debug] ${message}`, data);
    }
  };

  const handleFolderUpload = async (event) => {
    // This HTML-based upload is deprecated in the Tauri-only version
    showNotification('HTML file uploads are not supported in the desktop version. Please use file drag & drop or the file menu.', 'error');
    event.target.value = '';
  };

  const handleTauriPathUpload = async (filePaths) => {
    // Use the ref to get the current path value and avoid stale closures
    const uploadBucket = selectedBucketRef.current;
    const uploadPath = currentPathRef.current;

    if (!uploadBucket) {
      showNotification('Please select a bucket first', 'error');
      return;
    }

    // Count total files first (for directories, we need to check what's actually inside)
    let totalFileCount = 0;
    try {
      totalFileCount = await invoke('count_files', { files: filePaths });
    } catch {
      totalFileCount = filePaths.length; // fallback
    }

    showNotification(`Uploading ${totalFileCount} file${totalFileCount !== 1 ? 's' : ''}...`, 'info');

    try {
      // Find common base path for maintaining folder structure
      let basePath = '';
      if (filePaths.length > 1) {
        const commonPath = filePaths[0].split('/').slice(0, -1).join('/');
        if (filePaths.every(path => path.startsWith(commonPath))) {
          basePath = commonPath;
        }
      }

      const result = await invoke('upload_files', {
        request: {
          bucket: uploadBucket,
          basePath: basePath,
          currentPath: uploadPath,
          files: filePaths
        }
      });
      
      // Show detailed message based on results
      const uploadedCount = result.uploadedFiles ? result.uploadedFiles.length : 0;
      const failedCount = result.failedFiles ? result.failedFiles.length : 0;
      const firstError = result.failedFiles && result.failedFiles.length > 0 ? result.failedFiles[0].error : '';
      
      if (failedCount > 0) {
        if (uploadedCount === 0) {
          showNotification(`Upload failed: All ${failedCount} files failed. ${firstError}`, 'error');
        } else {
          showNotification(`Uploaded ${uploadedCount} files, ${failedCount} failed. First error: ${firstError}`, 'warning');
        }
      } else {
        showNotification(`Successfully uploaded ${uploadedCount} files!`, 'success');
      }

      // Only refresh if at least one file succeeded
      if (uploadedCount > 0) {
        loadObjects(selectedBucketRef.current, currentPathRef.current);
      }
    } catch (error) {
      showNotification(`Upload failed: ${error}`, 'error');
    }
  };

  const handleDrop = async (eventOrPaths, source = 'html') => {
    // Handle Tauri file paths
    if (source === 'tauri' && Array.isArray(eventOrPaths)) {
      return await handleTauriPathUpload(eventOrPaths);
    }

    // HTML drag and drop is deprecated in Tauri-only version
    showNotification('HTML drag and drop is not supported in the desktop version. Please use the file menu or external file manager.', 'error');
  };


  return {
    uploadProgress,
    handleFolderUpload,
    handleTauriPathUpload,
    handleDrop,
    setUploadProgress
  };
};
