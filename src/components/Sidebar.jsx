export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeView,
  setActiveView,
  selectedBucket,
  setSearchQuery
}) {
  const handleNavClick = (view) => {
    setActiveView(view);
    setSearchQuery("");
    // Close sidebar on mobile after navigation (lg breakpoint is 1024px)
    if (window.innerWidth < 1024 && sidebarOpen) {
      setSidebarOpen(false);
    }
  };
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-56 bg-slate-800 dark:bg-gray-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Logo Section */}
        <div className="p-3">
          <div className="flex items-center space-x-2">
            <img src="/s3deck.svg" alt="S3Deck" className="w-6 h-6" />
            <h1 className="text-sm font-bold text-white">S3Deck</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          <div className="mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Storage</h3>
            <button
              onClick={() => handleNavClick("buckets")}
              className={`w-full text-left px-3 py-1.5 rounded transition-colors duration-200 flex items-center space-x-2 ${
                activeView === "buckets" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span className="text-sm">Buckets</span>
            </button>
            {selectedBucket && (
              <button
                onClick={() => handleNavClick("objects")}
                className={`w-full text-left px-3 py-1.5 rounded transition-colors duration-200 flex items-center space-x-2 ml-3 mt-0.5 ${
                  activeView === "objects" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Objects</span>
              </button>
            )}
          </div>

          <div className="mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Settings</h3>
            <button
              onClick={() => handleNavClick("config")}
              className={`w-full text-left px-3 py-1.5 rounded transition-colors duration-200 flex items-center space-x-2 ${
                activeView === "config" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Config</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
