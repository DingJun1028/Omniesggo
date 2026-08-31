// [agent:15][squad:光之羽翼][lifecycle:active][p2][platform:esggo][best-practice:结界]
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_PATHS = [
  join(process.cwd(), 'gateway.json'),
  join(homedir(), '.esggo', 'gateway.json'),
  join(homedir(), '.config', 'esggo', 'gateway.json'),
];

export function loadGatewayConfig(): { url: string; token?: string } {
  for (const p of CONFIG_PATHS) {
    if (existsSync(p)) {
      const cfg = JSON.parse(readFileSync(p, 'utf-8'));
      return { url: cfg.url || 'http://localhost:8420', token: cfg.token };
    }
  }
  return { url: 'http://localhost:8420' };
}

export async function gatewayRequest(path: string, token?: string, body?: unknown): Promise<any> {
  const cfg = loadGatewayConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${cfg.url}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || cfg.token || ''}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Gateway ${res.status}: ${await res.text()}`);
    return res.json();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const reason = msg === 'The user aborted a request.' ? 'connection timeout' : msg;
    throw new Error(`Gateway ${path} failed: ${reason}`);
  } finally {
    clearTimeout(timeout);
  }
}
