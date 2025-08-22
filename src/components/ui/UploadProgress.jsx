export default function UploadProgress({ uploadProgress }) {
  if (uploadProgress.length === 0) return null;

  return (
    <div className="mx-3 mt-2 p-3 bg-gray-50 rounded border">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Progress</h4>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {uploadProgress.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center text-xs">
            <div className="flex-1 truncate mr-2">{item.name}</div>
            <div className={`px-2 py-0.5 rounded text-xs ${
              item.status === 'completed' ? 'bg-green-100 text-green-800' :
              item.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
              item.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {item.status}
            </div>
          </div>
        ))}
        {uploadProgress.length > 5 && (
          <div className="text-xs text-gray-500 text-center pt-1">
            ... and {uploadProgress.length - 5} more files
          </div>
        )}
      </div>
    </div>
  );
}
