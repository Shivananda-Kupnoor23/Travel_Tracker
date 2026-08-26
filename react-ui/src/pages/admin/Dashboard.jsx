import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getTravellingToday, getCountryDistribution } from '../../api/travelApi';
import Header from '../../components/Header';
import SummaryCards from '../../components/SummaryCards';
import CountryChart from '../../components/CountryChart';
import WorldMap from '../../components/WorldMap';
import TravelCalendar from '../../components/TravelCalendar';
import TravelTable from '../../components/TravelTable';
import Chatbot from '../../components/Chatbot';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [travels, setTravels] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [countryDist, setCountryDist] = useState([]);
  const [filters, setFilters] = useState({ type: 'All', country: '', dept: '', status: '', search: '' });

  const loadData = () => {
    getDashboardStats().then(setStats);
    getTravellingToday().then(d => { setTravels(d); setFiltered(d); });
    getCountryDistribution().then(setCountryDist);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let result = [...travels];
    if (filters.type !== 'All') result = result.filter(t => t.travelType === filters.type);
    if (filters.country) result = result.filter(t => t.toCountry === filters.country);
    if (filters.dept) result = result.filter(t => t.employee?.department === filters.dept);
    if (filters.status) result = result.filter(t => t.status === filters.status);
    if (filters.search) result = result.filter(t => t.employee?.name?.toLowerCase().includes(filters.search.toLowerCase()));
    setFiltered(result);
  }, [filters, travels]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Travel Intelligence Dashboard" />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <SummaryCards stats={stats} />

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {['All', 'International', 'Domestic'].map(t => (
                <button key={t} onClick={() => setFilter('type', t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${filters.type === t ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}>{t}</button>
              ))}
            </div>
            <select value={filters.country} onChange={e => setFilter('country', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Countries</option>
              {countryDist.map(c => <option key={c.country} value={c.country}>{c.country} ({c.count})</option>)}
            </select>
            <select value={filters.dept} onChange={e => setFilter('dept', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Departments</option>
              {['Engineering', 'Sales', 'HR', 'Marketing', 'Finance'].map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              {['Planned', 'Approved', 'Travelling', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
            <input value={filters.search} onChange={e => setFilter('search', e.target.value)}
              placeholder="Search employee..." className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 w-44" />
          </div>
        </div>

        {/* Chart + Calendar row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <CountryChart data={countryDist} onCountryClick={c => navigate(`/dashboard/country/${c}`)} />
          </div>
          <div className="lg:col-span-2">
            <TravelCalendar />
          </div>
        </div>

        {/* World Map */}
        <WorldMap data={countryDist} onCountryClick={c => navigate(`/dashboard/country/${c}`)} />

        {/* Table */}
        <TravelTable data={filtered} onRefresh={loadData}
          onCountryClick={c => navigate(`/dashboard/country/${c}`)} />
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
