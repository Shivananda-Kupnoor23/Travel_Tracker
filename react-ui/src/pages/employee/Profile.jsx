import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEmployee, getTravels } from '../../api/travelApi';
import Header from '../../components/Header';

export default function Profile() {
  const { user, getInitials } = useAuth();
  const navigate = useNavigate();
  const [emp, setEmp] = useState(null);
  const [stats, setStats] = useState({ total: 0, current: 0, upcoming: 0, completed: 0 });
  const [countries, setCountries] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    getEmployee(user.id).then(setEmp);
    getTravels(user.id).then(data => {
      const today = new Date().toISOString().split('T')[0];
      let current = 0, upcoming = 0, completed = 0;
      const ctry = new Set();
      data.forEach(t => {
        if (t.status === 'Completed') completed++;
        else if (t.startDate <= today && t.endDate >= today && t.status !== 'Cancelled') current++;
        else if (t.startDate > today && t.status !== 'Cancelled') upcoming++;
        if (t.travelType === 'International' && t.toCountry) ctry.add(t.toCountry);
      });
      setStats({ total: data.length, current, upcoming, completed });
      setCountries([...ctry]);
      setRecent(data.sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 5));
    });
  }, []);

  if (!emp) return <div className="min-h-screen bg-gray-50"><Header title="My Profile" /><div className="p-8 text-center text-gray-400">Loading...</div></div>;

  const statCards = [
    { label: 'Total Trips', value: stats.total, color: 'bg-blue-500', icon: '&#9992;' },
    { label: 'Current', value: stats.current, color: 'bg-amber-500', icon: '&#127758;' },
    { label: 'Upcoming', value: stats.upcoming, color: 'bg-green-500', icon: '&#128197;' },
    { label: 'Completed', value: stats.completed, color: 'bg-gray-500', icon: '&#10004;' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="My Profile" />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/my-travel')} className="text-blue-600 text-sm mb-4 hover:underline">&larr; Back</button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold mb-4">
                {getInitials()}
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{emp.name}</h2>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 mt-1">
                {emp.role === 'admin' ? 'Administrator' : 'Employee'}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-800">{emp.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Department</span><span className="font-medium text-gray-800">{emp.department}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Manager</span><span className="font-medium text-gray-800">{emp.manager}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Employee ID</span><span className="font-medium text-gray-800">{emp.ID}</span></div>
            </div>
          </div>

          {/* Right — Stats + Travel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {statCards.map(s => (
                <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                  <div className={`w-10 h-10 ${s.color} rounded-lg text-white flex items-center justify-center mx-auto mb-2 text-lg`} dangerouslySetInnerHTML={{ __html: s.icon }} />
                  <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Countries Visited */}
            {countries.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Countries Visited</h3>
                <div className="flex flex-wrap gap-2">
                  {countries.map(c => (
                    <span key={c} className="text-xs font-medium px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Travels */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Travels</h3>
              {recent.length === 0 ? <p className="text-sm text-gray-400">No travel history</p> : (
                <div className="space-y-3">
                  {recent.map(t => (
                    <div key={t.ID} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{t.travelType === 'International' ? '🌍' : '🗺️'}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {t.travelType === 'International' ? t.toCountry : `${t.fromCity} → ${t.toCity}`}
                          </p>
                          <p className="text-xs text-gray-400">{t.startDate} → {t.endDate}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${t.status === 'Completed' ? 'bg-gray-100 text-gray-600' : t.status === 'Travelling' ? 'bg-amber-100 text-amber-700' : t.status === 'Approved' ? 'bg-green-100 text-green-700' : t.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
