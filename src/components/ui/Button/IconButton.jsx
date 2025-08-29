export default function IconButton({ 
  variant = 'secondary', 
  size = 'md',
  icon: Icon,
  disabled = false,
  className = '',
  ...props 
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-colors duration-200 rounded focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-blue-300",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 focus:ring-gray-500",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:ring-gray-500"
  };
  
  const sizes = {
    sm: "w-6 h-6 p-1",
    md: "w-8 h-8 p-1.5", 
    lg: "w-10 h-10 p-2"
  };
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${
    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
  }`;
  
  return (
    <button 
      className={classes}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className={iconSizes[size]} />}
    </button>
  );
}