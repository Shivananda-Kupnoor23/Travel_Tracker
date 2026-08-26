import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTravels, cancelTravel } from '../../api/travelApi';
import Header from '../../components/Header';

const statusConfig = {
  Planned: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  Approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Travelling: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Completed: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
  Cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
};

export default function TravelList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [travels, setTravels] = useState({ current: [], upcoming: [], past: [] });
  const [tab, setTab] = useState('current');

  useEffect(() => { loadTravels(); }, []);

  const loadTravels = async () => {
    const data = await getTravels(user.id);
    const today = new Date().toISOString().split('T')[0];
    const current = [], upcoming = [], past = [];
    data.forEach(t => {
      if (t.status === 'Cancelled' || t.status === 'Completed') past.push(t);
      else if (t.startDate <= today && t.endDate >= today) current.push(t);
      else if (t.startDate > today) upcoming.push(t);
      else past.push(t);
    });
    setTravels({ current, upcoming, past });
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this travel?')) return;
    await cancelTravel(id);
    loadTravels();
  };

  const total = travels.current.length + travels.upcoming.length + travels.past.length;
  const tabs = [
    { key: 'current', label: 'Current', count: travels.current.length, icon: '🛫', color: 'from-blue-500 to-blue-600' },
    { key: 'upcoming', label: 'Upcoming', count: travels.upcoming.length, icon: '📅', color: 'from-purple-500 to-purple-600' },
    { key: 'past', label: 'Past', count: travels.past.length, icon: '✅', color: 'from-gray-500 to-gray-600' },
  ];
  const list = travels[tab] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header title="My Travel" />

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute right-4 top-2 opacity-10 text-[120px] leading-none select-none">&#9992;</div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}!</h2>
            <p className="text-blue-100 text-sm">Manage your business travel. You have {total} total trip(s).</p>
          </div>
          <div className="relative z-10 flex gap-4 mt-4">
            {tabs.map(t => (
              <div key={t.key} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center min-w-[100px]">
                <p className="text-2xl font-bold">{t.count}</p>
                <p className="text-xs text-blue-100">{t.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-gradient-to-r ' + t.color + ' text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="mr-1.5">{t.icon}</span> {t.label} ({t.count})
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/my-travel/new')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Travel
          </button>
        </div>

        {/* Travel Cards */}
        {list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm text-center py-20">
            <div className="text-6xl mb-4 opacity-30">&#9992;</div>
            <p className="text-gray-400 text-lg">No {tab} trips</p>
            <p className="text-gray-300 text-sm mt-1">
              {tab === 'current' ? 'You are not travelling right now' : tab === 'upcoming' ? 'No upcoming trips scheduled' : 'No past travel history'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {list.map(t => {
              const sc = statusConfig[t.status] || statusConfig.Planned;
              const isIntl = t.travelType === 'International';
              const destination = isIntl ? t.toCountry : `${t.fromCity} → ${t.toCity}`;
              const days = Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / 86400000) + 1;

              return (
                <div key={t.ID} onClick={() => navigate(`/my-travel/edit/${t.ID}`)}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${isIntl ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                        {isIntl ? '🌍' : '🏠'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 text-base group-hover:text-blue-700 transition">{destination}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isIntl ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isIntl ? 'INTL' : 'DOM'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">📅 {t.startDate} → {t.endDate}</span>
                          <span className="text-gray-300">|</span>
                          <span>⏱ {days} day{days > 1 ? 's' : ''}</span>
                          {t.purpose && <><span className="text-gray-300">|</span><span>📌 {t.purpose}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                        {t.status}
                      </span>
                      {(t.status === 'Planned' || t.status === 'Approved') && (
                        <button onClick={(e) => { e.stopPropagation(); handleCancel(t.ID); }}
                          className="text-[11px] text-red-400 hover:text-red-600 font-medium transition">Cancel trip</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
