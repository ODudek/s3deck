import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export default function ConfigView({
  buckets,
  onDeleteBucket,
  onEditBucket,
  onAddBucket
}) {
  const { settings, updateSetting } = useSettings();
  const [editingBucket, setEditingBucket] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleDeleteBucket = (bucketId) => {
    onDeleteBucket(bucketId);
    setShowDeleteConfirm(null);
  };

  const handleEditBucket = (bucket) => {
    setEditingBucket({ ...bucket });
  };

  const handleSaveBucket = () => {
    onEditBucket(editingBucket);
    setEditingBucket(null);
  };

  const formatFileSize = (sizeInMB) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB} MB`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto dark:text-white">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configuration</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your application settings and bucket configurations</p>
      </div>

      {/* Application Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8 hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Application Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your S3 Deck experience</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred color theme</p>
            </div>
            <div className="relative">
              <select
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer hover:border-gray-400 dark:text-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Max File Size */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Upload File Size</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Maximum size for individual file uploads</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="1024"
                value={settings.maxFileSize}
                onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(settings.maxFileSize / 1024) * 100}%, #e5e7eb ${(settings.maxFileSize / 1024) * 100}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-16">{formatFileSize(settings.maxFileSize)}</span>
            </div>
          </div>

          {/* Auto Refresh */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Refresh</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically refresh object lists</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => updateSetting('autoRefresh', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Auto Refresh Interval */}
          {settings.autoRefresh && (
            <div className="flex items-center justify-between pl-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Refresh Interval</label>
                <p className="text-sm text-gray-500">How often to refresh (seconds)</p>
              </div>
              <div className="relative">
                <select
                  value={settings.autoRefreshInterval}
                  onChange={(e) => updateSetting('autoRefreshInterval', parseInt(e.target.value))}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer hover:border-gray-400 dark:text-white"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Show Hidden Files */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Show Hidden Files</label>
              <p className="text-sm text-gray-500">Display files starting with a dot</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showHiddenFiles}
                onChange={(e) => updateSetting('showHiddenFiles', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Confirm Delete */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Confirm Deletions</label>
              <p className="text-sm text-gray-500">Ask for confirmation before deleting files</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.confirmDelete}
                onChange={(e) => updateSetting('confirmDelete', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

        </div>
      </div>

      {/* Bucket Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bucket Management</h2>
          <button
            onClick={onAddBucket}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-all duration-200 flex items-center space-x-2 hover:shadow-lg transform hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Bucket</span>
          </button>
        </div>
        <div className="p-6">
          {buckets.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 mb-3">No buckets configured</p>
              <button
                onClick={onAddBucket}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
              >
                Add your first bucket
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {buckets.map((bucket) => (
                <div key={bucket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{bucket.displayName}</h3>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Bucket: {bucket.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Region: {bucket.region}</p>
                        {bucket.endpoint && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">Endpoint: {bucket.endpoint}</p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">Access Key: {bucket.accessKey.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditBucket(bucket)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
                        title="Edit bucket"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(bucket.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                        title="Delete bucket"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-2xl transform transition-all duration-200 scale-100">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete Bucket Configuration</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this bucket configuration? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-all duration-200 hover:shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBucket(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bucket Modal */}
      {editingBucket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] mx-4 overflow-y-auto shadow-2xl transform transition-all duration-200 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Bucket Configuration</h3>
                <button
                  onClick={() => setEditingBucket(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bucket Name</label>
                    <input
                      type="text"
                      value={editingBucket.name}
                      onChange={(e) => setEditingBucket({...editingBucket, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={editingBucket.displayName}
                      onChange={(e) => setEditingBucket({...editingBucket, displayName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Access Key</label>
                    <input
                      type="text"
                      value={editingBucket.accessKey}
                      onChange={(e) => setEditingBucket({...editingBucket, accessKey: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                    <input
                      type="password"
                      value={editingBucket.secretKey}
                      onChange={(e) => setEditingBucket({...editingBucket, secretKey: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                    <input
                      type="text"
                      value={editingBucket.region}
                      onChange={(e) => setEditingBucket({...editingBucket, region: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint (Optional)</label>
                    <input
                      type="text"
                      value={editingBucket.endpoint || ''}
                      onChange={(e) => setEditingBucket({...editingBucket, endpoint: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400"
                      placeholder="https://s3.provider.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingBucket(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBucket}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
