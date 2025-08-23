import { useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export const useAutoRefresh = (refreshFunction, dependencies = []) => {
  const { settings } = useSettings();
  const intervalRef = useRef(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    if (!settings.autoRefresh || !refreshFunction) {
      return;
    }

    const startInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (isActiveRef.current && typeof refreshFunction === 'function') {
          refreshFunction();
        }
      }, settings.autoRefreshInterval * 1000);
    };

    startInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings.autoRefresh, settings.autoRefreshInterval, refreshFunction, ...dependencies]);

  // Pause/resume auto refresh
  const pauseAutoRefresh = () => {
    isActiveRef.current = false;
  };

  const resumeAutoRefresh = () => {
    isActiveRef.current = true;
  };

  return {
    pauseAutoRefresh,
    resumeAutoRefresh,
    isAutoRefreshEnabled: settings.autoRefresh
  };
};