import React from 'react';
import { listen } from '@tauri-apps/api/event';
import { useSettings } from '../contexts/SettingsContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

// Helper function to format last modified date
const formatLastModified = (lastModified) => {
  if (!lastModified) return '-';

  try {
    const date = new Date(lastModified);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString();
  } catch (error) {
    return '-';
  }
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function ObjectsTable({
  objects,
  loadingObjects,
  searchQuery,
  setSearchQuery,
  handleRightClick,
  navigateToFolder,
  onDrop,
  isDragOver,
  setIsDragOver,
  refreshObjects
}) {
  const { settings } = useSettings();

  // Auto-refresh functionality
  useAutoRefresh(refreshObjects, [objects]);



  // Listen for Tauri drag and drop events
  React.useEffect(() => {


    const setupTauriListeners = async () => {
      try {
        // Listen for drag enter
        await listen('tauri://drag-enter', (event) => {
          setIsDragOver(true);
        });

        // Listen for drag over
        await listen('tauri://drag-over', (event) => {
          setIsDragOver(true);
        });

        // Listen for drag leave
        await listen('tauri://drag-leave', (event) => {
          setIsDragOver(false);
        });

        // Listen for file drop
        await listen('tauri://drag-drop', (event) => {
          setIsDragOver(false);

          // Extract file paths from Tauri payload
          const filePaths = event.payload?.paths || [];
          if (filePaths.length > 0) {
            handleTauriFileDrop(filePaths);
          }
        });


      } catch (error) {
        console.error('Error setting up Tauri listeners:', error);
      }
    };

    setupTauriListeners();
  }, []);

  const handleTauriFileDrop = async (filePaths) => {
    if (!onDrop) {
      console.error('No onDrop handler provided');
      return;
    }

    try {
      setIsDragOver(false);

      // Call the Tauri-specific upload function
      await onDrop(filePaths, 'tauri');

    } catch (error) {
      console.error('Error processing Tauri file drop:', error);
      console.error('Error stack:', error.stack);
    }
  };
  const filteredObjects = objects.filter(item => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Filter hidden files based on settings
    if (!settings.showHiddenFiles && item.name.startsWith('.')) {
      return false;
    }

    return true;
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
      <div
        className={`w-full h-full transition-colors duration-200 ${
          isDragOver ? 'border-2 border-blue-400 bg-blue-50' : ''
        }`}
        style={{ minHeight: isDragOver ? '200px' : 'auto' }}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-80 flex items-center justify-center z-20 border-2 border-dashed border-blue-400">
            <div className="text-center">
              <svg className="w-12 h-12 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-blue-700 font-medium">Drop to upload</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto max-h-[90vh] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                Name
              </th>
              <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                Size
              </th>
              <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                Modified
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loadingObjects ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredObjects.length === 0 && !searchQuery ? (
              <tr>
                <td colSpan="3" className="px-6 py-16 text-center">
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Empty bucket</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Drag and drop files or folders here to upload</p>
                  </div>
                </td>
              </tr>
            ) : filteredObjects.length === 0 && searchQuery ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-3">No items found matching "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    Clear search
                  </button>
                </td>
              </tr>
            ) : (
              filteredObjects.map((item) => (
                <tr
                  key={item.key}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer select-none ${
                    loadingObjects ? 'pointer-events-none opacity-50' : ''
                  }`}
                  onContextMenu={(e) => handleRightClick(e, 'object', item)}
                  onDoubleClick={() => {
                    if (item.isFolder && !loadingObjects) {
                      navigateToFolder(item.key);
                    }
                  }}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-4 w-4">
                        {item.isFolder ? (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-2 min-w-0 flex-1">
                        <div className={`text-sm font-medium truncate transition-colors ${
                          item.isFolder
                            ? "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            : "text-gray-900 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        }`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                          {!item.isFolder && formatFileSize(item.size)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {item.isFolder ? "-" : formatFileSize(item.size)}
                  </td>
                  <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.isFolder ? "-" : formatLastModified(item.lastModified)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
