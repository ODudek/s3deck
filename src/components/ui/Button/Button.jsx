export default function Button({ 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  children,
  className = '',
  ...props 
}) {
  const baseClasses = "font-medium transition-colors duration-200 rounded focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-blue-300",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-300",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 disabled:bg-green-300"
  };
  
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
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
      {children}
    </button>
  );
}