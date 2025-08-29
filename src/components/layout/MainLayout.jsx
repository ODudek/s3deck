import { useState } from "react";
import { invoke } from '@tauri-apps/api/core';

// Components
import Sidebar from "../Sidebar";
import AppHeader from "./AppHeader";
import ViewManager from "../common/ViewManager";
import ContextMenu from "../ContextMenu";
import AddBucketModal from "../AddBucketModal";
import DeleteConfirmModal from "../DeleteConfirmModal";
import PropertiesModal from "../PropertiesModal";
import RenameModal from "../RenameModal";
import CreateFolderModal from "../CreateFolderModal";
import NotificationBanner from '../ui/NotificationBanner';
import UploadProgress from '../ui/UploadProgress';

// Custom hooks
import { useNotifications } from "../../hooks/useNotifications";
import { useModals } from "../../hooks/useModals";
import { useNavigation } from "../../hooks/useNavigation";
import { useS3Operations } from "../../hooks/s3/useS3Operations";
import { useUpload } from "../../hooks/useUpload";
import { useTheme } from "../../hooks/useTheme";
import { useContextMenu } from "../../hooks/ui/useContextMenu";

export default function MainLayout() {
  const [activeView, setActiveView] = useState("buckets");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const contextMenu = useContextMenu();
  const upload = useUpload(
    s3Operations.selectedBucketRef,
    navigation.currentPathRef,
    notifications.showNotification,
    s3Operations.loadObjects
  );

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
  const handleContextAction = (action, item) => {
    contextMenu.closeContextMenu();

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
        <AppHeader
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
          <ViewManager
            activeView={activeView}
            // Buckets props
            buckets={s3Operations.buckets}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleRightClick={contextMenu.handleRightClick}
            loadObjects={loadObjectsWithNavigation}
            setCurrentPath={navigation.updateCurrentPath}
            setPathHistory={navigation.setPathHistory}
            setActiveView={setActiveView}
            setShowAddForm={modals.openAddBucket}
            // Objects props
            objects={s3Operations.objects}
            loadingObjects={s3Operations.loadingObjects}
            navigateToFolder={handleNavigateToFolder}
            onDrop={handleDrop}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            refreshObjects={() => loadObjectsWithNavigation(s3Operations.selectedBucket, navigation.currentPath)}
            selectedBucket={s3Operations.selectedBucket}
            // Config props
            onDeleteBucket={handleDeleteBucket}
            onEditBucket={handleEditBucket}
            onAddBucket={modals.openAddBucket}
          />
        </div>
      </div>

      <ContextMenu
        contextMenu={contextMenu.contextMenu}
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