import { useState } from 'react';

export const useModals = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
  const [propertiesModal, setPropertiesModal] = useState({ isOpen: false, item: null });

  const openAddBucket = () => setShowAddForm(true);
  const closeAddBucket = () => setShowAddForm(false);

  const openDeleteModal = (item) => {
    setDeleteModal({ isOpen: true, item });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, item: null });
  };

  const openPropertiesModal = (item) => {
    setPropertiesModal({ isOpen: true, item });
  };

  const closePropertiesModal = () => {
    setPropertiesModal({ isOpen: false, item: null });
  };

  return {
    // Add bucket modal
    showAddForm,
    openAddBucket,
    closeAddBucket,

    // Delete modal
    deleteModal,
    openDeleteModal,
    closeDeleteModal,

    // Properties modal
    propertiesModal,
    openPropertiesModal,
    closePropertiesModal
  };
};
