export default function BucketsTable({ 
  buckets, 
  searchQuery, 
  handleRightClick, 
  loadObjects, 
  setCurrentPath, 
  setPathHistory, 
  setSearchQuery, 
  setActiveView, 
  setShowAddForm 
}) {
  const filteredBuckets = buckets.filter(bucket => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (bucket.displayName || bucket.name).toLowerCase().includes(query) ||
      bucket.name.toLowerCase().includes(query) ||
      bucket.region.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Name
              </th>
              <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Region
              </th>
              <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBuckets.length === 0 && !searchQuery ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center">
                  <p className="text-gray-500 mb-3">No buckets configured</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors duration-200"
                  >
                    Add bucket
                  </button>
                </td>
              </tr>
            ) : filteredBuckets.length === 0 && searchQuery ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center">
                  <p className="text-gray-500 mb-3">No buckets found matching "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Clear search
                  </button>
                </td>
              </tr>
            ) : (
              filteredBuckets.map((bucket) => (
                <tr 
                  key={bucket.id} 
                  className="hover:bg-gray-50 cursor-pointer select-none"
                  onContextMenu={(e) => handleRightClick(e, 'bucket', bucket)}
                  onDoubleClick={() => {
                    setCurrentPath("");
                    setPathHistory([]);
                    setSearchQuery("");
                    loadObjects(bucket.id);
                    setActiveView("objects");
                  }}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6">
                        <div className="h-6 w-6 rounded bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-2 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                          {bucket.displayName || bucket.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {bucket.name !== bucket.displayName && bucket.name}
                          <span className="sm:hidden"> • {bucket.region}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-2 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{bucket.region}</span>
                    {bucket.endpoint && (
                      <div className="text-xs text-gray-500">Custom</div>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      OK
                    </span>
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