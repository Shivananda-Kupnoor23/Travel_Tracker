import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  if (!user) {
    window.location.href = '/login/employee.html';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = '/login/employee.html';
    return null;
  }
  return children;
}
