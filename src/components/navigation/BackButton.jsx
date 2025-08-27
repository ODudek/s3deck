export default function BackButton({ 
  pathHistory, 
  navigateBack 
}) {
  if (pathHistory.length === 0) {
    return null;
  }

  return (
    <button
      onClick={navigateBack}
      className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded font-medium transition-colors duration-200 flex items-center space-x-1 text-sm"
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}