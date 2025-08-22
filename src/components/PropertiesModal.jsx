export default function PropertiesModal({ 
  isOpen, 
  onClose, 
  metadata, 
  isLoading,
  error 
}) {
  if (!isOpen) return null;

  const formatMetadataValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Object Properties</h3>
              <p className="text-sm text-gray-500">Metadata and information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 text-gray-600">Loading metadata...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-600 mb-2">Failed to load metadata</p>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            </div>
          ) : metadata ? (
            <div className="space-y-6">
              {/* General Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">General Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">Key:</span>
                    <span className="text-sm text-gray-900 sm:col-span-2 break-all">{metadata.key}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">Content Type:</span>
                    <span className="text-sm text-gray-900 sm:col-span-2">{metadata.contentType || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">Size:</span>
                    <span className="text-sm text-gray-900 sm:col-span-2">
                      {metadata.sizeFormatted} ({metadata.contentLength?.toLocaleString()} bytes)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">Last Modified:</span>
                    <span className="text-sm text-gray-900 sm:col-span-2">{metadata.lastModifiedFormatted || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">ETag:</span>
                    <span className="text-sm text-gray-900 sm:col-span-2 font-mono text-xs break-all">{metadata.etag || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">Storage Class:</span>
                    <span className="text-sm text-gray-900 sm:col-span-2">{metadata.storageClass || 'STANDARD'}</span>
                  </div>
                </div>
              </div>

              {/* Custom Metadata */}
              {metadata.metadata && Object.keys(metadata.metadata).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Metadata</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {Object.entries(metadata.metadata).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <span className="text-sm font-medium text-gray-500">{key}:</span>
                        <span className="text-sm text-gray-900 sm:col-span-2 break-all">{formatMetadataValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Metadata (for debugging) */}
              <details className="border border-gray-200 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Raw Metadata (JSON)
                </summary>
                <div className="px-4 pb-4">
                  <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-x-auto">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">No metadata available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}