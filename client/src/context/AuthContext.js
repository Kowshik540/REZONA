import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify token on page load — don't trust localStorage alone
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('rezona_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        localStorage.setItem('rezona_user', JSON.stringify(data.user));
      } catch (err) {
        // Token invalid or expired — clear session
        localStorage.removeItem('rezona_token');
        localStorage.removeItem('rezona_user');
        setUser(null);
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('rezona_token', data.token);
    localStorage.setItem('rezona_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('rezona_token', data.token);
    localStorage.setItem('rezona_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('rezona_token');
    localStorage.removeItem('rezona_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
