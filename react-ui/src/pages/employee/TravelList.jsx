import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTravels, cancelTravel } from '../../api/travelApi';
import Header from '../../components/Header';

const statusColors = {
  Planned: 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Travelling: 'bg-amber-100 text-amber-700',
  Completed: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-red-100 text-red-600',
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

  const tabs = [
    { key: 'current', label: 'Current', icon: '&#9992;', count: travels.current.length },
    { key: 'upcoming', label: 'Upcoming', icon: '&#128197;', count: travels.upcoming.length },
    { key: 'past', label: 'Past', icon: '&#128337;', count: travels.past.length },
  ];

  const list = travels[tab] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="My Travel" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Add Travel Button */}
        <div className="flex justify-end mb-4">
          <button onClick={() => navigate('/my-travel/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm">
            <span className="text-lg">+</span> Add Travel
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200 mb-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Travel Cards */}
        {list.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">&#9992;</div>
            <p>No {tab} trips</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(t => (
              <div key={t.ID} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/my-travel/edit/${t.ID}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${t.travelType === 'International' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {t.travelType === 'International' ? 'INTL' : 'DOM'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">
                        {t.travelType === 'International' ? t.toCountry : `${t.fromCity} → ${t.toCity}`}
                      </p>
                      <p className="text-sm text-gray-500">{t.startDate} → {t.endDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[t.status]}`}>
                      {t.status}
                    </span>
                    {(t.status === 'Planned' || t.status === 'Approved') && (
                      <button onClick={(e) => { e.stopPropagation(); handleCancel(t.ID); }}
                        className="text-red-500 hover:text-red-700 text-xs font-medium">Cancel</button>
                    )}
                  </div>
                </div>
                {t.purpose && <p className="text-xs text-gray-400 mt-2">{t.purpose}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
