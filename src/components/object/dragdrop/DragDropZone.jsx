import TauriDropHandler from './TauriDropHandler';
import DropOverlay from './DropOverlay';

export default function DragDropZone({ 
  children, 
  isDragOver, 
  setIsDragOver, 
  onDrop 
}) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div
      className={`w-full h-full transition-colors duration-200 relative ${
        isDragOver ? 'border-2 border-blue-400 bg-blue-50' : ''
      }`}
      style={{ minHeight: isDragOver ? '200px' : 'auto' }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TauriDropHandler
        setIsDragOver={setIsDragOver}
        onDrop={onDrop}
      />
      
      <DropOverlay isDragOver={isDragOver} />
      
      {children}
    </div>
  );
}