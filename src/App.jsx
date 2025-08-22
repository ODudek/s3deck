import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [buckets, setBuckets] = useState([]);
  const [objects, setObjects] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState([]);
  const [activeView, setActiveView] = useState("buckets");
  const [bucketConfig, setBucketConfig] = useState({
    name: "",
    displayName: "",
    region: "",
    accessKey: "",
    secretKey: "",
    endpoint: ""
  });
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8082/buckets")
      .then(res => res.json())
      .then(setBuckets);
  }, []);

  const loadObjects = (bucketId, prefix = "") => {
    setSelectedBucket(bucketId);
    setCurrentPath(prefix);
    const url = `http://localhost:8082/objects?bucket=${bucketId}${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ''}`;
    fetch(url)
      .then(res => res.json())
      .then(setObjects);
  };

  const navigateToFolder = (folderKey) => {
    setPathHistory([...pathHistory, currentPath]);
    loadObjects(selectedBucket, folderKey);
  };

  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      loadObjects(selectedBucket, previousPath);
    }
  };

  const navigateToBreadcrumb = (index) => {
    const pathParts = currentPath.split('/').filter(p => p !== '');
    const newPath = pathParts.slice(0, index + 1).join('/') + (index >= 0 ? '/' : '');
    const newHistoryLength = index + 1;
    setPathHistory(pathHistory.slice(0, newHistoryLength));
    loadObjects(selectedBucket, newPath === '/' ? '' : newPath);
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [];
    const parts = currentPath.split('/').filter(p => p !== '');
    return parts;
  };

  const addBucketConfig = async (e) => {
    e.preventDefault();
    if (!bucketConfig.name.trim() || !bucketConfig.accessKey.trim() || !bucketConfig.secretKey.trim() || !bucketConfig.region.trim()) return;

    setIsAdding(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8082/add-bucket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bucketConfig),
      });

      if (response.ok) {
        setMessage("Bucket configuration added successfully!");
        setMessageType("success");
        setShowAddForm(false);
        setBucketConfig({
          name: "",
          displayName: "",
          region: "",
          accessKey: "",
          secretKey: "",
          endpoint: ""
        });
        // Refresh buckets list
        const bucketsResponse = await fetch("http://localhost:8082/buckets");
        const updatedBuckets = await bucketsResponse.json();
        setBuckets(updatedBuckets);
      } else {
        const error = await response.text();
        setMessage(`Error: ${error}`);
        setMessageType("error");
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType("error");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Logo Section */}
        <div className="p-6">
          <div className="bg-blue-600 rounded-lg p-3 inline-flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <div className="mt-3">
            <h1 className="text-xl font-bold text-white">S3Deck</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Storage</h3>
            <button
              onClick={() => setActiveView("buckets")}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                activeView === "buckets" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span>Bucket Management</span>
            </button>
            {selectedBucket && (
              <button
                onClick={() => setActiveView("objects")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-3 ml-4 mt-1 ${
                  activeView === "objects" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <span>Objects</span>
              </button>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Settings</h3>
            <button className="w-full text-left px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>Configuration</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {activeView === "buckets" ? "S3 Bucket Management" : `Objects in ${buckets.find(b => b.id === selectedBucket)?.displayName || buckets.find(b => b.id === selectedBucket)?.name || 'Bucket'}`}
              </h2>
              {activeView === "objects" && (
                <div className="flex items-center mt-2 space-x-1 sm:space-x-2 overflow-x-auto">
                  <button
                    onClick={() => loadObjects(selectedBucket, "")}
                    className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap text-sm sm:text-base"
                  >
                    {buckets.find(b => b.id === selectedBucket)?.displayName || buckets.find(b => b.id === selectedBucket)?.name}
                  </button>
                  {getBreadcrumbs().map((part, index) => (
                    <div key={index} className="flex items-center space-x-1 sm:space-x-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <button
                        onClick={() => navigateToBreadcrumb(index)}
                        className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap text-sm sm:text-base"
                      >
                        {part}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">
                {activeView === "buckets" ? "Manage your S3 bucket configurations and connections." : "Browse and manage files in your S3 bucket."}
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 ml-4">
              <div className="hidden md:flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200 text-sm">
                  Search
                </button>
              </div>
              {activeView === "buckets" && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base whitespace-nowrap"
                >
                  <span className="hidden sm:inline">+ Add Bucket</span>
                  <span className="sm:hidden">+</span>
                </button>
              )}
              {activeView === "objects" && pathHistory.length > 0 && (
                <button
                  onClick={navigateBack}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          {activeView === "buckets" && (
            <div className="flex space-x-1 mt-6">
              <button className="px-6 py-2 bg-white border-b-2 border-blue-600 text-blue-600 font-medium">
                All Buckets
              </button>
              <button className="px-6 py-2 text-gray-500 hover:text-gray-700 font-medium">
                Active
              </button>
              <button className="px-6 py-2 text-gray-500 hover:text-gray-700 font-medium">
                Inactive
              </button>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-lg border-l-4 ${
            messageType === "success" 
              ? "bg-green-50 border-green-400 text-green-700" 
              : "bg-red-50 border-red-400 text-red-700"
          }`}>
            <div className="flex items-center">
              {messageType === "success" ? (
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm sm:text-base">{message}</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {activeView === "buckets" ? (
            /* Buckets Table */
            <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Bucket Name
                      </th>
                      <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Region
                      </th>
                      <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {buckets.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <p className="text-gray-500 text-lg mb-4">No buckets configured yet</p>
                          <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                          >
                            Add your first bucket
                          </button>
                        </td>
                      </tr>
                    ) : (
                      buckets.map((bucket) => (
                        <tr key={bucket.id} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {bucket.displayName || bucket.name}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 truncate">
                                  {bucket.name !== bucket.displayName && bucket.name}
                                  <span className="sm:hidden"> • {bucket.region}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{bucket.region}</span>
                            {bucket.endpoint && (
                              <div className="text-xs text-gray-500">Custom endpoint</div>
                            )}
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Connected
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-left text-sm font-medium">
                            <div className="flex space-x-1 sm:space-x-2">
                              <button
                                onClick={() => {
                                  setCurrentPath("");
                                  setPathHistory([]);
                                  loadObjects(bucket.id);
                                  setActiveView("objects");
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium"
                              >
                                Browse
                              </button>
                              <button className="hidden sm:inline-block text-gray-600 hover:text-gray-800 px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 text-sm">
                                Edit
                              </button>
                              <button className="hidden sm:inline-block text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-200 hover:bg-red-50 text-sm">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Objects Table */
            <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Object Name
                      </th>
                      <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Size
                      </th>
                      <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Last Modified
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {objects.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H7a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <p className="text-gray-500 text-lg">This bucket is empty</p>
                        </td>
                      </tr>
                    ) : (
                      objects.map((item) => (
                        <tr key={item.key} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8">
                                {item.isFolder ? (
                                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                {item.isFolder ? (
                                  <button
                                    onClick={() => navigateToFolder(item.key)}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block max-w-full"
                                  >
                                    {item.name}
                                  </button>
                                ) : (
                                  <>
                                    <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                                    <div className="text-xs text-gray-500 sm:hidden">
                                      {item.size.toLocaleString()} bytes
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.isFolder ? "-" : `${item.size.toLocaleString()} bytes`}
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            -
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-left text-sm font-medium">
                            <div className="flex space-x-1 sm:space-x-2">
                              {item.isFolder ? (
                                <button
                                  onClick={() => navigateToFolder(item.key)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium"
                                >
                                  Open
                                </button>
                              ) : (
                                <>
                                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium">
                                    <span className="hidden sm:inline">Download</span>
                                    <span className="sm:hidden">↓</span>
                                  </button>
                                  <button className="hidden sm:inline-block text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-200 hover:bg-red-50 text-sm">
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Bucket Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add S3 Bucket Configuration</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={addBucketConfig} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bucket Name *</label>
                  <input
                    type="text"
                    placeholder="my-s3-bucket"
                    value={bucketConfig.name}
                    onChange={(e) => setBucketConfig({...bucketConfig, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={isAdding}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                  <input
                    type="text"
                    placeholder="My Production Bucket"
                    value={bucketConfig.displayName}
                    onChange={(e) => setBucketConfig({...bucketConfig, displayName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={isAdding}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Key *</label>
                  <input
                    type="text"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={bucketConfig.accessKey}
                    onChange={(e) => setBucketConfig({...bucketConfig, accessKey: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={isAdding}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key *</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••••••••••••"
                    value={bucketConfig.secretKey}
                    onChange={(e) => setBucketConfig({...bucketConfig, secretKey: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={isAdding}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
                  <input
                    type="text"
                    placeholder="us-east-1"
                    value={bucketConfig.region}
                    onChange={(e) => setBucketConfig({...bucketConfig, region: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={isAdding}
                    list="regions"
                    required
                  />
                  <datalist id="regions">
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="eu-west-1">EU (Ireland)</option>
                    <option value="eu-central-1">EU (Frankfurt)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Endpoint</label>
                  <input
                    type="text"
                    placeholder="https://s3.custom-provider.com"
                    value={bucketConfig.endpoint}
                    onChange={(e) => setBucketConfig({...bucketConfig, endpoint: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={isAdding}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bucketConfig.name.trim() || !bucketConfig.accessKey.trim() || !bucketConfig.secretKey.trim() || !bucketConfig.region.trim() || isAdding}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isAdding ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4z" clipRule="evenodd" />
                      </svg>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Configuration</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
