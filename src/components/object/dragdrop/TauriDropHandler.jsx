import React from 'react';
import { listen } from '@tauri-apps/api/event';

export default function TauriDropHandler({ 
  setIsDragOver, 
  onDrop 
}) {
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
  }, [setIsDragOver, onDrop]);

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

  return null; // This component doesn't render anything
}