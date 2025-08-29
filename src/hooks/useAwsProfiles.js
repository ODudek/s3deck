import { useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useAwsProfiles(showError = null) {
  const [profiles, setProfiles] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  const [bucketError, setBucketError] = useState(null);


  // Refs for cancellation
  const profilesAbortController = useRef(null);
  const bucketsAbortController = useRef(null);

  // Cancel ongoing profiles request
  const cancelProfilesRequest = useCallback(() => {
    if (profilesAbortController.current) {
      profilesAbortController.current.abort();
      profilesAbortController.current = null;
      setLoadingProfiles(false);
    }
  }, []);

  // Load available AWS profiles
  const loadAwsProfiles = useCallback(async () => {
    // Cancel any existing request
    cancelProfilesRequest();

    setLoadingProfiles(true);

    // Create new abort controller
    profilesAbortController.current = new AbortController();
    const currentController = profilesAbortController.current;

    try {
      const awsProfiles = await invoke('get_aws_profiles');

      // Check if request was cancelled
      if (currentController.signal.aborted) {
        return [];
      }

      setProfiles(awsProfiles);
      return awsProfiles;
    } catch (err) {
      // Check if request was cancelled
      if (currentController.signal.aborted) {
        return [];
      }

      console.error('Failed to load AWS profiles:', err);
      let errorMessage = 'Failed to load AWS profiles';

      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = err.error;
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err);
      }

      if (showError) {
        showError(errorMessage);
      }
      setProfiles([]);
      return [];
    } finally {
      if (profilesAbortController.current === currentController) {
        setLoadingProfiles(false);
        profilesAbortController.current = null;
      }
    }
  }, [cancelProfilesRequest]);

  // Cancel ongoing buckets request
  const cancelBucketsRequest = useCallback(() => {
    if (bucketsAbortController.current) {
      bucketsAbortController.current.abort();
      bucketsAbortController.current = null;
      setLoadingBuckets(false);
    }
  }, []);

  // Load buckets for a specific profile
  const loadBucketsForProfile = useCallback(async (profileName) => {
    if (!profileName) {
      cancelBucketsRequest();
      setBuckets([]);
      setBucketError(null);
      return [];
    }

    // Cancel any existing request
    cancelBucketsRequest();

    setLoadingBuckets(true);
    setBucketError(null);

    // Create new abort controller
    bucketsAbortController.current = new AbortController();
    const currentController = bucketsAbortController.current;

    try {
      const profileBuckets = await invoke('get_buckets_for_profile', { profileName });

      // Check if request was cancelled
      if (currentController.signal.aborted) {
        return [];
      }

      setBuckets(profileBuckets);
      setBucketError(null);
      return profileBuckets;
    } catch (err) {
      // Check if request was cancelled
      if (currentController.signal.aborted) {
        return [];
      }

      console.error('Failed to load buckets for profile:', err);
      let errorMessage = `Failed to load buckets for profile: ${profileName}`;

      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = err.error;
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err);
      }

      setBucketError(errorMessage);
      if (showError) {
        showError(errorMessage);
      }
      setBuckets([]);
      return [];
    } finally {
      if (bucketsAbortController.current === currentController) {
        setLoadingBuckets(false);
        bucketsAbortController.current = null;
      }
    }
  }, [cancelBucketsRequest]);

  // Validate a specific AWS profile
  const validateProfile = useCallback(async (profileName) => {
    if (!profileName) return null;

    try {
      const status = await invoke('validate_aws_profile', { profileName });
      return status;
    } catch (err) {
      console.error('Failed to validate profile:', err);
      return 'Unknown';
    }
  }, []);

  // Clear all state and cancel any ongoing requests
  const clearState = useCallback(() => {
    cancelProfilesRequest();
    cancelBucketsRequest();
    setProfiles([]);
    setBuckets([]);
    setBucketError(null);
  }, [cancelProfilesRequest, cancelBucketsRequest]);

  // Get profile status display
  const getProfileStatusDisplay = useCallback((status) => {
    switch (status) {
      case 'Valid':
        return { text: 'Valid', color: 'text-green-600 dark:text-green-400', icon: '✅' };
      case 'Expired':
        return { text: 'Expired', color: 'text-red-600 dark:text-red-400', icon: '⏰' };
      case 'Invalid':
        return { text: 'Invalid', color: 'text-red-600 dark:text-red-400', icon: '❌' };
      case 'Unknown':
      default:
        return { text: 'Unknown', color: 'text-gray-500 dark:text-gray-400', icon: '❓' };
    }
  }, []);

  // Get error display message based on error type
  const getErrorDisplay = useCallback((error) => {
    if (!error) return null;

    // Ensure error is a string
    let errorString = error;
    if (typeof error !== 'string') {
      errorString = error.toString ? error.toString() : String(error);
    }

    const errorLower = errorString.toLowerCase();

    if (errorLower.includes('expired') || errorLower.includes('invalid')) {
      return {
        title: 'Credentials Issue',
        message: 'Profile credentials have expired or are invalid. Please refresh your AWS credentials.',
        suggestion: 'Run `aws sso login` or update your credentials in ~/.aws/credentials'
      };
    }

    if (errorLower.includes('not found') || errorLower.includes('no profiles')) {
      return {
        title: 'No AWS Profiles Found',
        message: 'No AWS profiles were found on this system.',
        suggestion: 'Configure AWS CLI by running `aws configure` or `aws sso configure`'
      };
    }

    if (errorLower.includes('access denied') || errorLower.includes('forbidden')) {
      return {
        title: 'Access Denied',
        message: 'Access denied for the selected profile.',
        suggestion: 'Check your AWS permissions and policies'
      };
    }

    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return {
        title: 'Network Error',
        message: 'Failed to connect to AWS services.',
        suggestion: 'Check your internet connection and AWS service status'
      };
    }

    return {
      title: 'Error',
      message: errorString,
      suggestion: 'Please try again or check your AWS configuration'
    };
  }, []);

  return {
    // State
    profiles,
    buckets,
    loadingProfiles,
    loadingBuckets,
    bucketError,

    // Actions
    loadAwsProfiles,
    loadBucketsForProfile,
    validateProfile,
    clearState,
    cancelProfilesRequest,
    cancelBucketsRequest,

    // Helpers
    getProfileStatusDisplay,
    getErrorDisplay,

    // Computed values
    hasProfiles: profiles.length > 0,
    hasBuckets: buckets.length > 0,
    isLoading: loadingProfiles || loadingBuckets,
  };
}
