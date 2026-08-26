import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COORDS = {
  Singapore: [103.8, 1.35], USA: [-95.7, 37.1], UK: [-1.2, 52.2], UAE: [54.0, 24.5],
  Germany: [10.4, 51.2], Japan: [138.3, 36.2], Australia: [133.8, -25.3], India: [78.9, 20.6],
  China: [104.2, 35.9], France: [2.2, 46.6], Canada: [-106.3, 56.1], Brazil: [-51.9, -14.2],
};

export default function WorldMap({ data, onCountryClick }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">World Map — Travel Destinations</h3>
      <ComposableMap projectionConfig={{ scale: 140 }} height={350}>
        <ZoomableGroup center={[40, 20]} zoom={1}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography key={geo.rsmKey} geography={geo}
                  fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={0.5}
                  style={{ default: { outline: 'none' }, hover: { fill: '#cbd5e1', outline: 'none' }, pressed: { outline: 'none' } }} />
              ))
            }
          </Geographies>
          {/* India marker */}
          <Marker coordinates={COORDS.India}>
            <circle r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />
            <text textAnchor="middle" y={-10} className="text-[8px] fill-blue-600 font-bold">India</text>
          </Marker>
          {/* Country markers */}
          {data.map((c) => {
            const coords = COORDS[c.country];
            if (!coords) return null;
            const r = Math.min(10, 4 + c.count * 1.5);
            return (
              <Marker key={c.country} coordinates={coords}>
                <circle r={r} fill="#ef4444" opacity={0.8} stroke="#fff" strokeWidth={1.5}
                  className="cursor-pointer hover:opacity-100"
                  onClick={() => onCountryClick && onCountryClick(c.country)} />
                <text textAnchor="middle" y={-r - 4} className="text-[8px] fill-gray-700 font-semibold">
                  {c.country} ({c.count})
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
