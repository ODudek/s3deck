export default function HeaderActions({
  activeView,
  setShowAddForm,
  onCreateFolder,
  handleFolderUpload,
  pathHistory,
  navigateBack
}) {
  return (
    <div className="flex items-center space-x-2 ml-3">
      {/* Buckets view actions */}
      {activeView === "buckets" && (
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 whitespace-nowrap"
        >
          <span className="hidden sm:inline">+ Add</span>
          <span className="sm:hidden">+</span>
        </button>
      )}

      {/* Objects view actions */}
      {activeView === "objects" && (
        <>
          <button
            onClick={onCreateFolder}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center space-x-1"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="hidden sm:inline">New Folder</span>
            <span className="sm:hidden">📁+</span>
          </button>
          <input
            type="file"
            id="folderUpload"
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={handleFolderUpload}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById('folderUpload').click()}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center space-x-1"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="hidden sm:inline">Upload Folder</span>
            <span className="sm:hidden">📁↑</span>
          </button>
          {pathHistory.length > 0 && (
            <button
              onClick={navigateBack}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded font-medium transition-colors duration-200 flex items-center space-x-1 text-sm"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}