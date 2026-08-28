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
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
