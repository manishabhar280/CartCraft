import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

function getStoredUser() {
  const storedUser = localStorage.getItem('cartcraft_user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('cartcraft_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('cartcraft_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    const { token: newToken, user: nextUser } = response.data;

    localStorage.setItem('cartcraft_token', newToken);
    localStorage.setItem('cartcraft_user', JSON.stringify(nextUser));
    setToken(newToken);
    setUser(nextUser);
    return response.data;
  };

  const register = async (data) => {
    const response = await api.post('/api/auth/register', data);
    const { token: newToken, user: nextUser } = response.data;

    localStorage.setItem('cartcraft_token', newToken);
    localStorage.setItem('cartcraft_user', JSON.stringify(nextUser));
    setToken(newToken);
    setUser(nextUser);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('cartcraft_token');
    localStorage.removeItem('cartcraft_user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
