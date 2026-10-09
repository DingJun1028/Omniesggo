<<<<<<< HEAD
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://journey-api.ftgtours.esggo.co';
const AuthContext = createContext(null);

async function apiFetch(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API Error: ${res.status}`);
  }
  return res.json();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ftg_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiFetch('/api/me', token)
        .then(setUser)
        .catch(() => {
          setToken('');
          localStorage.removeItem('ftg_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (credential) => {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('ftg_token', data.token);
      // 立即設置 user 狀態，避免 ProtectedRoute 跳回登入頁
      if (data.user) {
        setUser(data.user);
      } else {
        // 若後端未回傳 user，主動取得
        try {
          const me = await apiFetch('/api/me', data.token);
          setUser(me);
        } catch {
          /* 忽略 */
        }
      }
    }
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    localStorage.removeItem('ftg_token');
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    api: {
      get: (p) => apiFetch(p, token),
      post: (p, body) => apiFetch(p, token, { method: 'POST', body: JSON.stringify(body) }),
      put: (p, body) => apiFetch(p, token, { method: 'PUT', body: JSON.stringify(body) }),
      del: (p) => apiFetch(p, token, { method: 'DELETE' }),
    },
  };

  return (
    <AuthContext.Provider value={value}>
=======
import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://journey-api.ftgtours.esggo.co';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, token, retries = 1 } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (retries > 0 && res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1000));
      return request(path, { method, body, token, retries: retries - 1 });
    }
    throw new ApiError(error.error || 'Request failed', res.status, error);
  }

  return res.json();
}

export const api = {
  get: (path, token) => request(path, { token }),
  post: (path, body, token) => request(path, { method: 'POST', body, token }),
  put: (path, body, token) => request(path, { method: 'PUT', body, token }),
  delete: (path, token) => request(path, { method: 'DELETE', token }),
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ftg-user');
    if (saved) {
      try { setUser(JSON.parse(saved)); }
      catch { localStorage.removeItem('ftg-user'); }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (googleToken) => {
    const res = await api.post('/api/auth/google', { token: googleToken });
    setUser(res.user);
    localStorage.setItem('ftg-user', JSON.stringify(res.user));
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ftg-user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token: user?.token }}>
>>>>>>> origin/feature/aistation-core-modules
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
