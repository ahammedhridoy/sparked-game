export default function AdminTable({ columns, data, onAction }) {
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          {columns.map((col) => (
            <th key={col.accessor} className="border p-2 text-left">
              {col.header}
            </th>
          ))}
          {onAction && <th className="border p-2">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id} className="hover:bg-gray-100">
            {columns.map((col) => (
              <td key={col.accessor} className="border p-2">
                {row[col.accessor]}
              </td>
            ))}
            {onAction && <td className="border p-2">{onAction(row)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
