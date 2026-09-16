import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('tabbook_token');
    const storedUser = localStorage.getItem('tabbook_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function persistSession({ user, token }) {
    localStorage.setItem('tabbook_token', token);
    localStorage.setItem('tabbook_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  async function login(credentials) {
    const result = await authApi.login(credentials);
    persistSession(result);
    return result;
  }

  async function register(data) {
    const result = await authApi.register(data);
    persistSession(result);
    return result;
  }

  function logout() {
    localStorage.removeItem('tabbook_token');
    localStorage.removeItem('tabbook_user');
    setToken(null);
    setUser(null);
  }

  const value = { user, token, loading, login, register, logout, isAuthenticated: !!token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
