import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettings } from '../../contexts/SettingsContext';
import ObjectIcon from './ObjectIcon';
import { formatLastModified, formatFileSize } from '../../utils/formatters';

// Helper component to display folder modification date
const FolderModifiedDate = ({ folderKey, selectedBucket, showFolderModifiedDates }) => {
  const [modifiedDate, setModifiedDate] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFolderModified = async () => {
      if (!selectedBucket || !folderKey || !showFolderModifiedDates) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await invoke('get_folder_latest_modified', {
          bucketId: selectedBucket,
          folderKey: folderKey
        });
        setModifiedDate(result);
      } catch (error) {
        console.error('Error fetching folder modified date:', error);
        setModifiedDate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolderModified();
  }, [folderKey, selectedBucket, showFolderModifiedDates]);

  if (!showFolderModifiedDates) {
    return <span>-</span>;
  }

  if (isLoading) {
    return <span className="text-xs">...</span>;
  }

  return <span>{formatLastModified(modifiedDate) || "-"}</span>;
};

export default function ObjectTableRow({ 
  item, 
  loadingObjects, 
  selectedBucket,
  handleRightClick, 
  navigateToFolder 
}) {
  const { settings } = useSettings();

  return (
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
            <ObjectIcon isFolder={item.isFolder} />
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
        {item.isFolder
          ? <FolderModifiedDate folderKey={item.key} selectedBucket={selectedBucket} showFolderModifiedDates={settings.showFolderModifiedDates} />
          : formatLastModified(item.lastModified)
        }
      </td>
    </tr>
  );
}