import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  if (!user) {
    window.location.href = '/#/';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = '/#/';
    return null;
  }
  return children;
}
