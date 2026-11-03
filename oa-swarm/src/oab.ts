/**
 * OAB (OmniAgentBus) 整合層 — 雙蜂隊共享記憶 (§20)
 * 對齊: oa-shared-memory 技能 — TencentDB Agent Memory (memory.esggo.co/gateway)
 * 實戰端點: POST /v3/conversation/add (寫) + POST /v3/conversation/query (讀)
 * 5T 互引: Traceable(source_origin) / Trackable(lifecycle) / Trustworthy(freeze)
 */
import { readFileSync } from 'node:fs';

export interface OABMessage {
  id: string;
  from: number;
  to: string;
  channel: string;
  payload: Record<string, unknown>;
  ts: number;
}

/** 雙蜂隧道: 本地蜂王 ↔ VPS 蜂后 同步 (OA-LOCAL <-> OA-VPS) */
export class DualHiveTunnel {
  private vpsBase = process.env.OA_VPS_BASE || 'http://localhost:8800';
  async syncToVps(msg: OABMessage): Promise<boolean> {
    // 雙蜂同體: 同一進程內 OA-LOCAL/OA-VPS 共享記憶體，無需跨網路
    // 若未來拆分獨立 VPS，此處改 POST ${vpsBase}/oab/history 或 message queue
    try {
      if (process.env.OA_VPS_REMOTE === 'true') {
        const r = await fetch(`${this.vpsBase}/oab`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        });
        return r.ok;
      }
      return true; // 同體模式直接視為同步成功
    } catch {
      return false;
    }
  }
}

export class OABClient {
  private base = process.env.OAB_BASE || 'http://localhost:8420';
  private key = (() => {
    try { return readFileSync('/opt/esggo/apps/tencentdb-memory/.admin-key', 'utf-8').trim(); }
    catch { return process.env.OAB_ADMIN_KEY || ''; }
  })();

  async publish(msg: OABMessage): Promise<boolean> {
    try {
      const p = msg.payload as Record<string, unknown>;
      // 寫入時同步鎖定: 5T Trustworthy 的 hash_lock 與 task 必須落庫, 供雙蜂隊（VPS/本地）跨節點檢索
      const content = (p._content as string | undefined)
        ?? JSON.stringify({ hash_lock: p.hash ?? '', task: String(p.task ?? '').slice(0, 200) });
      const r = await fetch(`${this.base}/v3/conversation/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.key}`,
          'x-tdai-service-id': 'default',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: 'default',
          user_id: 'default',
          agent_id: String(msg.from),
          role: 'user',
          content,
          // 5T 信任: 將 task / hash_lock 作為第一級欄位送出, 供 query 直接取用
          task: p.task ?? '',
          hash_lock: p.hash ?? '',
        }),
      });
      if (!r.ok) { console.error('[OAB] add failed', r.status); return false; }
      const j = await r.json() as { code?: number };
      return j.code === 0;
    } catch (e) {
      console.error('[OAB] publish error', (e as Error).message);
      return false;
    }
  }

  /** 讀取共享記憶 (雙蜂隊可檢索歷史產物) */
  async query(limit = 10): Promise<Array<{ hash: string; task: string; ts: string }>> {
    try {
      const r = await fetch(`${this.base}/v3/conversation/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.key}`,
          'x-tdai-service-id': 'default',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: '*', limit }),
      });
      if (!r.ok) return [];
      // 擴展型別: 服務端可能回傳 task / hash_lock 為第一級欄位
      const j = await r.json() as { code?: number; data?: { messages?: Array<{ content: string; task?: string; hash_lock?: string; timestamp: string }> } };
      if (j.code !== 0) return [];
      return (j.data?.messages || []).map((m) => {
        try {
          const c = JSON.parse(m.content);
          return {
            // 優先取 service-level task / hash_lock (寫入時已同步), 其次 content 內的
            hash: m.hash_lock || c.hash_lock || '',
            task: m.task || c.task || '',
            ts: m.timestamp,
          };
        } catch {
          return { hash: m.content, task: m.task || '', ts: m.timestamp };
        }
      });
    } catch (e) {
      console.error('[OAB] query error', (e as Error).message);
      return [];
    }
  }
}
