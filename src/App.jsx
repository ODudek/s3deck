import { useEffect, useState, useRef } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BucketsTable from "./components/BucketsTable";
import ObjectsTable from "./components/ObjectsTable";
import ContextMenu from "./components/ContextMenu";
import AddBucketModal from "./components/AddBucketModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import PropertiesModal from "./components/PropertiesModal";

export default function App() {
  const [buckets, setBuckets] = useState([]);
  const [objects, setObjects] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState([]);
  const [activeView, setActiveView] = useState("buckets");
  const [bucketConfig, setBucketConfig] = useState({
    name: "",
    displayName: "",
    region: "",
    accessKey: "",
    secretKey: "",
    endpoint: ""
  });
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [propertiesModal, setPropertiesModal] = useState({ isOpen: false, item: null });
  const [metadata, setMetadata] = useState(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState(null);

  // Use ref to store current path for uploads to avoid stale closures
  const currentPathRef = useRef("");

  useEffect(() => {
    fetch("http://localhost:8082/buckets")
      .then(res => res.json())
      .then(setBuckets);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Debug global drag events - TEMPORARILY REMOVED TO TEST
  // useEffect(() => {
  //   const handleGlobalDragOver = (e) => {
  //     console.log('Global dragover event');
  //     e.preventDefault();
  //   };

  //   const handleGlobalDrop = (e) => {
  //     console.log('Global drop event');
  //     e.preventDefault();
  //   };

  //   document.addEventListener('dragover', handleGlobalDragOver);
  //   document.addEventListener('drop', handleGlobalDrop);

  //   return () => {
  //     document.removeEventListener('dragover', handleGlobalDragOver);
  //     document.removeEventListener('drop', handleGlobalDrop);
  //   };
  // }, []);

  const loadObjects = async (bucketId, prefix = "") => {
    setSelectedBucket(bucketId);
    setCurrentPath(prefix);
    currentPathRef.current = prefix;
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

  const navigateToFolder = (folderKey) => {
    setPathHistory([...pathHistory, currentPath]);
    setSearchQuery("");
    loadObjects(selectedBucket, folderKey);
  };

  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      setSearchQuery("");
      loadObjects(selectedBucket, previousPath);
    }
  };

  const navigateToBreadcrumb = (index) => {
    const pathParts = currentPath.split('/').filter(p => p !== '');
    const newPath = pathParts.slice(0, index + 1).join('/') + (index >= 0 ? '/' : '');
    const newHistoryLength = index + 1;
    setPathHistory(pathHistory.slice(0, newHistoryLength));
    setSearchQuery("");
    loadObjects(selectedBucket, newPath === '/' ? '' : newPath);
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [];
    const parts = currentPath.split('/').filter(p => p !== '');
    return parts;
  };

  const addBucketConfig = async (e) => {
    e.preventDefault();
    if (!bucketConfig.name.trim() || !bucketConfig.accessKey.trim() || !bucketConfig.secretKey.trim() || !bucketConfig.region.trim()) return;

    setIsAdding(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8082/add-bucket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bucketConfig),
      });

      if (response.ok) {
        setMessage("Bucket configuration added successfully!");
        setMessageType("success");
        setShowAddForm(false);
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
      } else {
        const error = await response.text();
        setMessage(`Error: ${error}`);
        setMessageType("error");
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType("error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRightClick = (e, type, item) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      item
    });
  };

  const handleContextAction = (action, item) => {
    setContextMenu(null);

    if (action === 'browse' && item) {
      setCurrentPath("");
      currentPathRef.current = "";
      setPathHistory([]);
      setSearchQuery("");
      loadObjects(item.id);
      setActiveView("objects");
    } else if (action === 'open' && item) {
      navigateToFolder(item.key);
    } else if (action === 'download' && item) {
      // TODO: Implement download functionality
    } else if (action === 'delete' && item) {
      setDeleteModal({ isOpen: true, item });
    } else if (action === 'properties' && item) {
      setPropertiesModal({ isOpen: true, item });
      loadMetadata(item);
    } else if (action === 'edit' && item) {
      // TODO: Implement edit functionality
    }
  };

  const handleFolderUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setMessage(`Uploading ${files.length} files...`);
    setMessageType("info");

    const progressArray = files.map((file, index) => ({
      id: index,
      name: file.name,
      progress: 0,
      status: 'pending'
    }));
    setUploadProgress(progressArray);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', selectedBucket);
        formData.append('key', currentPathRef.current + file.webkitRelativePath);

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

      setMessage("Folder upload completed!");
      setMessageType("success");

      // Refresh the objects list
      setTimeout(() => {
        loadObjects(selectedBucket, currentPathRef.current);
        setUploadProgress([]);
      }, 2000);

    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
      setMessageType("error");
      setUploadProgress([]);
    }

    // Clear the file input
    event.target.value = '';
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

  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;

    setIsDeleting(true);
    const item = deleteModal.item;

    try {
      const url = `http://localhost:8082/delete?bucket=${selectedBucket}&key=${encodeURIComponent(item.key)}`;
      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message);
        setMessageType("success");

        // Refresh the objects list
        loadObjects(selectedBucket, currentPath);
      } else {
        const error = await response.text();
        setMessage(`Delete failed: ${error}`);
        setMessageType("error");
      }
    } catch (error) {
      setMessage(`Delete failed: ${error.message}`);
      setMessageType("error");
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, item: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, item: null });
  };

  const loadMetadata = async (item) => {
    if (!item || item.isFolder) return;

    setIsLoadingMetadata(true);
    setMetadata(null);
    setMetadataError(null);

    try {
      const url = `http://localhost:8082/metadata?bucket=${selectedBucket}&key=${encodeURIComponent(item.key)}`;
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

  const handlePropertiesClose = () => {
    setPropertiesModal({ isOpen: false, item: null });
    setMetadata(null);
    setMetadataError(null);
  };

  const handleTauriPathUpload = async (filePaths) => {
    // Use the ref to get the current path value and avoid stale closures
    const uploadPath = currentPathRef.current;

    if (!selectedBucket) {
      setMessage('Please select a bucket first');
      setMessageType('error');
      return;
    }

    setMessage(`Uploading ${filePaths.length} files...`);
    setMessageType('info');

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
        bucket: selectedBucket,
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
        setMessage(result.message);
        setMessageType('success');

        // Refresh the objects list
        setTimeout(() => {
          loadObjects(selectedBucket, currentPathRef.current);
        }, 1000);
      } else {
        const error = await response.text();
        setMessage(`Upload failed: ${error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
      setMessageType('error');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedBucket={selectedBucket}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeView={activeView}
          buckets={buckets}
          selectedBucket={selectedBucket}
          currentPath={currentPath}
          pathHistory={pathHistory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          getBreadcrumbs={getBreadcrumbs}
          navigateToBreadcrumb={navigateToBreadcrumb}
          loadObjects={loadObjects}
          navigateBack={navigateBack}
          setShowAddForm={setShowAddForm}
          handleFolderUpload={handleFolderUpload}
        />

        {/* Success/Error Messages */}
        {message && (
          <div className={`mx-3 mt-2 p-2 rounded border-l-4 ${
            messageType === "success"
              ? "bg-green-50 border-green-400 text-green-700"
              : messageType === "info"
              ? "bg-blue-50 border-blue-400 text-blue-700"
              : "bg-red-50 border-red-400 text-red-700"
          }`}>
            <div className="flex items-center">
              {messageType === "success" ? (
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : messageType === "info" ? (
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm">{message}</span>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="mx-3 mt-2 p-3 bg-gray-50 rounded border">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Progress</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {uploadProgress.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center text-xs">
                  <div className="flex-1 truncate mr-2">{item.name}</div>
                  <div className={`px-2 py-0.5 rounded text-xs ${
                    item.status === 'completed' ? 'bg-green-100 text-green-800' :
                    item.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                    item.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.status}
                  </div>
                </div>
              ))}
              {uploadProgress.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  ... and {uploadProgress.length - 5} more files
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {activeView === "buckets" ? (
            <BucketsTable
              buckets={buckets}
              searchQuery={searchQuery}
              handleRightClick={handleRightClick}
              loadObjects={loadObjects}
              setCurrentPath={setCurrentPath}
              setPathHistory={setPathHistory}
              setSearchQuery={setSearchQuery}
              setActiveView={setActiveView}
              setShowAddForm={setShowAddForm}
            />
          ) : (
            <ObjectsTable
              objects={objects}
              loadingObjects={loadingObjects}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleRightClick={handleRightClick}
              navigateToFolder={navigateToFolder}
              onDrop={handleDrop}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
            />
          )}
        </div>
      </div>

      <ContextMenu
        contextMenu={contextMenu}
        handleContextAction={handleContextAction}
      />

      <AddBucketModal
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        bucketConfig={bucketConfig}
        setBucketConfig={setBucketConfig}
        isAdding={isAdding}
        addBucketConfig={addBucketConfig}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        item={deleteModal.item}
        isDeleting={isDeleting}
      />

      <PropertiesModal
        isOpen={propertiesModal.isOpen}
        onClose={handlePropertiesClose}
        metadata={metadata}
        isLoading={isLoadingMetadata}
        error={metadataError}
      />
    </div>
  );
}
