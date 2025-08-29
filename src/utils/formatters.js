// Helper function to format last modified date
export const formatLastModified = (lastModified) => {
  if (!lastModified) return '-';

  try {
    const date = new Date(lastModified);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString();
  } catch (error) {
    return '-';
  }
};

// Helper function to format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};