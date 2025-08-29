export default function HeaderTitle({
  activeView,
  buckets,
  selectedBucket
}) {
  const getTitle = () => {
    switch (activeView) {
      case "buckets":
        return "Buckets";
      case "config":
        return "Configuration";
      default:
        return buckets.find(b => b.id === selectedBucket)?.displayName || 
               buckets.find(b => b.id === selectedBucket)?.name || 
               'Bucket';
    }
  };

  return (
    <div className="flex-1 min-w-0">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
        {getTitle()}
      </h2>
    </div>
  );
}