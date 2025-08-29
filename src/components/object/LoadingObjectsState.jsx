import LoadingSpinner from '../ui/LoadingSpinner';

export default function LoadingObjectsState() {
  return (
    <tr>
      <td colSpan="3" className="px-6 py-8 text-center">
        <div className="flex items-center justify-center space-x-2">
          <LoadingSpinner size="md" color="blue" />
          <span className="text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      </td>
    </tr>
  );
}