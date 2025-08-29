export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue',
  className = '' 
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };
  
  const colors = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };
  
  return (
    <svg 
      className={`animate-spin ${sizes[size]} ${colors[color]} ${className}`} 
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path 
        fillRule="evenodd" 
        d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4z" 
        clipRule="evenodd" 
      />
    </svg>
  );
}