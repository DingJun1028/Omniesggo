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

  const requestCode = useCallback(async (email) => {
    const res = await fetch(`${API_BASE}/api/auth/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);
    return data;
  }, []);

  const verifyCode = useCallback(async (email, code) => {
    const res = await fetch(`${API_BASE}/api/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('ftg_token', data.token);
      if (data.user) {
        setUser(data.user);
      } else {
        try {
          const me = await apiFetch('/api/me', data.token);
          setUser(me);
        } catch {
          /* 忽略 */
        }
      }
    }
    return data;
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
    requestCode,
    verifyCode,
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
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
