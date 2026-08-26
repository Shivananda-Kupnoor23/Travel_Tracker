const cards = [
  { key: 'travellingToday', label: 'Travelling Today', icon: '✈️', color: 'from-blue-500 to-blue-600' },
  { key: 'upcoming7Days', label: 'Upcoming 7 Days', icon: '📅', color: 'from-purple-500 to-purple-600' },
  { key: 'returningToday', label: 'Returning Today', icon: '🔙', color: 'from-teal-500 to-teal-600' },
  { key: 'abroadNow', label: 'Currently Abroad', icon: '🌍', color: 'from-orange-500 to-orange-600' },
  { key: 'countriesCount', label: 'Countries', icon: '🗺️', color: 'from-pink-500 to-pink-600' },
  { key: 'domesticToday', label: 'Domestic Today', icon: '🏠', color: 'from-emerald-500 to-emerald-600' },
  { key: 'internationalToday', label: 'International', icon: '🌐', color: 'from-indigo-500 to-indigo-600' },
];

export default function SummaryCards({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map(c => (
        <div key={c.key} className={`bg-gradient-to-br ${c.color} rounded-xl p-4 text-white shadow-sm hover:shadow-md transition cursor-pointer`}>
          <div className="text-2xl mb-1">{c.icon}</div>
          <p className="text-2xl font-bold">{stats[c.key] ?? 0}</p>
          <p className="text-xs opacity-80 mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
