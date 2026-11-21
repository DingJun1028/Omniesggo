/**
 * OmniAgent Shared Memory Layer (Pure JS)
 * 共享記憶層 — Redis 快取 + 本地持久化 + NCBDB 雙向同步
 *
 * 架構：
 * ┌──────────┐     ┌──────────┐     ┌──────────┐
 * │  Redis   │ ←→  │  Local   │ ←→  │  NCBDB   │
 * │  (快取)   │     │  (持久化) │     │  (遠端)   │
 * └──────────┘     └──────────┘     └──────────┘
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createClient } from 'redis';

const MEMORY_DIR = process.env.MEMORY_DIR || '/var/www/esggo/shared-memory';
const MEMORY_FILE = join(MEMORY_DIR, 'agent-memory.json');
const SNAPSHOT_FILE = join(MEMORY_DIR, 'agent-memory-snapshot.json');

if (!existsSync(MEMORY_DIR)) {
  mkdirSync(MEMORY_DIR, { recursive: true });
}

// ─── Redis Client ──────────────────────────────────────────────────────────

let redisClient = null;
let redisConnected = false;

async function getRedisClient() {
  if (redisClient && redisConnected) return redisClient;

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
      socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) },
    });

    redisClient.on('error', (err) => {
      console.warn('[Redis] Error:', err.message);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected');
      redisConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    await redisClient.connect();
    redisConnected = true;
    return redisClient;
  } catch (err) {
    console.warn('[Redis] Connection failed, falling back to local-only:', err.message);
    redisConnected = false;
    return null;
  }
}

// ─── Shared Memory Store ────────────────────────────────────────────────────

class SharedMemoryStore {
  constructor() {
    this.cache = new Map();
    this.dirty = false;
    this.saveInterval = null;
    this.syncInterval = null;
    this.lastSync = 0;
    this.syncInProgress = false;

    this.loadFromDisk();

    // Auto-save to disk every 30s
    this.saveInterval = setInterval(() => this.saveToDisk(), 30000);

    // Auto-sync to NCBDB every 60s
    this.syncInterval = setInterval(() => this.syncToNCB(), 60000);

    // Initialize Redis (non-blocking)
    this.initRedis();
  }

  async initRedis() {
    try {
      const client = await getRedisClient();
      if (client) {
        // Load from Redis if available
        const redisData = await client.get('omniagent:memory:all');
        if (redisData) {
          const entries = JSON.parse(redisData);
          if (Array.isArray(entries)) {
            for (const entry of entries) {
              if (!this.cache.has(entry.id)) {
                this.cache.set(entry.id, entry);
              }
            }
            console.log('[SharedMemory] Loaded ' + entries.length + ' entries from Redis');
          }
        }
      }
    } catch (err) {
      console.warn('[SharedMemory] Redis init failed:', err.message);
    }
  }

  // ── Core Operations ──

  async store(entry) {
    const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const timestamp = Date.now();
    const hash = createHash('sha256').update(JSON.stringify(entry.content)).digest('hex');

    const fullEntry = { ...entry, id, timestamp, hash, tags: entry.tags || [], source: entry.source || 'local', ncbSynced: false, version: 1 };

    this.cache.set(id, fullEntry);
    this.dirty = true;

    // Write to Redis (non-blocking)
    this.writeToRedis(id, fullEntry);

    console.log('[SharedMemory] Stored: ' + id + ' [' + entry.type + '] by ' + entry.agent);
    return id;
  }

  writeToRedis(id, entry) {
    getRedisClient().then(async (client) => {
      if (!client) return;
      try {
        // Store individual entry with 1h TTL
        await client.set('omniagent:memory:' + id, JSON.stringify(entry), { EX: 3600 });
        // Update index
        await client.sAdd('omniagent:memory:index', id);
      } catch (err) {
        // Silent fail
      }
    }).catch(() => {});
  }

  async get(id) {
    // Try local cache first
    const local = this.cache.get(id);
    if (local) {
      if (local.ttl && Date.now() - local.timestamp > local.ttl) {
        this.cache.delete(id);
        return null;
      }
      return local;
    }

    // Try Redis
    try {
      const client = await getRedisClient();
      if (client) {
        const data = await client.get('omniagent:memory:' + id);
        if (data) {
          const entry = JSON.parse(data);
          // Backfill local cache
          this.cache.set(id, entry);
          return entry;
        }
      }
    } catch (err) {
      // Silent fail
    }

    return null;
  }

  query(query) {
    let entries = Array.from(this.cache.values());

    if (query.agent) entries = entries.filter(e => e.agent === query.agent);
    if (query.type) entries = entries.filter(e => e.type === query.type);
    if (query.tags && query.tags.length > 0) entries = entries.filter(e => query.tags.some(tag => e.tags.includes(tag)));
    if (query.since) entries = entries.filter(e => e.timestamp >= query.since);
    if (query.until) entries = entries.filter(e => e.timestamp <= query.until);

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      entries = entries.filter(e => {
        const contentStr = JSON.stringify(e.content).toLowerCase();
        return contentStr.includes(searchLower) || e.tags.some(t => t.toLowerCase().includes(searchLower));
      });
    }

    entries.sort((a, b) => b.timestamp - a.timestamp);
    if (query.limit) entries = entries.slice(0, query.limit);

    return entries;
  }

  delete(id) {
    this.cache.delete(id);
    this.dirty = true;

    // Delete from Redis
    getRedisClient().then(async (client) => {
      if (!client) return;
      try {
        await client.del('omniagent:memory:' + id);
        await client.sRem('omniagent:memory:index', id);
      } catch (err) { /* silent */ }
    }).catch(() => {});

    return true;
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const agents = [...new Set(entries.map(e => e.agent))];

    return {
      totalEntries: entries.length,
      agents: agents.join(', '),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0,
      totalSizeKB: JSON.stringify(entries).length / 1024,
    };
  }

  // ── NCBDB Bidirectional Sync ──

  async syncToNCB() {
    if (this.syncInProgress) return { pushed: 0, pulled: 0, errors: ['Sync in progress'] };
    this.syncInProgress = true;
    const result = { pushed: 0, pulled: 0, errors: [] };

    try {
      // Push local changes to NCBDB
      const unsynced = Array.from(this.cache.values()).filter(e => !e.ncbSynced);
      for (const entry of unsynced) {
        try {
          const res = await fetch(
            (process.env.NCBDB_BASE_URL || 'https://www.nocodebackend.com/') + '/api/v1/db/data/noco/' + (process.env.NCBDB_PROJECT_ID || '') + '/agent_memory',
            {
              method: 'POST',
              headers: { 'xc-token': process.env.NCBDB_API_TOKEN || '', 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agent_name: entry.agent,
                memory_type: entry.type,
                content: JSON.stringify(entry.content),
                tags: entry.tags.join(','),
                hash_lock: entry.hash,
                source: entry.source,
                created_at: new Date(entry.timestamp).toISOString(),
              }),
            }
          );
          if (res.ok) {
            entry.ncbSynced = true;
            result.pushed++;
          }
        } catch (e) { result.errors.push('Push: ' + e.message); }
      }

      // Pull remote changes
      try {
        const pullRes = await fetch(
          (process.env.NCBDB_BASE_URL || 'https://www.nocodebackend.com/') + '/api/v1/db/data/noco/' + (process.env.NCBDB_PROJECT_ID || '') + '/agent_memory' + (this.lastSync > 0 ? '?where=(created_at,gt,' + new Date(this.lastSync).toISOString() + ')' : ''),
          { headers: { 'xc-token': process.env.NCBDB_API_TOKEN || '' } }
        );
        if (pullRes.ok) {
          const remote = await pullRes.json();
          const list = remote?.list || remote?.data || remote || [];
          if (Array.isArray(list)) {
            for (const r of list) {
              const id = 'ncb_' + (r.id || r.Id);
              if (!this.cache.has(id)) {
                this.cache.set(id, {
                  id,
                  agent: r.agent_name || 'unknown',
                  type: r.memory_type || 'shared',
                  content: (() => { try { return JSON.parse(r.content); } catch { return r.content; } })(),
                  tags: (r.tags || '').split(',').filter(Boolean),
                  timestamp: new Date(r.created_at || Date.now()).getTime(),
                  hash: r.hash_lock || '',
                  source: 'ncb',
                  ncbSynced: true,
                  version: r.version || 1,
                });
                result.pulled++;
              }
            }
            if (result.pulled > 0) this.dirty = true;
          }
        }
      } catch (e) { result.errors.push('Pull: ' + e.message); }

      this.lastSync = Date.now();
      console.log('[SharedMemory] NCBDB sync: pushed=' + result.pushed + ' pulled=' + result.pulled);
    } catch (e) {
      result.errors.push('Sync: ' + e.message);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  // ── Persistence ──

  loadFromDisk() {
    try {
      if (existsSync(MEMORY_FILE)) {
        const data = JSON.parse(readFileSync(MEMORY_FILE, 'utf-8'));
        if (Array.isArray(data)) {
          for (const entry of data) this.cache.set(entry.id, entry);
          console.log('[SharedMemory] Loaded ' + this.cache.size + ' entries from disk');
        }
      }
    } catch (err) {
      console.error('[SharedMemory] Load error:', err);
    }
  }

  saveToDisk() {
    if (!this.dirty) return;
    try {
      const entries = Array.from(this.cache.values());
      writeFileSync(MEMORY_FILE, JSON.stringify(entries, null, 2));
      this.dirty = false;

      // Also update Redis
      getRedisClient().then(async (client) => {
        if (!client) return;
        try {
          await client.set('omniagent:memory:all', JSON.stringify(entries), { EX: 7200 });
        } catch (err) { /* silent */ }
      }).catch(() => {});

    } catch (err) {
      console.error('[SharedMemory] Save error:', err);
    }
  }

  async snapshot() {
    try {
      const entries = Array.from(this.cache.values());
      writeFileSync(SNAPSHOT_FILE, JSON.stringify(entries, null, 2));
      console.log('[SharedMemory] Snapshot saved (' + entries.length + ' entries)');
    } catch (err) {
      console.error('[SharedMemory] Snapshot error:', err);
    }
  }

  destroy() {
    if (this.saveInterval) clearInterval(this.saveInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.saveToDisk();
    if (redisClient) redisClient.disconnect().catch(() => {});
  }
}

export const sharedMemory = new SharedMemoryStore();
