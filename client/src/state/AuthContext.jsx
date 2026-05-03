import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

function readStoredUser() {
  const stored = localStorage.getItem('ttm_user');

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    localStorage.removeItem('ttm_user');
    localStorage.removeItem('ttm_token');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ttm_token'));
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    persistSession(data);
  }

  async function signup(name, email, password) {
    const { data } = await api.post('/auth/signup', { name, email, password });
    persistSession(data);
  }

  function persistSession(data) {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ttm_token', data.token);
    localStorage.setItem('ttm_user', JSON.stringify(data.user));
    setAuthToken(data.token);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ttm_token');
    localStorage.removeItem('ttm_user');
    setAuthToken(null);
  }

  const value = useMemo(() => ({
    token,
    user,
    login,
    signup,
    logout
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
