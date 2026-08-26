import { approveTravel, rejectTravel } from '../api/travelApi';

const statusColors = {
  Planned: 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Travelling: 'bg-amber-100 text-amber-700',
  Completed: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-red-100 text-red-600',
};

export default function TravelTable({ data, onRefresh, onCountryClick }) {
  const handleApprove = async (id) => {
    await approveTravel(id);
    onRefresh();
  };
  const handleReject = async (id) => {
    if (!confirm('Reject this travel?')) return;
    await rejectTravel(id);
    onRefresh();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Currently Travelling ({data.length})</h3>
        <button onClick={onRefresh} className="text-xs text-blue-600 hover:underline">Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Dept</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Destination</th>
              <th className="px-4 py-3 text-left">Start</th>
              <th className="px-4 py-3 text-left">Return</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(t => (
              <tr key={t.ID} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-800">{t.employee?.name || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{t.employee?.department || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.travelType === 'International' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {t.travelType === 'International' ? 'INTL' : 'DOM'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 cursor-pointer hover:text-blue-600"
                  onClick={() => t.travelType === 'International' && onCountryClick(t.toCountry)}>
                  {t.travelType === 'International' ? t.toCountry : `${t.fromCity} → ${t.toCity}`}
                </td>
                <td className="px-4 py-3 text-gray-500">{t.startDate}</td>
                <td className="px-4 py-3 text-gray-500">{t.endDate}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[t.status]}`}>{t.status}</span>
                </td>
                <td className="px-4 py-3">
                  {t.status === 'Planned' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(t.ID)}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition">Approve</button>
                      <button onClick={() => handleReject(t.ID)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No travel records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
