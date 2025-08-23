import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

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
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    debugLog('Starting folder upload', { fileCount: files.length });

    // Check file sizes
    const oversizedFiles = files.filter(file => !isFileSizeValid(file));
    if (oversizedFiles.length > 0) {
      const fileList = oversizedFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ');
      showNotification(
        `Files exceed maximum size limit (${settings.maxFileSize}MB): ${fileList}`, 
        "error"
      );
      return;
    }

    showNotification(`Uploading ${files.length} files...`, "info");

    const progressArray = files.map((file, index) => ({
      id: index,
      name: file.name,
      progress: 0,
      status: 'pending'
    }));
    setUploadProgress(progressArray);

    // Use ref values to avoid stale closures
    const uploadBucket = selectedBucketRef.current;
    const uploadPath = currentPathRef.current;

    try {
      let successCount = 0;
      let failedCount = 0;
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', uploadBucket);
        formData.append('key', uploadPath + file.webkitRelativePath);

        debugLog('Starting file upload', { 
          fileName: file.name, 
          size: formatFileSize(file.size),
          bucket: uploadBucket,
          path: uploadPath + file.webkitRelativePath
        });

        // Update progress to show starting
        setUploadProgress(prev =>
          prev.map(item =>
            item.id === i ? {...item, status: 'uploading', progress: 0} : item
          )
        );

        try {
          const response = await fetch('http://localhost:8082/upload', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            successCount++;
            debugLog('File upload success', { fileName: file.name });
            setUploadProgress(prev =>
              prev.map(item =>
                item.id === i ? {...item, status: 'completed', progress: 100} : item
              )
            );
          } else {
            failedCount++;
            const errorText = await response.text();
            const errorMsg = `${file.name}: ${errorText}`;
            errors.push(errorMsg);
            debugLog('File upload failed', { fileName: file.name, error: errorText });
            setUploadProgress(prev =>
              prev.map(item =>
                item.id === i ? {...item, status: 'failed', progress: 0, error: errorText} : item
              )
            );
          }
        } catch (fileError) {
          failedCount++;
          const errorMsg = `${file.name}: ${fileError.message}`;
          errors.push(errorMsg);
          debugLog('File upload error', { fileName: file.name, error: fileError.message });
          setUploadProgress(prev =>
            prev.map(item =>
              item.id === i ? {...item, status: 'failed', progress: 0, error: fileError.message} : item
            )
          );
        }
      }

      // Show appropriate message based on results
      if (failedCount === 0) {
        showNotification(`Successfully uploaded ${successCount} files!`, "success");
      } else if (successCount === 0) {
        showNotification(`Upload failed: All ${failedCount} files failed. ${errors[0] || ''}`, "error");
      } else {
        showNotification(`Uploaded ${successCount} files, ${failedCount} failed. First error: ${errors[0] || ''}`, "warning");
      }

      // Only refresh if at least one file succeeded
      if (successCount > 0) {
        loadObjects(selectedBucketRef.current, currentPathRef.current);
      }

      // Clear progress after a delay to show final status
      setTimeout(() => setUploadProgress([]), 3000);

    } catch (error) {
      debugLog('Upload process failed', { error: error.message });
      showNotification(`Upload failed: ${error.message}`, "error");
      setUploadProgress([]);
    }

    // Clear the file input
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
    for (const path of filePaths) {
      try {
        const response = await fetch('http://localhost:8082/count-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
        });
        if (response.ok) {
          const result = await response.json();
          totalFileCount += result.count;
        } else {
          totalFileCount += 1; // fallback: assume it's a single file
        }
      } catch {
        totalFileCount += 1; // fallback: assume it's a single file
      }
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

      const requestData = {
        bucket: uploadBucket,
        basePath: basePath,
        currentPath: uploadPath,
        files: filePaths
      };

      const response = await fetch('http://localhost:8082/upload-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        
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
      } else {
        const error = await response.text();
        showNotification(`Upload failed: ${error}`, 'error');
      }
    } catch (error) {
      showNotification(`Upload failed: ${error.message}`, 'error');
    }
  };

  const handleDrop = async (eventOrPaths, source = 'html') => {
    // Handle Tauri file paths
    if (source === 'tauri' && Array.isArray(eventOrPaths)) {
      return await handleTauriPathUpload(eventOrPaths);
    }

    // Handle HTML drag and drop event
    const event = eventOrPaths;

    // Try files from dataTransfer first (simpler approach)
    const droppedFiles = Array.from(event.dataTransfer.files);

    if (droppedFiles.length > 0) {
      const mockEvent = { target: { files: droppedFiles, value: '' } };
      await handleFolderUpload(mockEvent);
      return;
    }

    // Fallback to items approach for directory support
    const items = Array.from(event.dataTransfer.items);
    const files = [];

    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry && entry.isDirectory) {
          await processDirectory(entry, entry.name + '/', files);
        } else {
          const file = item.getAsFile();
          if (file) {
            file.webkitRelativePath = file.name;
            files.push(file);
          }
        }
      }
    }

    if (files.length > 0) {
      const mockEvent = { target: { files, value: '' } };
      await handleFolderUpload(mockEvent);
    }
  };

  const processDirectory = (directoryEntry, path, files) => {
    return new Promise((resolve) => {
      const directoryReader = directoryEntry.createReader();

      const readEntries = () => {
        directoryReader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve();
            return;
          }

          const promises = [];

          for (const entry of entries) {
            const fullPath = path + entry.name;

            if (entry.isFile) {
              promises.push(new Promise((fileResolve) => {
                entry.file((file) => {
                  file.webkitRelativePath = fullPath;
                  files.push(file);
                  fileResolve();
                });
              }));
            } else if (entry.isDirectory) {
              promises.push(processDirectory(entry, fullPath + '/', files));
            }
          }

          await Promise.all(promises);
          readEntries(); // Continue reading if there are more entries
        });
      };

      readEntries();
    });
  };

  return {
    uploadProgress,
    handleFolderUpload,
    handleTauriPathUpload,
    handleDrop,
    setUploadProgress
  };
};
