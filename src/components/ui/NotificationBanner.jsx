import { useState } from 'react';

export default function NotificationBanner({ message, messageType, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] max-w-sm">
      <div className={`p-4 rounded-lg shadow-lg border transition-all duration-300 ${
        messageType === "success"
          ? "bg-green-50 border-green-200 text-green-800"
          : messageType === "info"
          ? "bg-blue-50 border-blue-200 text-blue-800"
          : messageType === "warning"
          ? "bg-yellow-50 border-yellow-200 text-yellow-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start min-w-0 flex-1">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {messageType === "success" ? (
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : messageType === "info" ? (
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              ) : messageType === "warning" ? (
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Message */}
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium break-words">
                {message}
              </span>
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className={`flex-shrink-0 ml-2 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded ${
                messageType === "success"
                  ? "text-green-600 hover:text-green-800 focus:ring-green-500"
                  : messageType === "info"
                  ? "text-blue-600 hover:text-blue-800 focus:ring-blue-500"
                  : messageType === "warning"
                  ? "text-yellow-600 hover:text-yellow-800 focus:ring-yellow-500"
                  : "text-red-600 hover:text-red-800 focus:ring-red-500"
              }`}
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
