/**
 * Junaikey 眾鑰之首 — SDK 授權與密鑰層 (standalone, 無外部依賴)
 * 只暴露遙測與狀態；不提供任何會回傳 secret 值的公開 API。
 * 與 vps/junaikey/secrets-gate.mjs 使用相同的 registry 約定。
 */

export interface JunaikeySecretStatus {
  id: string;
  purpose: string;
  names: string[];
  present: boolean;
  via: string;
}

export interface JunaikeyLayerTelemetry {
  layer: 'authorization-and-key';
  authority: 'junaikey';
  status: 'ready' | 'degraded';
  ready: number;
  total: number;
  secrets: JunaikeySecretStatus[];
  timestamp: string;
}

type EnvLike = Record<string, string | undefined>;

export const JUNAIKEY_SECRET_REGISTRY: ReadonlyArray<{
  id: string;
  purpose: string;
  names: readonly string[];
  fallback: string | null;
}> = Object.freeze([
  { id: 'groq-key', purpose: 'Groq / Hermes 推論金鑰', names: ['GROQ_API_KEY', 'HERMES_API_KEY'], fallback: null },
  { id: 'hermes-base', purpose: 'Hermes OpenAI 相容 API base', names: ['HERMES_API_BASE'], fallback: 'https://api.groq.com/openai/v1' },
  { id: 'hermes-model', purpose: 'Hermes 修復模型', names: ['HERMES_MODEL'], fallback: 'qwen/qwen3.8-27b' },
]);

function pick(env: EnvLike, names: readonly string[]): string | null {
  for (const n of names) {
    const v = env[n];
    if (typeof v === 'string' && v.trim().length > 0) return n;
  }
  return null;
}

export function inspectJunaikeySecrets(env: EnvLike = process.env as EnvLike): JunaikeySecretStatus[] {
  return JUNAIKEY_SECRET_REGISTRY.map((e) => {
    const via = pick(env, e.names);
    return {
      id: e.id,
      purpose: e.purpose,
      names: [...e.names],
      present: via !== null,
      via: via ?? (e.fallback ? 'default' : 'missing'),
    };
  });
}

export function getJunaikeyTelemetry(
  env: EnvLike = process.env as EnvLike,
  now: Date = new Date(),
): JunaikeyLayerTelemetry {
  const secrets = inspectJunaikeySecrets(env);
  const key = secrets.find((s) => s.id === 'groq-key');
  return {
    layer: 'authorization-and-key',
    authority: 'junaikey',
    status: key && key.present ? 'ready' : 'degraded',
    ready: secrets.filter((s) => s.present).length,
    total: secrets.length,
    secrets,
    timestamp: now.toISOString(),
  };
}
