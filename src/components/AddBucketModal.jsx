import { useState, useEffect, useRef } from 'react';
import { useAwsProfiles } from '../hooks/useAwsProfiles';
import SearchableDropdown from './SearchableDropdown';

export default function AddBucketModal({
  showAddForm,
  setShowAddForm,
  bucketConfig,
  setBucketConfig,
  isAdding,
  addBucketConfig,
  showError
}) {
  const [configMode, setConfigMode] = useState('manual'); // 'manual' or 'aws-profile'
  const [selectedProfile, setSelectedProfile] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('');

  // Search states
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(-1);
  const [selectedBucketIndex, setSelectedBucketIndex] = useState(-1);

  const {
    profiles,
    buckets,
    loadingProfiles,
    loadingBuckets,
    bucketError,
    loadAwsProfiles,
    loadBucketsForProfile,
    hasProfiles,
    hasBuckets,
    isLoading,
    clearState,
    cancelProfilesRequest,
    cancelBucketsRequest
  } = useAwsProfiles(showError);

  // Load AWS profiles when switching to AWS Profile mode
  useEffect(() => {
    if (configMode === 'aws-profile' && !hasProfiles && !loadingProfiles) {
      loadAwsProfiles();
    }
  }, [configMode, hasProfiles, loadingProfiles, loadAwsProfiles]);

  const handleProfileSelectFocus = () => {
    // Auto-refresh profiles when user opens the dropdown
    if (configMode === 'aws-profile' && !loadingProfiles) {
      loadAwsProfiles();
    }
  };

  // Filter functions for dropdowns
  const filterProfiles = (profiles, searchTerm) => {
    if (!searchTerm) return profiles;
    return profiles.filter(profile =>
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.region && profile.region.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filterBuckets = (buckets, searchTerm) => {
    if (!searchTerm) return buckets;
    return buckets.filter(bucket =>
      bucket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bucket.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };


  // Load buckets when profile is selected
  useEffect(() => {
    if (selectedProfile && configMode === 'aws-profile') {
      // Cancel any ongoing bucket request before starting new one
      cancelBucketsRequest();
      loadBucketsForProfile(selectedProfile);
      setSelectedBucket(''); // Clear selected bucket when profile changes
    }
  }, [selectedProfile, configMode, loadBucketsForProfile, cancelBucketsRequest]);

  // Clear selected bucket when there's an error
  useEffect(() => {
    if (bucketError && selectedBucket) {
      setSelectedBucket('');
    }
  }, [bucketError, selectedBucket]);

  // Auto-fill form when bucket is selected from AWS profile
  useEffect(() => {
    if (selectedBucket && configMode === 'aws-profile') {
      const bucket = buckets.find(b => b.name === selectedBucket);
      if (bucket) {
        setBucketConfig({
          ...bucketConfig,
          name: bucket.name,
          displayName: bucket.name,
          region: bucket.region,
          // Don't auto-fill credentials - they'll come from the profile
          accessKey: '',
          secretKey: '',
          endpoint: ''
        });
      }
    }
  }, [selectedBucket, buckets, configMode, setBucketConfig]);

  // Reset form when modal closes or mode changes
  useEffect(() => {
    if (!showAddForm) {
      clearState();
      setSelectedProfile('');
      setSelectedBucket('');
      setConfigMode('manual');
      setSelectedProfileIndex(-1);
      setSelectedBucketIndex(-1);
    }
  }, [showAddForm, clearState]);

  const handleModeChange = (mode) => {
    // Cancel any ongoing requests when switching modes
    cancelProfilesRequest();
    cancelBucketsRequest();

    setConfigMode(mode);
    setSelectedProfile('');
    setSelectedBucket('');
    setSelectedProfileIndex(-1);
    setSelectedBucketIndex(-1);
    // Clear form when switching modes
    setBucketConfig({
      name: '',
      displayName: '',
      accessKey: '',
      secretKey: '',
      region: '',
      endpoint: ''
    });
  };

  const handleProfileSelect = (profile) => {
    // Don't allow selection while loading profiles
    if (loadingProfiles) return;

    setSelectedProfile(profile.name);
  };

  const handleBucketSelect = (bucket) => {
    // Don't allow selection while loading buckets
    if (loadingBuckets) return;

    setSelectedBucket(bucket.name);
  };


  // Keyboard navigation for profiles
  const handleProfileKeyDown = (e, items, selectedIndex, onSelect) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
        setSelectedProfileIndex(nextIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
        setSelectedProfileIndex(prevIndex);
        break;
      case 'Enter':
        e.preventDefault();
        if (items.length > 0 && selectedIndex >= 0) {
          onSelect(items[selectedIndex]);
        }
        break;
    }
  };

  // Keyboard navigation for buckets
  const handleBucketKeyDown = (e, items, selectedIndex, onSelect) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
        setSelectedBucketIndex(nextIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
        setSelectedBucketIndex(prevIndex);
        break;
      case 'Enter':
        e.preventDefault();
        if (items.length > 0 && selectedIndex >= 0) {
          onSelect(items[selectedIndex]);
        }
        break;
    }
  };

  // Render functions for dropdown items
  const renderProfile = (profile) => {
    return (
      <div>
        <div className="flex justify-between items-center">
          <span className="font-medium">{profile.name}</span>
        </div>
        {profile.region && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {profile.region}
          </span>
        )}
      </div>
    );
  };

  const renderBucket = (bucket) => {
    return (
      <div>
        <div className="flex justify-between items-center">
          <span className="font-medium">{bucket.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {bucket.region}
          </span>
        </div>
        {bucket.creation_date && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Created: {new Date(bucket.creation_date).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  };

  const isFormValid = () => {
    if (configMode === 'manual') {
      return bucketConfig.name.trim() &&
             bucketConfig.accessKey.trim() &&
             bucketConfig.secretKey.trim() &&
             bucketConfig.region.trim();
    } else {
      // For AWS Profile mode, we need profile and bucket selection
      return selectedProfile && selectedBucket && bucketConfig.name.trim();
    }
  };

  // Error handling is now done via notifications, so we don't need a local error display

  if (!showAddForm) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full mx-4 shadow-2xl transform transition-all duration-200 scale-100 h-[85vh]">
        <div className="p-4 flex flex-col h-full pr-5 pl-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Bucket Configuration</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Configuration Mode Toggle */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => handleModeChange('manual')}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  configMode === 'manual'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Manual Config
              </button>
              <button
                onClick={() => handleModeChange('aws-profile')}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  configMode === 'aws-profile'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                AWS Profile
              </button>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            addBucketConfig(e, configMode, selectedProfile);
          }} className={`flex flex-col h-full`}>
            {/* Form content with consistent height */}
            <div className={`space-y-4 flex-grow overflow-y-auto pr-1 pl-1`}>
              {configMode === 'aws-profile' ? (
              <>
                {/* AWS Profile Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      AWS Profile
                    </label>
                    {loadingProfiles && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Refreshing profiles...
                      </span>
                    )}
                  </div>
                  <SearchableDropdown
                    items={profiles}
                    selectedItem={selectedProfile}
                    onItemSelect={(profile) => {
                      if (loadingProfiles) return;
                      setSelectedProfile(profile.name);
                      handleProfileSelectFocus(); // Trigger buckets load
                    }}
                    placeholder="Search AWS profiles..."
                    loadingPlaceholder="Loading profiles..."
                    isLoading={loadingProfiles}
                    disabled={isAdding}
                    renderItem={renderProfile}
                    noResultsText="No profiles found"
                    noItemsText="No AWS profiles available"
                    filterItems={filterProfiles}
                    onKeyDown={handleProfileKeyDown}
                    selectedIndex={selectedProfileIndex}
                    onSelectedIndexChange={setSelectedProfileIndex}
                    getItemKey={(profile) => profile.name}
                  />
                  {profiles.length === 0 && !loadingProfiles && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                      <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                        No AWS profiles found
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Configure AWS CLI: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">aws configure</code>
                      </p>
                    </div>
                  )}
                </div>

                {/* Bucket Selection */}
                {selectedProfile && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Available Buckets
                      {loadingBuckets && (
                        <span className="ml-2 text-xs text-gray-500">Loading...</span>
                      )}
                    </label>
                    {bucketError ? (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                              Unable to load buckets
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              Please check your AWS credentials and try again.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <SearchableDropdown
                        items={buckets}
                        selectedItem={selectedBucket}
                        onItemSelect={(bucket) => {
                          if (loadingBuckets) return;
                          setSelectedBucket(bucket.name);
                        }}
                        placeholder="Search buckets..."
                        loadingPlaceholder="Loading buckets..."
                        isLoading={loadingBuckets}
                        disabled={isAdding || bucketError}
                        renderItem={renderBucket}
                        noResultsText="No buckets found"
                        noItemsText="No buckets available"
                        filterItems={filterBuckets}
                        onKeyDown={handleBucketKeyDown}
                        selectedIndex={selectedBucketIndex}
                        onSelectedIndexChange={setSelectedBucketIndex}
                        getItemKey={(bucket) => bucket.name}
                      />
                    )}
                  </div>
                )}

                {/* Display Name (editable) */}
                {selectedBucket && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                    <input
                      type="text"
                      placeholder="My Bucket"
                      value={bucketConfig.displayName}
                      onChange={(e) => setBucketConfig({...bucketConfig, displayName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={isAdding || isLoading}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Manual Configuration Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bucket Name</label>
                    <input
                      type="text"
                      placeholder="my-s3-bucket"
                      value={bucketConfig.name}
                      onChange={(e) => setBucketConfig({...bucketConfig, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={isAdding || isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                    <input
                      type="text"
                      placeholder="My Bucket"
                      value={bucketConfig.displayName}
                      onChange={(e) => setBucketConfig({...bucketConfig, displayName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={isAdding || isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Key</label>
                    <input
                      type="text"
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      value={bucketConfig.accessKey}
                      onChange={(e) => setBucketConfig({...bucketConfig, accessKey: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={isAdding || isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secret Key</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••••••••••••••••••••••"
                      value={bucketConfig.secretKey}
                      onChange={(e) => setBucketConfig({...bucketConfig, secretKey: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={isAdding || isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Region</label>
                    <input
                      type="text"
                      placeholder="us-east-1"
                      value={bucketConfig.region}
                      onChange={(e) => setBucketConfig({...bucketConfig, region: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={isAdding || isLoading}
                      list="regions"
                      required
                    />
                    <datalist id="regions">
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-west-2">US West (Oregon)</option>
                      <option value="eu-west-1">EU (Ireland)</option>
                      <option value="eu-central-1">EU (Frankfurt)</option>
                      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoint</label>
                    <input
                      type="text"
                      placeholder="https://s3.provider.com"
                      value={bucketConfig.endpoint}
                      onChange={(e) => setBucketConfig({...bucketConfig, endpoint: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={isAdding || isLoading}
                    />
                  </div>
                </div>
              </>
            )}
            </div>

            {/* Buttons always at the bottom */}
            <div className={`flex justify-end space-x-3 mt-2 pt-4 border-t border-gray-200 dark:border-gray-600`}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium transition-colors duration-200"
                disabled={isAdding}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid() || isAdding || isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isAdding ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4z" clipRule="evenodd" />
                    </svg>
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
