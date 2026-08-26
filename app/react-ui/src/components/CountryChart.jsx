import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444'];

export default function CountryChart({ data, onCountryClick }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Country Distribution</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="country" width={80} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} cursor="pointer"
              onClick={(d) => onCountryClick && onCountryClick(d.country)}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
