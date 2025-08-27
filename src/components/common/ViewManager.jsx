import BucketsTable from '../BucketsTable';
import ObjectsList from '../object/ObjectsList';
import ConfigView from '../ConfigView';

export default function ViewManager({
  activeView,
  // Buckets props
  buckets,
  searchQuery,
  setSearchQuery,
  handleRightClick,
  loadObjects,
  setCurrentPath,
  setPathHistory,
  setActiveView,
  setShowAddForm,
  // Objects props
  objects,
  loadingObjects,
  navigateToFolder,
  onDrop,
  isDragOver,
  setIsDragOver,
  refreshObjects,
  selectedBucket,
  // Config props
  onDeleteBucket,
  onEditBucket,
  onAddBucket
}) {
  if (activeView === "buckets") {
    return (
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
    );
  }

  if (activeView === "config") {
    return (
      <ConfigView
        buckets={buckets}
        onDeleteBucket={onDeleteBucket}
        onEditBucket={onEditBucket}
        onAddBucket={onAddBucket}
      />
    );
  }

  // Objects view
  return (
    <ObjectsList
      objects={objects}
      loadingObjects={loadingObjects}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      handleRightClick={handleRightClick}
      navigateToFolder={navigateToFolder}
      onDrop={onDrop}
      isDragOver={isDragOver}
      setIsDragOver={setIsDragOver}
      refreshObjects={refreshObjects}
      selectedBucket={selectedBucket}
    />
  );
}