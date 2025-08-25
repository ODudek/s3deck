import React, { useState } from 'react';

export default function CreateFolderModal({ 
  isOpen, 
  onClose, 
  onCreateFolder,
  isCreating,
  serverError
}) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (folderName.trim()) {
      // Basic validation
      const trimmedName = folderName.trim();
      if (trimmedName.includes('/')) {
        setError('Folder name cannot contain forward slashes');
        return;
      }
      if (trimmedName === '.' || trimmedName === '..') {
        setError('Invalid folder name');
        return;
      }
      onCreateFolder(trimmedName);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setError('');
    onClose();
  };

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setError('');
    }
  }, [isOpen]);

  // Clear client error when user starts typing
  React.useEffect(() => {
    if (folderName) {
      setError('');
    }
  }, [folderName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 shadow-2xl transform transition-all duration-200 scale-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Folder</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                placeholder="Enter folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-blue-500 focus:outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  (error || serverError)
                    ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                disabled={isCreating}
                autoFocus
                required
              />
              {(error || serverError) && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error || serverError}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium transition-colors duration-200"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!folderName.trim() || isCreating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4z" clipRule="evenodd" />
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Folder</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}