import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 flex flex-col items-center justify-center">
      <div className="text-center text-white mb-14">
        <div className="text-7xl mb-4">&#9992;</div>
        <h1 className="text-4xl font-light tracking-widest mb-2">TRAVEL TRACKER</h1>
        <p className="text-base opacity-80">Employee Travel Intelligence System</p>
      </div>

      <div className="flex gap-8 flex-wrap justify-center">
        {/* Employee Card */}
        <div onClick={() => window.location.href = '/login/employee.html'}
          className="w-72 bg-white rounded-2xl overflow-hidden shadow-2xl cursor-pointer hover:-translate-y-2 transition-transform duration-300">
          <div className="bg-gradient-to-br from-green-500 to-green-700 px-6 py-10 text-center text-white">
            <div className="text-5xl mb-3">&#128100;</div>
            <h2 className="text-xl font-semibold">Employee Login</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 leading-relaxed mb-5">Submit and manage your business travel. Track your current, upcoming, and past trips.</p>
            <span className="block text-center bg-green-50 text-green-700 py-2.5 rounded-lg text-sm font-semibold">Sign in as Employee &rarr;</span>
          </div>
        </div>

        {/* Admin Card */}
        <div onClick={() => window.location.href = '/login/admin.html'}
          className="w-72 bg-white rounded-2xl overflow-hidden shadow-2xl cursor-pointer hover:-translate-y-2 transition-transform duration-300">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-6 py-10 text-center text-white">
            <div className="text-5xl mb-3">&#128188;</div>
            <h2 className="text-xl font-semibold">Admin / HR Login</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 leading-relaxed mb-5">Company-wide travel intelligence dashboard. Real-time analytics, world map, and AI chatbot.</p>
            <span className="block text-center bg-blue-50 text-blue-700 py-2.5 rounded-lg text-sm font-semibold">Sign in as Admin &rarr;</span>
          </div>
        </div>
      </div>

      <p className="text-white/40 text-xs mt-12">Travel Tracker &copy; 2026</p>
    </div>
  );
}
