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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3ede1' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 400, width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#10243f', marginBottom: 8 }}>FTG Journey</h1>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>ESG 永續旅程管理平台</p>

        {!sdkLoaded && !error && (
          <p style={{ color: '#6b7280', marginBottom: 16 }}>載入 Google 登入中...</p>
        )}

        <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}></div>

        {error && <p style={{ color: '#ef4444', marginTop: 16, fontSize: 14 }}>{error}</p>}

        {!GOOGLE_CLIENT_ID && (
          <p style={{ color: '#f59e0b', marginTop: 16, fontSize: 13 }}>
            ⚠️ 未設定 VITE_GOOGLE_CLIENT_ID，請確認 .env 檔案
          </p>
        )}
      </div>
    </div>
  );
}
