/**
 * LLM 適配層 — 本機 Ollama (免費算立) + 自動降級 Mock
 * 對齊: 硬規「只用免費算立」(禁付費 API)
 * 使用 node:http (避免 pm2 環境下 fetch 干擾)
 */
import http from 'node:http';

export interface LLMResponse {
  text: string;
  model: string;
  source: 'ollama' | 'mock';
}

function postJson(url: string, body: unknown, timeoutMs = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch {
            reject(new Error('json parse fail'));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
    req.write(data);
    req.end();
  });
}

export async function callLLM(prompt: string, opts?: { model?: string; baseUrl?: string }): Promise<LLMResponse> {
  const model = opts?.model ?? process.env.OLLAMA_MODEL ?? 'qwen2.5:3b-instruct-q4_K_M';
  const base = opts?.baseUrl ?? process.env.OLLAMA_BASE ?? 'http://localhost:11434';

  try {
    const j = await postJson(`${base}/api/generate`, { model, prompt, stream: false }, 45000);
    if (!j?.response) throw new Error('empty response');
    return { text: j.response, model, source: 'ollama' };
  } catch (e) {
    console.error('[CALL_LLM_FAIL]', (e as Error).message, 'base=', base, 'model=', model);
    // Trustworthy: 降級不隱瞞，標註 mock 來源
    return {
      text: `[MOCK] 蜂群收到任務：「${prompt.slice(0, 60)}」。Ollama 未連線，使用本地推演骨架回應。`,
      model: 'mock',
      source: 'mock',
    };
  }
}
