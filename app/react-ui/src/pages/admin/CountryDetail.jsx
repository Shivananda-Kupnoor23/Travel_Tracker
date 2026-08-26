import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

export default function CountryDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [travels, setTravels] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/travel/Travels?$filter=toCountry eq '${encodeURIComponent(name)}' and startDate le ${today} and endDate ge ${today}&$expand=employee`)
      .then(r => r.json())
      .then(d => setTravels(d.value || []));
  }, [name]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={`${name} — ${travels.length} Employees`} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 text-sm mb-4 hover:underline">&larr; Back to Dashboard</button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">From</th>
                <th className="px-4 py-3 text-left">Start Date</th>
                <th className="px-4 py-3 text-left">Return Date</th>
                <th className="px-4 py-3 text-left">Purpose</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {travels.map(t => (
                <tr key={t.ID} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{t.employee?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{t.employee?.department}</td>
                  <td className="px-4 py-3 text-gray-500">{t.fromCountry}</td>
                  <td className="px-4 py-3 text-gray-500">{t.startDate}</td>
                  <td className="px-4 py-3 text-gray-500">{t.endDate}</td>
                  <td className="px-4 py-3 text-gray-500">{t.purpose}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{t.status}</span>
                  </td>
                </tr>
              ))}
              {travels.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
