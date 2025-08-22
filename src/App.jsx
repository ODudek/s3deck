import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BucketsTable from "./components/BucketsTable";
import ObjectsTable from "./components/ObjectsTable";
import ContextMenu from "./components/ContextMenu";
import AddBucketModal from "./components/AddBucketModal";

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
  const [contextMenu, setContextMenu] = useState(null);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("http://localhost:8082/buckets")
      .then(res => res.json())
      .then(setBuckets);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const loadObjects = async (bucketId, prefix = "") => {
    setSelectedBucket(bucketId);
    setCurrentPath(prefix);
    setLoadingObjects(true);
    
    try {
      const url = `http://localhost:8082/objects?bucket=${bucketId}${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setObjects(data);
    } catch (error) {
      console.error('Error loading objects:', error);
      setObjects([]);
    } finally {
      setLoadingObjects(false);
    }
  };

  const navigateToFolder = (folderKey) => {
    setPathHistory([...pathHistory, currentPath]);
    setSearchQuery("");
    loadObjects(selectedBucket, folderKey);
  };

  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      setSearchQuery("");
      loadObjects(selectedBucket, previousPath);
    }
  };

  const navigateToBreadcrumb = (index) => {
    const pathParts = currentPath.split('/').filter(p => p !== '');
    const newPath = pathParts.slice(0, index + 1).join('/') + (index >= 0 ? '/' : '');
    const newHistoryLength = index + 1;
    setPathHistory(pathHistory.slice(0, newHistoryLength));
    setSearchQuery("");
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

  const handleRightClick = (e, type, item) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      item
    });
  };

  const handleContextAction = (action, item) => {
    setContextMenu(null);
    
    if (action === 'browse' && item) {
      setCurrentPath("");
      setPathHistory([]);
      setSearchQuery("");
      loadObjects(item.id);
      setActiveView("objects");
    } else if (action === 'open' && item) {
      navigateToFolder(item.key);
    } else if (action === 'download' && item) {
      console.log('Download:', item);
    } else if (action === 'delete' && item) {
      console.log('Delete:', item);
    } else if (action === 'edit' && item) {
      console.log('Edit:', item);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedBucket={selectedBucket}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeView={activeView}
          buckets={buckets}
          selectedBucket={selectedBucket}
          currentPath={currentPath}
          pathHistory={pathHistory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          getBreadcrumbs={getBreadcrumbs}
          navigateToBreadcrumb={navigateToBreadcrumb}
          loadObjects={loadObjects}
          navigateBack={navigateBack}
          setShowAddForm={setShowAddForm}
        />

        {/* Success/Error Messages */}
        {message && (
          <div className={`mx-3 mt-2 p-2 rounded border-l-4 ${
            messageType === "success" 
              ? "bg-green-50 border-green-400 text-green-700" 
              : "bg-red-50 border-red-400 text-red-700"
          }`}>
            <div className="flex items-center">
              {messageType === "success" ? (
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm">{message}</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {activeView === "buckets" ? (
            <BucketsTable 
              buckets={buckets}
              searchQuery={searchQuery}
              handleRightClick={handleRightClick}
              loadObjects={loadObjects}
              setCurrentPath={setCurrentPath}
              setPathHistory={setPathHistory}
              setSearchQuery={setSearchQuery}
              setActiveView={setActiveView}
              setShowAddForm={setShowAddForm}
            />
          ) : (
            <ObjectsTable 
              objects={objects}
              loadingObjects={loadingObjects}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleRightClick={handleRightClick}
              navigateToFolder={navigateToFolder}
            />
          )}
        </div>
      </div>

      <ContextMenu 
        contextMenu={contextMenu}
        handleContextAction={handleContextAction}
      />

      <AddBucketModal 
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        bucketConfig={bucketConfig}
        setBucketConfig={setBucketConfig}
        isAdding={isAdding}
        addBucketConfig={addBucketConfig}
      />
    </div>
  );
}