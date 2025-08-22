import React from 'react';
import { listen } from '@tauri-apps/api/event';

export default function ObjectsTable({
  objects,
  loadingObjects,
  searchQuery,
  setSearchQuery,
  handleRightClick,
  navigateToFolder,
  onDrop,
  isDragOver,
  setIsDragOver
}) {
  console.log('ObjectsTable rendered with onDrop:', typeof onDrop);

  // Listen for Tauri drag and drop events
  React.useEffect(() => {
    console.log('Setting up Tauri drag and drop listeners...');

    const setupTauriListeners = async () => {
      try {
        // Listen for drag enter
        await listen('tauri://drag-enter', (event) => {
          console.log('Tauri: drag-enter', event);
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
          console.log('Tauri: drag-drop', event);
          console.log('Event payload:', event.payload);
          console.log('Payload paths:', event.payload?.paths);
          setIsDragOver(false);

          // Extract file paths from Tauri payload
          const filePaths = event.payload?.paths || [];
          if (filePaths.length > 0) {
            console.log('Calling handleTauriFileDrop with paths:', filePaths);
            handleTauriFileDrop(filePaths);
          } else {
            console.log('No files in payload');
          }
        });

        console.log('Tauri drag and drop listeners set up successfully');
      } catch (error) {
        console.error('Error setting up Tauri listeners:', error);
      }
    };

    setupTauriListeners();
  }, []);

  const handleTauriFileDrop = async (filePaths) => {
    console.log('handleTauriFileDrop called with:', filePaths);
    console.log('onDrop function available:', typeof onDrop);

    if (!onDrop) {
      console.error('No onDrop handler provided');
      return;
    }

    try {
      setIsDragOver(false);
      console.log('About to call onDrop with filePaths and tauri source');

      // Call the Tauri-specific upload function
      const result = await onDrop(filePaths, 'tauri');
      console.log('onDrop result:', result);

    } catch (error) {
      console.error('Error processing Tauri file drop:', error);
      console.error('Error stack:', error.stack);
    }
  };
  const filteredObjects = objects.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(query);
  });

  const handleDragOver = (e) => {
    console.log('ObjectsTable: DragOver event', e.target);
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e) => {
    console.log('ObjectsTable: DragEnter event', e.target);
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    console.log('ObjectsTable: DragLeave event', e.target);
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    console.log('ObjectsTable: Drop event received', e.target);
    console.log('Files in dataTransfer:', e.dataTransfer.files.length);
    console.log('Items in dataTransfer:', e.dataTransfer.items.length);
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-hidden relative">
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Name
              </th>
              <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Size
              </th>
              <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Modified
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loadingObjects ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredObjects.length === 0 && !searchQuery ? (
              <tr>
                <td colSpan="3" className="px-6 py-16 text-center">
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Empty bucket</p>
                    <p className="text-sm text-gray-400">Drag and drop files or folders here to upload</p>
                  </div>
                </td>
              </tr>
            ) : filteredObjects.length === 0 && searchQuery ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center">
                  <p className="text-gray-500 mb-3">No items found matching "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Clear search
                  </button>
                </td>
              </tr>
            ) : (
              filteredObjects.map((item) => (
                <tr
                  key={item.key}
                  className={`hover:bg-gray-50 cursor-pointer select-none ${
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
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-2 min-w-0 flex-1">
                        <div className={`text-sm font-medium truncate transition-colors ${
                          item.isFolder
                            ? "text-blue-600 hover:text-blue-800"
                            : "text-gray-900 hover:text-blue-600"
                        }`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {!item.isFolder && `${item.size.toLocaleString()} bytes`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.isFolder ? "-" : `${item.size.toLocaleString()} bytes`}
                  </td>
                  <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    -
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
