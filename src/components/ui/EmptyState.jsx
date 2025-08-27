export default function EmptyState({ 
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action}
    </div>
  );
}