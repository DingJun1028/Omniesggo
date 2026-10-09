<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // 若已登入，自動導向 Dashboard
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // 等 Google SDK 載入
    const checkGoogle = setInterval(() => {
      if (window.google?.accounts?.id) {
        setSdkLoaded(true);
        clearInterval(checkGoogle);
      }
    }, 200);

    // 5 秒後如果仍未載入，顯示錯誤
    const timeout = setTimeout(() => {
      if (!sdkLoaded) setError('Google 登入 SDK 載入失敗，請檢查網路');
    }, 5000);

    return () => {
      clearInterval(checkGoogle);
      clearTimeout(timeout);
    };
  }, [sdkLoaded]);

  const handleCredentialResponse = async (response) => {
    try {
      await login(response.credential);
    } catch (e) {
      setError('登入失敗：' + e.message);
    }
  };

  // 開發模式跳過 Google OAuth（localhost 未授權時）
  const handleDevLogin = () => {
    const devToken = btoa(JSON.stringify({ email: 'dev@ftg.com.tw', name: '開發測試使用者', picture: '', exp: Math.floor(Date.now() / 1000) + 86400 }));
    localStorage.setItem('ftg_token', `dev.${devToken}.devsig`);
    window.location.href = '/';
  };

  useEffect(() => {
    if (!sdkLoaded || !GOOGLE_CLIENT_ID) return;
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: 320 }
      );
    } catch (e) {
      setError('初始化失敗：' + e.message);
    }
  }, [sdkLoaded, GOOGLE_CLIENT_ID]);
=======
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
>>>>>>> origin/feature/aistation-core-modules

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3ede1' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 400, width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#10243f', marginBottom: 8 }}>FTG Journey</h1>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>ESG 永續旅程管理平台</p>
<<<<<<< HEAD

        {!sdkLoaded && !error && (
          <p style={{ color: '#6b7280', marginBottom: 16 }}>載入 Google 登入中...</p>
        )}

        <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}></div>

        {error && <p style={{ color: '#ef4444', marginTop: 16, fontSize: 14 }}>{error}</p>}

        {!GOOGLE_CLIENT_ID && (
          <button onClick={handleDevLogin} style={{ marginTop: 16, background: '#10243f', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, cursor: 'pointer' }}>
            🔓 開發模式登入（跳過 Google）
          </button>
        )}
=======
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
>>>>>>> origin/feature/aistation-core-modules
      </div>
    </div>
  );
}
