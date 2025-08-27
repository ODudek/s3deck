export default function ModalFooter({ 
  children, 
  className = '',
  justify = 'end' 
}) {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={`flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 ${justifyClasses[justify]} ${className}`}>
      {children}
    </div>
  );
}