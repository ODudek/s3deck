export default function AddBucketModal({ 
  showAddForm, 
  setShowAddForm, 
  bucketConfig, 
  setBucketConfig, 
  isAdding, 
  addBucketConfig 
}) {
  if (!showAddForm) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] mx-4 overflow-y-auto shadow-2xl transform transition-all duration-200 scale-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Bucket Configuration</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={addBucketConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bucket Name</label>
              <input
                type="text"
                placeholder="my-s3-bucket"
                value={bucketConfig.name}
                onChange={(e) => setBucketConfig({...bucketConfig, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isAdding}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
              <input
                type="text"
                placeholder="My Bucket"
                value={bucketConfig.displayName}
                onChange={(e) => setBucketConfig({...bucketConfig, displayName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isAdding}
              />
            </div>
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Key</label>
              <input
                type="text"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={bucketConfig.accessKey}
                onChange={(e) => setBucketConfig({...bucketConfig, accessKey: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isAdding}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secret Key</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••••••••••"
                value={bucketConfig.secretKey}
                onChange={(e) => setBucketConfig({...bucketConfig, secretKey: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isAdding}
                required
              />
            </div>
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Region</label>
              <input
                type="text"
                placeholder="us-east-1"
                value={bucketConfig.region}
                onChange={(e) => setBucketConfig({...bucketConfig, region: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoint</label>
              <input
                type="text"
                placeholder="https://s3.provider.com"
                value={bucketConfig.endpoint}
                onChange={(e) => setBucketConfig({...bucketConfig, endpoint: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isAdding}
              />
            </div>
          </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium transition-colors duration-200"
                disabled={isAdding}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!bucketConfig.name.trim() || !bucketConfig.accessKey.trim() || !bucketConfig.secretKey.trim() || !bucketConfig.region.trim() || isAdding}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
              {isAdding ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4z" clipRule="evenodd" />
                  </svg>
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add</span>
              )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}