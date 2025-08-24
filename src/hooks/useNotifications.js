import { useState, useEffect, useRef } from 'react';

export const useNotifications = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const timeoutRef = useRef(null);

  const showNotification = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Auto-hide success and info messages after 3 seconds
    if (type === "success" || type === "info") {
      timeoutRef.current = setTimeout(() => {
        clearNotification();
      }, 3000);
    }
  };

  const showSuccess = (text) => showNotification(text, "success");
  const showError = (text) => showNotification(text, "error");
  const showInfo = (text) => showNotification(text, "info");
  const showWarning = (text) => showNotification(text, "warning");

  const clearNotification = () => {
    setMessage("");
    setMessageType("");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    message,
    messageType,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearNotification
  };
};
