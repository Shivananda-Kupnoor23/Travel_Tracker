import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import TravelList from './pages/employee/TravelList';
import TravelForm from './pages/employee/TravelForm';
import Profile from './pages/employee/Profile';
import Dashboard from './pages/admin/Dashboard';
import CountryDetail from './pages/admin/CountryDetail';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/my-travel" element={<ProtectedRoute><TravelList /></ProtectedRoute>} />
      <Route path="/my-travel/new" element={<ProtectedRoute><TravelForm /></ProtectedRoute>} />
      <Route path="/my-travel/edit/:id" element={<ProtectedRoute><TravelForm /></ProtectedRoute>} />
      <Route path="/my-travel/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="admin"><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/country/:name" element={<ProtectedRoute requiredRole="admin"><CountryDetail /></ProtectedRoute>} />
    </Routes>
  );
}
