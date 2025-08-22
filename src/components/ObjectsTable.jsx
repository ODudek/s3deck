export default function ObjectsTable({
  objects,
  loadingObjects,
  searchQuery,
  setSearchQuery,
  handleRightClick,
  navigateToFolder
}) {
  const filteredObjects = objects.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(query);
  });

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto max-h-[90vh] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Name
              </th>
              <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Size
              </th>
              <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Modified
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loadingObjects ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredObjects.length === 0 && !searchQuery ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center">
                  <p className="text-gray-500">Empty bucket</p>
                </td>
              </tr>
            ) : filteredObjects.length === 0 && searchQuery ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center">
                  <p className="text-gray-500 mb-3">No items found matching "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Clear search
                  </button>
                </td>
              </tr>
            ) : (
              filteredObjects.map((item) => (
                <tr
                  key={item.key}
                  className={`hover:bg-gray-50 cursor-pointer select-none ${
                    loadingObjects ? 'pointer-events-none opacity-50' : ''
                  }`}
                  onContextMenu={(e) => handleRightClick(e, 'object', item)}
                  onDoubleClick={() => {
                    if (item.isFolder && !loadingObjects) {
                      navigateToFolder(item.key);
                    }
                  }}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-4 w-4">
                        {item.isFolder ? (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-2 min-w-0 flex-1">
                        <div className={`text-sm font-medium truncate transition-colors ${
                          item.isFolder
                            ? "text-blue-600 hover:text-blue-800"
                            : "text-gray-900 hover:text-blue-600"
                        }`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {!item.isFolder && `${item.size.toLocaleString()} bytes`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.isFolder ? "-" : `${item.size.toLocaleString()} bytes`}
                  </td>
                  <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
