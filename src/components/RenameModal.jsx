import React, { useState, useEffect } from 'react';

const RenameModal = ({
  isOpen,
  onClose,
  item,
  onRename,
  isRenaming
}) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      // Set initial name based on item type
      if (item.isFolder) {
        // For folders, extract just the folder name (without trailing slash)
        const folderName = item.name.replace(/\/$/, '');
        setNewName(folderName);
      } else {
        // For files, use the full filename
        setNewName(item.name);
      }
      setError('');
    }
  }, [isOpen, item]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    if (newName === item.name || (item.isFolder && newName === item.name.replace(/\/$/, ''))) {
      setError('New name must be different from current name');
      return;
    }

    // Validate filename characters
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(newName)) {
      setError('Name contains invalid characters');
      return;
    }

    // Check for reserved names (Windows)
    const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    const nameWithoutExt = newName.split('.')[0];
    if (reservedNames.test(nameWithoutExt)) {
      setError('Name is reserved and cannot be used');
      return;
    }

    // Don't allow names starting with dots or spaces
    if (newName.startsWith('.') || newName.startsWith(' ') || newName.endsWith(' ')) {
      setError('Name cannot start with a dot or space, or end with a space');
      return;
    }

    setError('');
    onRename(newName.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const getFileExtension = (filename) => {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '';
  };

  const getFileNameWithoutExtension = (filename) => {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]"
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Rename {item?.isFolder ? 'Folder' : 'File'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="newName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {item?.isFolder ? 'Folder name:' : 'File name:'}
            </label>

            <input
              type="text"
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder={item?.isFolder ? 'Enter folder name' : 'Enter file name'}
              disabled={isRenaming}
              autoFocus
              autoComplete="off"
            />

            {!item?.isFolder && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span>💡</span>
                  <span>
                    You can change the file extension to convert the file type.
                    Current extension: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                      {getFileExtension(item?.name || '') || '(none)'}
                    </code>
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <div className="font-medium mb-1">Current: {item?.name}</div>
              <div className="font-medium">New: {newName || '(empty)'}</div>
              {!item?.isFolder && newName && getFileExtension(newName) !== getFileExtension(item?.name || '') && (
                <div className="mt-2 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <span>⚠️</span>
                    <span>File type will change due to extension change</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isRenaming}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isRenaming || !newName.trim() || error}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isRenaming && (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              )}
              {isRenaming ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
