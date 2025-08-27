export default function Breadcrumbs({
  activeView,
  buckets,
  selectedBucket,
  getBreadcrumbs,
  navigateToBreadcrumb,
  loadObjects,
  setSearchQuery
}) {
  // Only show breadcrumbs for objects view
  if (activeView !== "objects") {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 pt-1 pb-2">
      <button
        onClick={() => {
          setSearchQuery("");
          loadObjects(selectedBucket, "");
        }}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium whitespace-nowrap text-sm"
      >
        {buckets.find(b => b.id === selectedBucket)?.displayName || buckets.find(b => b.id === selectedBucket)?.name}
      </button>
      {getBreadcrumbs().map((part, index) => (
        <div key={index} className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <button
            onClick={() => navigateToBreadcrumb(index)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium whitespace-nowrap text-sm"
          >
            {part}
          </button>
        </div>
      ))}
    </div>
  );
}