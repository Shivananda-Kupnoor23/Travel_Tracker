import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('loggedInUser');
    return saved ? JSON.parse(saved) : null;
  });

  const loginUser = (userData) => {
    sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('loggedInUser');
    setUser(null);
  };

  const getInitials = () => {
    if (!user) return '';
    return user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logout, getInitials }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
