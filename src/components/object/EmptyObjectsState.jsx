export default function EmptyObjectsState({ searchQuery, setSearchQuery }) {
  if (searchQuery) {
    return (
      <tr>
        <td colSpan="3" className="px-6 py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-3">No items found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
          >
            Clear search
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan="3" className="px-6 py-16 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Empty bucket</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Drag and drop files or folders here to upload</p>
        </div>
      </td>
    </tr>
  );
}