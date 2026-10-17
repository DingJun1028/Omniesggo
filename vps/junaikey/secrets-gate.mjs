// vps/junaikey/secrets-gate.mjs
// 眾鑰之首 — CI / runtime secrets 統一取用層。
// 規則: 遙測與狀態只輸出「是否存在」與來源名稱，絕不輸出 secret 值；缺少時容錯略過。

export const SECRET_REGISTRY = Object.freeze([
  Object.freeze({ id: 'groq-key', purpose: 'Groq / Hermes 推論金鑰', names: Object.freeze(['GROQ_API_KEY', 'HERMES_API_KEY']), fallback: null }),
  Object.freeze({ id: 'hermes-base', purpose: 'Hermes OpenAI 相容 API base', names: Object.freeze(['HERMES_API_BASE']), fallback: 'https://api.groq.com/openai/v1' }),
  Object.freeze({ id: 'hermes-model', purpose: 'Hermes 修復模型', names: Object.freeze(['HERMES_MODEL']), fallback: 'qwen/qwen3.8-27b' }),
]);

function clean(v) {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

// 內部取用: 回傳 { id, present, via, value }。value 僅供呼叫端內部使用，不得記錄或回報。
export function resolveSecret(id, env = process.env) {
  const entry = SECRET_REGISTRY.find((e) => e.id === id);
  if (!entry) return { id, present: false, via: 'unknown', value: null };
  for (const name of entry.names) {
    const v = clean(env[name]);
    if (v) return { id, present: true, via: name, value: v };
  }
  if (entry.fallback) return { id, present: false, via: 'default', value: entry.fallback };
  return { id, present: false, via: 'missing', value: null };
}

// 只含狀態，不含值。
export function inspectSecrets(env = process.env) {
  return SECRET_REGISTRY.map((e) => {
    const r = resolveSecret(e.id, env);
    return { id: e.id, purpose: e.purpose, names: [...e.names], present: r.present, via: r.via };
  });
}

export function getJunaikeyTelemetry(env = process.env, now = new Date()) {
  const secrets = inspectSecrets(env);
  const key = secrets.find((s) => s.id === 'groq-key');
  const status = key && key.present ? 'ready' : 'degraded';
  return {
    layer: 'authorization-and-key',
    authority: 'junaikey',
    status,
    ready: secrets.filter((s) => s.present).length,
    total: secrets.length,
    secrets,
    timestamp: now.toISOString(),
  };
}

// 把文字中出現的 secret 值遮蔽，供日誌與回報使用。
export function redactSecrets(text, env = process.env) {
  let out = String(text ?? '');
  for (const e of SECRET_REGISTRY) {
    for (const name of e.names) {
      const v = clean(env[name]);
      if (v && v.length >= 4) out = out.split(v).join('[REDACTED:' + name + ']');
    }
  }
  return out;
}
