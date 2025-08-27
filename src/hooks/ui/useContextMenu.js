import { useState, useCallback, useEffect } from 'react';

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState(null);

  // Handle context menu clicks outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleRightClick = useCallback((e, type, item) => {
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
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return { 
    contextMenu, 
    handleRightClick, 
    closeContextMenu 
  };
};