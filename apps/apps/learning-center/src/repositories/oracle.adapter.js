
export const checkOracleHealth = async () => {
  const base = (import.meta.env?.VITE_ORACLE_API_BASE || '').trim();
  const enabled = String(import.meta.env?.VITE_USE_ORACLE || 'false').toLowerCase() === 'true';
  if (!enabled || !base) {
    return { enabled: false, healthy: false, reason: 'ORACLE_DISABLED' };
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/health`, { method: 'GET' });
    if (!res.ok) {
      return { enabled: true, healthy: false, status: res.status, reason: await res.text() };
    }
    const data = await res.json().catch(() => ({}));
    return { enabled: true, healthy: true, data };
  } catch (error) {
    return { enabled: true, healthy: false, reason: error?.message || String(error) };
  }
};

export const exportToOracle = async (records = [], locale = 'zh-TW') => {
  const base = (import.meta.env?.VITE_ORACLE_API_BASE || '').trim();
  const enabled = String(import.meta.env?.VITE_USE_ORACLE || 'false').toLowerCase() === 'true';
  if (!enabled || !base) {
    throw new Error('Oracle proxy 未啟用');
  }
  const res = await fetch(`${base.replace(/\/$/, '')}/exports?locale=${encodeURIComponent(locale)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Oracle export failed ${res.status}: ${text}`);
  }
  return res.json().catch(() => ({}));
};

export const fetchOracleHealth = checkOracleHealth;
