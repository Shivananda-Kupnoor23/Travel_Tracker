import { useState, useEffect } from 'react';
import { getCalendarData } from '../api/travelApi';

export default function TravelCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getCalendarData(year, month).then(setData);
  }, [year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); setSelected(null); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); setSelected(null); };

  const getDay = (day) => data.find(d => d.date === `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  const today = now.toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Calendar View</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">&lt;</button>
          <span className="text-sm font-medium text-gray-700 w-32 text-center">{monthName} {year}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">&gt;</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-gray-500 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const d = getDay(day);
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === today;
          const hasData = d && (d.travelling > 0 || d.returning > 0 || d.departing > 0);
          const isSelected = selected === day;

          return (
            <button key={day} onClick={() => setSelected(day)}
              className={`relative py-2 text-sm rounded-lg transition
                ${isToday ? 'bg-blue-600 text-white font-bold' : isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}
              `}>
              {day}
              {hasData && !isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* Selected date details */}
      {selected && (() => {
        const d = getDay(selected);
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(selected).padStart(2, '0')}`;
        return (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">{dateStr}</p>
            <div className="flex gap-4 text-xs">
              <span className="text-amber-600">Travelling: <strong>{d?.travelling || 0}</strong></span>
              <span className="text-green-600">Returning: <strong>{d?.returning || 0}</strong></span>
              <span className="text-blue-600">Departing: <strong>{d?.departing || 0}</strong></span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
