import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { requestCode, verifyCode, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email | code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentHint, setSentHint] = useState('');

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await requestCode(email.trim());
      setStep('code');
      setSentHint(`驗證碼已寄至 ${email.trim()}（10 分鐘內有效）`);
    } catch (err) {
      setError(err.message || '寄送失敗，請稍後再試');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await verifyCode(email.trim(), code.trim());
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || '驗證失敗，請確認驗證碼');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3ede1' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 400, width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#10243f', marginBottom: 8 }}>FTG Journey</h1>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>ESG 永續旅程管理平台</p>

        {step === 'email' && (
          <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              required
              autoFocus
              placeholder="您的 Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #d1d5db', fontSize: 15, minHeight: 44 }}
            />
            <button
              type="submit"
              disabled={busy}
              style={{ background: '#10243f', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minHeight: 44, opacity: busy ? 0.6 : 1 }}
            >
              {busy ? '寄送中…' : '寄送驗證碼'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{sentHint}</p>
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="6 位數驗證碼"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #d1d5db', fontSize: 24, fontWeight: 700, letterSpacing: 8, textAlign: 'center', minHeight: 44 }}
            />
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              style={{ background: '#10243f', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minHeight: 44, opacity: busy || code.length !== 6 ? 0.6 : 1 }}
            >
              {busy ? '驗證中…' : '登入'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
            >
              更換 Email
            </button>
          </form>
        )}

        {error && <p style={{ color: '#ef4444', marginTop: 16, fontSize: 14 }}>{error}</p>}
      </div>
    </div>
  );
}
