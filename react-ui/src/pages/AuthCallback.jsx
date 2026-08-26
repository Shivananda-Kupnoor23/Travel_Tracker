import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userStr = params.get('user');
    const redirect = params.get('redirect') || '/my-travel';

    if (userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        loginUser(userData);
        navigate(redirect, { replace: true });
      } catch {
        navigate('/', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Signing in...</p>
    </div>
  );
}
