// Utility function to extract error message from Tauri error objects
export const extractErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  // Handle Tauri error objects like { "S3": "Failed to copy object: service error" }
  if (typeof error === 'object' && error !== null) {
    // Try to find the error message in common error object structures
    const errorKeys = ['S3', 'Config', 'Io', 'Serialization', 'BucketNotFound', 'InvalidPath'];
    for (const key of errorKeys) {
      if (error[key]) {
        return error[key];
      }
    }

    // Fallback to JSON representation
    try {
      return JSON.stringify(error);
    } catch {
      return error.toString();
    }
  }

  return 'Unknown error';
};