import HeaderTitle from './HeaderTitle';
import HeaderActions from './HeaderActions';
import SearchInput from '../navigation/SearchInput';
import Breadcrumbs from '../navigation/Breadcrumbs';

export default function AppHeader({
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
  handleFolderUpload,
  onCreateFolder
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-2">
      <div className="flex items-center justify-between mb-3">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden p-1.5 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <HeaderTitle
          activeView={activeView}
          buckets={buckets}
          selectedBucket={selectedBucket}
        />
        
        <div className="flex items-center space-x-2 ml-3">
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeView={activeView}
          />
          
          <HeaderActions
            activeView={activeView}
            setShowAddForm={setShowAddForm}
            onCreateFolder={onCreateFolder}
            handleFolderUpload={handleFolderUpload}
            pathHistory={pathHistory}
            navigateBack={navigateBack}
          />
        </div>
      </div>

      <Breadcrumbs
        activeView={activeView}
        buckets={buckets}
        selectedBucket={selectedBucket}
        getBreadcrumbs={getBreadcrumbs}
        navigateToBreadcrumb={navigateToBreadcrumb}
        loadObjects={loadObjects}
        setSearchQuery={setSearchQuery}
      />
    </div>
  );
}