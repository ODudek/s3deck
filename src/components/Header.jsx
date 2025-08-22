export default function Header({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeView, 
  buckets, 
  selectedBucket, 
  currentPath, 
  pathHistory, 
  searchQuery, 
  setSearchQuery, 
  getBreadcrumbs, 
  navigateToBreadcrumb, 
  loadObjects, 
  navigateBack, 
  setShowAddForm,
  handleFolderUpload 
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden p-1.5 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {activeView === "buckets" ? "Buckets" : `${buckets.find(b => b.id === selectedBucket)?.displayName || buckets.find(b => b.id === selectedBucket)?.name || 'Bucket'}`}
          </h2>
          {activeView === "objects" && (
            <div className="flex items-center mt-1 space-x-1 overflow-x-auto">
              <button
                onClick={() => {
                  setSearchQuery("");
                  loadObjects(selectedBucket, "");
                }}
                className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap text-xs"
              >
                {buckets.find(b => b.id === selectedBucket)?.displayName || buckets.find(b => b.id === selectedBucket)?.name}
              </button>
              {getBreadcrumbs().map((part, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap text-xs"
                  >
                    {part}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 sm:w-40 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
            />
            <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600"
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          
          {activeView === "buckets" && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 whitespace-nowrap"
            >
              <span className="hidden sm:inline">+ Add</span>
              <span className="sm:hidden">+</span>
            </button>
          )}
          {activeView === "objects" && (
            <>
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
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium transition-colors duration-200 flex items-center space-x-1 text-sm"
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
      </div>
    </div>
  );
}