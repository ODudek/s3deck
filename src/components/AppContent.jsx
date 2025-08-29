import { useEffect, useState } from "react";
import { invoke } from '@tauri-apps/api/core';

// Components
import Sidebar from "./Sidebar";
import Header from "./Header";
import BucketsTable from "./BucketsTable";
import ObjectsTable from "./ObjectsTable";
import ContextMenu from "./ContextMenu";
import AddBucketModal from "./AddBucketModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import PropertiesModal from "./PropertiesModal";
import RenameModal from "./RenameModal";
import CreateFolderModal from "./CreateFolderModal";
import NotificationBanner from './ui/NotificationBanner';
import UploadProgress from './ui/UploadProgress';
import ConfigView from './ConfigView';

// Custom hooks
import { useNotifications } from "../hooks/useNotifications";
import { useModals } from "../hooks/useModals";
import { useNavigation } from "../hooks/useNavigation";
import { useS3Operations } from "../hooks/useS3Operations";
import { useUpload } from "../hooks/useUpload";
import { useTheme } from "../hooks/useTheme";

export default function AppContent() {
  const [activeView, setActiveView] = useState("buckets");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [createFolderError, setCreateFolderError] = useState('');

  // Initialize theme
  useTheme();

  // Custom hooks
  const notifications = useNotifications();
  const modals = useModals();
  const navigation = useNavigation();
  const s3Operations = useS3Operations();
  const upload = useUpload(
    s3Operations.selectedBucketRef,
    navigation.currentPathRef,
    notifications.showNotification,
    s3Operations.loadObjects
  );

  // Handle context menu clicks outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Enhanced loadObjects that also updates navigation
  const loadObjectsWithNavigation = async (bucketId, prefix = "") => {
    navigation.updateCurrentPath(prefix);
    await s3Operations.loadObjects(bucketId, prefix);
  };

  // Navigation handlers
  const handleNavigateToFolder = (folderKey) => {
    setSearchQuery("");
    navigation.navigateToFolder(folderKey, loadObjectsWithNavigation, s3Operations.selectedBucket);
  };

  const handleNavigateBack = () => {
    setSearchQuery("");
    navigation.navigateBack(loadObjectsWithNavigation, s3Operations.selectedBucket);
  };

  const handleNavigateToBreadcrumb = (index) => {
    setSearchQuery("");
    navigation.navigateToBreadcrumb(index, loadObjectsWithNavigation, s3Operations.selectedBucket);
  };

  // Context menu handlers
  const handleRightClick = (e, type, item) => {
    e.preventDefault();

    // More precise menu height estimation based on actual content
    let estimatedMenuHeight = 16; // Base padding
    if (type === 'bucket') {
      estimatedMenuHeight = 140; // Browse + Edit + separator + Delete (3 items + divider + padding)
    } else if (type === 'object') {
      if (item?.isFolder) {
        estimatedMenuHeight = 180; // Open + Rename + Properties + separator + Delete (4 items + divider + padding)
      } else {
        estimatedMenuHeight = 180; // Download + Rename + Properties + separator + Delete (4 items + divider + padding)
      }
    }

    // Get viewport dimensions
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate position with margins
    const margin = 20; // Minimum distance from viewport edges
    let x = e.clientX;
    let y = e.clientY;

    // Adjust Y position if menu would overflow bottom
    if (y + estimatedMenuHeight + margin > viewportHeight) {
      y = Math.max(margin, y - estimatedMenuHeight);
    }

    // Adjust X position if menu would overflow right
    const estimatedMenuWidth = 160; // Slightly wider for better text spacing
    if (x + estimatedMenuWidth + margin > viewportWidth) {
      x = Math.max(margin, x - estimatedMenuWidth);
    }

    // Ensure minimum distance from edges
    x = Math.max(margin, Math.min(x, viewportWidth - estimatedMenuWidth - margin));
    y = Math.max(margin, Math.min(y, viewportHeight - estimatedMenuHeight - margin));

    setContextMenu({
      x,
      y,
      type,
      item
    });
  };

  const handleContextAction = (action, item) => {
    setContextMenu(null);

    if (action === 'browse' && item) {
      navigation.resetNavigation();
      setSearchQuery("");
      loadObjectsWithNavigation(item.id);
      setActiveView("objects");
    } else if (action === 'open' && item) {
      handleNavigateToFolder(item.key);
    } else if (action === 'download' && item) {
      // TODO: Implement download functionality
    } else if (action === 'delete' && item) {
      modals.openDeleteModal(item);
    } else if (action === 'properties' && item) {
      modals.openPropertiesModal(item);
      s3Operations.loadMetadata(item);
    } else if (action === 'rename' && item) {
      setRenameItem(item);
    } else if (action === 'edit' && item) {
      // TODO: Implement edit functionality
    }
  };

  // Modal handlers
  const handleAddBucketSubmit = async (e, configMode = 'manual', selectedProfile = null) => {
    e.preventDefault();
    const success = await s3Operations.addBucketConfig(
      notifications.showSuccess,
      notifications.showError,
      configMode,
      selectedProfile
    );
    if (success) {
      modals.closeAddBucket();
    }
  };

  const handleDeleteBucket = async (bucketId) => {
    try {
      await invoke('delete_bucket_config', { bucketId });
      notifications.showSuccess('Bucket configuration deleted successfully');
      s3Operations.loadBuckets();
    } catch (error) {
      console.error('Error deleting bucket:', error);
      notifications.showError(error.message || 'Failed to delete bucket configuration');
    }
  };

  const handleEditBucket = async (bucketConfig) => {
    try {
      await invoke('update_bucket', { bucket: bucketConfig });
      notifications.showSuccess('Bucket configuration updated successfully');
      s3Operations.loadBuckets();
    } catch (error) {
      console.error('Error updating bucket:', error);
      notifications.showError(error.message || 'Failed to update bucket configuration');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!modals.deleteModal.item) return;

    const success = await s3Operations.deleteObject(
      modals.deleteModal.item,
      navigation.currentPathRef,
      notifications.showSuccess,
      notifications.showError,
      loadObjectsWithNavigation
    );

    if (success) {
      modals.closeDeleteModal();
    }
  };

  const handlePropertiesClose = () => {
    modals.closePropertiesModal();
    s3Operations.clearMetadata();
  };

  // Rename handlers
  const handleRename = async (newName) => {
    if (!renameItem) return;

    const success = await s3Operations.renameObject(
      renameItem,
      newName,
      notifications.showSuccess,
      notifications.showError,
      loadObjectsWithNavigation,
      navigation.currentPathRef
    );

    if (success) {
      setRenameItem(null);
    }
  };

  const handleRenameClose = () => {
    setRenameItem(null);
  };

  // Upload handlers
  const handleDrop = async (eventOrPaths, source = 'html') => {
    await upload.handleDrop(eventOrPaths, source);
  };

  // Create folder handlers
  const handleCreateFolder = async (folderName) => {
    setCreateFolderError(''); // Clear previous error
    const result = await s3Operations.createFolder(
      folderName,
      navigation.currentPathRef,
      notifications.showSuccess,
      (error) => {}, // Don't show notification, we'll show in modal
      loadObjectsWithNavigation
    );

    if (result.success) {
      modals.closeCreateFolderModal();
      setCreateFolderError('');
    } else {
      setCreateFolderError(result.error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 relative">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedBucket={s3Operations.selectedBucket}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeView={activeView}
          buckets={s3Operations.buckets}
          selectedBucket={s3Operations.selectedBucket}
          currentPath={navigation.currentPath}
          pathHistory={navigation.pathHistory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          getBreadcrumbs={navigation.getBreadcrumbs}
          navigateToBreadcrumb={handleNavigateToBreadcrumb}
          loadObjects={loadObjectsWithNavigation}
          navigateBack={handleNavigateBack}
          setShowAddForm={modals.openAddBucket}
          handleFolderUpload={upload.handleFolderUpload}
          onCreateFolder={modals.openCreateFolderModal}
        />

        <NotificationBanner
          message={notifications.message}
          messageType={notifications.messageType}
        />

        <UploadProgress uploadProgress={upload.uploadProgress} />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {activeView === "buckets" ? (
            <BucketsTable
              buckets={s3Operations.buckets}
              searchQuery={searchQuery}
              handleRightClick={handleRightClick}
              loadObjects={loadObjectsWithNavigation}
              setCurrentPath={navigation.updateCurrentPath}
              setPathHistory={navigation.setPathHistory}
              setSearchQuery={setSearchQuery}
              setActiveView={setActiveView}
              setShowAddForm={modals.openAddBucket}
            />
          ) : activeView === "config" ? (
            <ConfigView
              buckets={s3Operations.buckets}
              onDeleteBucket={handleDeleteBucket}
              onEditBucket={handleEditBucket}
              onAddBucket={modals.openAddBucket}
            />
          ) : (
            <ObjectsTable
              objects={s3Operations.objects}
              loadingObjects={s3Operations.loadingObjects}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleRightClick={handleRightClick}
              navigateToFolder={handleNavigateToFolder}
              onDrop={handleDrop}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              refreshObjects={() => loadObjectsWithNavigation(s3Operations.selectedBucket, navigation.currentPath)}
              selectedBucket={s3Operations.selectedBucket}
            />
          )}
        </div>
      </div>

      <ContextMenu
        contextMenu={contextMenu}
        handleContextAction={handleContextAction}
      />

      <AddBucketModal
        showAddForm={modals.showAddForm}
        setShowAddForm={modals.closeAddBucket}
        bucketConfig={s3Operations.bucketConfig}
        setBucketConfig={s3Operations.setBucketConfig}
        isAdding={s3Operations.isAdding}
        addBucketConfig={handleAddBucketSubmit}
        showError={notifications.showError}
      />

      <DeleteConfirmModal
        isOpen={modals.deleteModal.isOpen}
        onClose={modals.closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        item={modals.deleteModal.item}
        isDeleting={s3Operations.isDeleting}
      />

      <PropertiesModal
        isOpen={modals.propertiesModal.isOpen}
        onClose={handlePropertiesClose}
        metadata={s3Operations.metadata}
        isLoading={s3Operations.isLoadingMetadata}
        error={s3Operations.metadataError}
      />

      <RenameModal
        isOpen={!!renameItem}
        onClose={handleRenameClose}
        item={renameItem}
        onRename={handleRename}
        isRenaming={s3Operations.isRenaming}
      />

      <CreateFolderModal
        isOpen={modals.createFolderModal}
        onClose={() => {
          setCreateFolderError('');
          modals.closeCreateFolderModal();
        }}
        onCreateFolder={handleCreateFolder}
        isCreating={s3Operations.isCreatingFolder}
        serverError={createFolderError}
      />

      {/* Notifications - positioned at bottom right */}
      <NotificationBanner
        message={notifications.message}
        messageType={notifications.messageType}
        onClose={notifications.clearNotification}
      />
    </div>
  );
}
