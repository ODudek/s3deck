export default function ObjectsTableHeader() {
  return (
    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
      <tr>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
          Name
        </th>
        <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
          Size
        </th>
        <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
          Modified
        </th>
      </tr>
    </thead>
  );
}