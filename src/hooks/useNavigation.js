import { useState, useRef, useEffect } from 'react';

export const useNavigation = () => {
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState([]);
  const currentPathRef = useRef("");

  // Update ref whenever state changes
  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  const navigateToFolder = (folderKey, loadObjectsCallback, selectedBucket) => {
    setPathHistory([...pathHistory, currentPath]);
    loadObjectsCallback(selectedBucket, folderKey);
  };

  const navigateBack = (loadObjectsCallback, selectedBucket) => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      loadObjectsCallback(selectedBucket, previousPath);
    }
  };

  const navigateToBreadcrumb = (index, loadObjectsCallback, selectedBucket) => {
    const pathParts = currentPath.split('/').filter(p => p !== '');
    const newPath = pathParts.slice(0, index + 1).join('/') + (index >= 0 ? '/' : '');
    const newHistoryLength = index + 1;
    setPathHistory(pathHistory.slice(0, newHistoryLength));
    loadObjectsCallback(selectedBucket, newPath === '/' ? '' : newPath);
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [];
    const parts = currentPath.split('/').filter(p => p !== '');
    return parts;
  };

  const resetNavigation = () => {
    setCurrentPath("");
    setPathHistory([]);
    currentPathRef.current = "";
  };

  const updateCurrentPath = (path) => {
    setCurrentPath(path);
    currentPathRef.current = path;
  };

  return {
    currentPath,
    pathHistory,
    currentPathRef,
    navigateToFolder,
    navigateBack,
    navigateToBreadcrumb,
    getBreadcrumbs,
    resetNavigation,
    updateCurrentPath,
    setCurrentPath,
    setPathHistory
  };
};
