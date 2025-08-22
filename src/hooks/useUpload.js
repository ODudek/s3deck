import { useState } from 'react';

export const useUpload = (selectedBucketRef, currentPathRef, showNotification, loadObjects) => {
  const [uploadProgress, setUploadProgress] = useState([]);

  const handleFolderUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

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
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', uploadBucket);
        formData.append('key', uploadPath + file.webkitRelativePath);

        // Update progress to show starting
        setUploadProgress(prev =>
          prev.map(item =>
            item.id === i ? {...item, status: 'uploading', progress: 0} : item
          )
        );

        const response = await fetch('http://localhost:8082/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          setUploadProgress(prev =>
            prev.map(item =>
              item.id === i ? {...item, status: 'completed', progress: 100} : item
            )
          );
        } else {
          setUploadProgress(prev =>
            prev.map(item =>
              item.id === i ? {...item, status: 'failed', progress: 0} : item
            )
          );
        }
      }

      showNotification("Folder upload completed!", "success");

      // Refresh the objects list immediately
      loadObjects(selectedBucketRef.current, currentPathRef.current);
      setUploadProgress([]);

    } catch (error) {
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

    showNotification(`Uploading ${filePaths.length} files...`, 'info');

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
        showNotification(result.message, 'success');

        // Refresh the objects list immediately
        loadObjects(selectedBucketRef.current, currentPathRef.current);
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
