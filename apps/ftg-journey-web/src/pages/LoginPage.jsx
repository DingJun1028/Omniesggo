import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      const google = window.google;
      if (!google) {
        setError('Google SDK 載入失敗');
        return;
      }
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          await login(response.credential);
        },
      });
      google.accounts.id.prompt();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3ede1' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 400, width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#10243f', marginBottom: 8 }}>FTG Journey</h1>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>ESG 永續旅程管理平台</p>
        <button
          onClick={handleGoogleLogin}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            width: '100%', padding: '12px 24px',
            border: '1.5px solid #e5e7eb', borderRadius: 12,
            background: '#fff', fontSize: 16, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          使用 Google 登入
        </button>
        {error && <p style={{ color: '#ef4444', marginTop: 16, fontSize: 14 }}>{error}</p>}
      </div>
    </div>
  );
}
