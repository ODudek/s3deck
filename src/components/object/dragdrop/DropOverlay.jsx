export default function DropOverlay({ isDragOver }) {
  if (!isDragOver) return null;

  return (
    <div className="absolute inset-0 bg-blue-100 bg-opacity-80 flex items-center justify-center z-20 border-2 border-dashed border-blue-400">
      <div className="text-center">
        <svg className="w-12 h-12 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-blue-700 font-medium">Drop to upload</p>
      </div>
    </div>
  );
}