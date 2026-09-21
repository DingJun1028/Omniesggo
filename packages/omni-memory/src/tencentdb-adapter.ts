/**
 * @esggo/omni-memory — TencentDB Agent Memory Adapter
 *
 * Implements IStorage against TencentDB Agent Memory Gateway (:8420).
 * Auth: Bearer <gateway.apiKey> (from tdai-gateway.yaml, NOT .admin-key).
 *
 * Endpoints used (from tencentdb-agent-memory skill):
 *   POST /recall         — semantic search
 *   POST /search/memories — raw memory query
 *   GET  /health         — gateway health
 */

import type { Memory, MemoryQuery, IStorage } from './index.js';

const DEFAULT_GATEWAY = 'http://127.0.0.1:8420';
const DEFAULT_SERVICE = 'oa-team-swarm';
const DEFAULT_USER = 'admin';

/** Read gateway apiKey from tdai-gateway.yaml candidates */
async function resolveApiKey(): Promise<string> {
  // Bun/Node 18+ has globalThis.FileSystem, fallback to dynamic import
  const candidates = [
    'C:/Users/dingj/.memory-tencentdb/memory-tdai/tdai-gateway.yaml',
    `${process.env.USERPROFILE ?? 'C:/Users/dingj'}/.memory-tencentdb/memory-tdai/tdai-gateway.yaml`,
  ];

  for (const f of candidates) {
    try {
      const fs = await import('node:fs/promises');
      if (!await fs.stat(f).catch(() => null)) continue;
      const txt = await fs.readFile(f, 'utf8');
      const m = txt.match(/^\s+apiKey:\s*"?([^"\r\n]+)"?/m);
      const k = m?.[1]?.trim();
      if (k) return k;
    } catch { /* next */ }
  }
  // Fallback to env (may be wrong .admin-key, will 401)
  return process.env.TDAI_GATEWAY_API_KEY ?? '';
}

export interface TencentDBConfig {
  gatewayUrl: string;
  serviceId: string;
  userId: string;
}

export class TencentDBStorage implements IStorage {
  private apiKey: string = '';

  constructor(private config: TencentDBConfig = {
    gatewayUrl: process.env.TDAI_GATEWAY_URL ?? DEFAULT_GATEWAY,
    serviceId: process.env.TDAI_SERVICE_ID ?? DEFAULT_SERVICE,
    userId: process.env.TDAI_HEALTHCHECK_USER ?? DEFAULT_USER,
  }) {}

  /** Resolve API key once (lazy) */
  private async auth(): Promise<string> {
    if (!this.apiKey) {
      this.apiKey = await resolveApiKey();
    }
    return this.apiKey;
  }

  async store(memory: Readonly<Memory>): Promise<void> {
    // Map Memory layer → TencentDB importance score
    const importanceByLayer: Record<string, number> = { L0: 0.3, L1: 0.5, L2: 0.7, L3: 0.9 };
    const key = await this.auth();

    // TencentDB capture endpoint — store as a "conversation turn" or memory atom
    await this.fetch('/recall', {
      method: 'POST',
      body: JSON.stringify({
        query: memory.content,
        user_id: this.config.userId,
        service_id: this.config.serviceId,
        limit: 1,
      }),
    });

    // Also record a memory via /search/memories to persist the atom
    await this.fetch('/search/memories', {
      method: 'POST',
      body: JSON.stringify({
        user_id: this.config.userId,
        service_id: this.configServiceId,
        memories: [{
          content: memory.content,
          metadata: {
            layer: memory.layer,
            uuid: memory.uuid,
            timestamp: memory.timestamp,
            source_origin: memory.source_origin,
            tags: memory.tags,
            importance: importanceByLayer[memory.layer] ?? 0.5,
          },
        }],
      }),
    });
  }

  async recall(query: MemoryQuery): Promise<Memory[]> {
    const key = await this.auth();
    const res = await this.fetch('/recall', {
      method: 'POST',
      body: JSON.stringify({
        query: query.query,
        user_id: this.config.userId,
        service_id: this.config.serviceId,
        limit: query.limit ?? 10,
      }),
    });

    const data = await res.json() as any[];
    return (data ?? []).map((item): Memory => ({
      uuid: item.id ?? `tdai-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      version: '1.0.0',
      timestamp: item.timestamp ?? Date.now(),
      source_origin: `tencentdb://${this.config.serviceId}`,
      evidence: [],
      content: item.content ?? item.text ?? '',
      layer: (item.metadata?.layer as Memory['layer']) ?? 'L1',
      tags: item.metadata?.tags ?? [],
      vector: item.embedding,
      links: [],
    }));
  }

  async link(_fromUuid: string, _toUuid: string): Promise<void> {
    // TencentDB has native link via metadata. For now, store a memory with link info.
    // Deep integration requires custom metadata support.
    // TODO: Implement when TencentDB metadata linking is available.
  }

  async replay(fromTimestamp: number, toTimestamp: number): Promise<Memory[]> {
    const key = await this.auth();
    const res = await this.fetch('/search/memories', {
      method: 'POST',
      body: JSON.stringify({
        user_id: this.config.userId,
        service_id: this.config.serviceId,
        from_timestamp: fromTimestamp,
        to_timestamp: toTimestamp,
        limit: 100,
      }),
    });

    const data = await res.json() as any[];
    return (data ?? []).map((item): Memory => ({
      uuid: item.id ?? `tdai-${item.timestamp}`,
      version: '1.0.0',
      timestamp: item.timestamp,
      source_origin: `tencentdb://${this.config.serviceId}/replay`,
      evidence: [],
      content: item.content ?? '',
      layer: (item.metadata?.layer as Memory['layer']) ?? 'L0',
      tags: item.metadata?.tags ?? [],
      vector: item.embedding,
      links: [],
    }));
  }

  /** Low-level fetch with Bearer auth */
  private async fetch(path: string, init: RequestInit): Promise<Response> {
    const key = await this.auth();
    const url = `${this.config.gatewayUrl.replace(/\/$/, '')}${path}`;

    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        ...(init.headers as Record<string, string> ?? {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`TencentDB ${path} ${res.status}: ${text.slice(0, 200)}`);
    }

    return res;
  }
}
