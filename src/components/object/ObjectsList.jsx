import { useSettings } from '../../contexts/SettingsContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import DragDropZone from './dragdrop/DragDropZone';
import ObjectsTableHeader from './ObjectsTableHeader';
import ObjectTableRow from './ObjectTableRow';
import LoadingObjectsState from './LoadingObjectsState';
import EmptyObjectsState from './EmptyObjectsState';

export default function ObjectsList({
  objects,
  loadingObjects,
  searchQuery,
  setSearchQuery,
  handleRightClick,
  navigateToFolder,
  onDrop,
  isDragOver,
  setIsDragOver,
  refreshObjects,
  selectedBucket
}) {
  const { settings } = useSettings();

  // Auto-refresh functionality
  useAutoRefresh(refreshObjects, [objects]);

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

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
      <DragDropZone
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        onDrop={onDrop}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <ObjectsTableHeader />
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loadingObjects ? (
                <LoadingObjectsState />
              ) : filteredObjects.length === 0 ? (
                <EmptyObjectsState 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              ) : (
                filteredObjects.map((item) => (
                  <ObjectTableRow
                    key={item.key}
                    item={item}
                    loadingObjects={loadingObjects}
                    selectedBucket={selectedBucket}
                    handleRightClick={handleRightClick}
                    navigateToFolder={navigateToFolder}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </DragDropZone>
    </div>
  );
}