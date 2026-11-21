// apps/gateway/sync/sync-engine.ts
// ============================================================================
// 全域 / 全端 / 全量 雙向同步引擎核心
//   - 持有 ESGGO(Next) 與 Omni(萬能系統) 兩側狀態視圖
//   - 任何一側變更 -> 產生 SyncPacket -> 廣播/轉發到另一側 (雙向)
//   - 版本戳 + seq 單調序號 -> 去重、排序、衝突解決 (last-write-wins + 時間戳)
//   - OA-Summon 觸發 -> L3 萬能同步層驅動全域一致
// ============================================================================
import type { AgentState, ESGGOState, OmniState, SyncPacket, SyncHealth, NodeKind } from './types.js';
import { safeParsePacket } from './schema.js';

interface EngineConfig {
  originId: string;
  esggoPollMs?: number;
  omniPollMs?: number;
  onBroadcast?: (pkt: SyncPacket) => void;
}

export class SyncEngine {
  private readonly originId: string;
  private readonly esggoPollMs: number;
  private readonly omniPollMs: number;
  private readonly onBroadcast?: (pkt: SyncPacket) => void;

  private esggo: ESGGOState | null = null;
  private omni: OmniState | null = null;
  private seq = 0;
  private health: SyncHealth = {
    connectedNodes: [],
    lastPacketAt: { esggo: 0, omni: 0, relay: 0, unknown: 0 },
    packetsSent: 0,
    packetsRecv: 0,
    conflictsResolved: 0,
    conflictsUnresolved: 0,
  };

  constructor(cfg: EngineConfig) {
    this.originId = cfg.originId;
    this.esggoPollMs = cfg.esggoPollMs ?? 5000;
    this.omniPollMs = cfg.omniPollMs ?? 5000;
    this.onBroadcast = cfg.onBroadcast;
  }

  // ── 狀態寫入（來自任一側適配器）──────────────────────────────
  ingestEsggo(state: ESGGOState): void {
    const pkt = this.makePacket('esggo', 'omni', 'state', state);
    this.esggo = this.mergeState(this.esggo, state) as ESGGOState;
    this.health.lastPacketAt.esggo = Date.now();
    this.ensureNode('esggo');
    this.onBroadcast?.(pkt);
  }

  ingestOmni(state: OmniState): void {
    const pkt = this.makePacket('omni', 'esggo', 'state', state);
    this.omni = this.mergeState(this.omni, state) as OmniState;
    this.health.lastPacketAt.omni = Date.now();
    this.ensureNode('omni');
    this.onBroadcast?.(pkt);
  }

  /** 接收外部封包（來自 relay / gateway WS） */
  receive(raw: unknown): SyncPacket | null {
    const pkt = safeParsePacket(raw);
    if (!pkt) { this.health.conflictsUnresolved++; return null; }
    this.health.packetsRecv++;
    this.health.lastPacketAt[pkt.from] = Date.now();
    this.ensureNode(pkt.from);
    // 狀態類封包 -> 合併進本地視圖
    if (pkt.kind === 'state' && pkt.from !== 'esggo') {
      if (pkt.from === 'omni') this.omni = pkt.payload as OmniState;
      // esggo 側由 ingestEsggo 處理
    }
    return pkt;
  }

  // ── OA-Summon：L3 萬能同步層驅動全域一致 ──────────────────
  /** 觸發全域雙向再同步（所有線上代理標記 summoned + 全量狀態重播） */
  summonRitual(): SyncPacket {
    const now = new Date().toISOString();
    if (this.esggo) {
      this.esggo.agents.forEach((a) => {
        if (a.status === 'online') {
          a.status = 'summoned';
          a.summonedAt = now;
          a.awakeningAuth = '萬能覺醒';
          a.fruitSeal = '萬能果証';
          a.layers = ['萬能標籤', '萬能同步', '萬能共鳴', '萬能糾纏'];
        }
      });
    }
    if (this.omni) {
      this.omni.agents.forEach((a) => {
        if (a.status === 'online') {
          a.status = 'summoned';
          a.summonedAt = now;
          a.awakeningAuth = '萬能覺醒';
          a.fruitSeal = '萬能果証';
          a.layers = ['萬能標籤', '萬能同步', '萬能共鳴', '萬能糾纏'];
        }
      });
    }
    const rite = {
      rite: 'oa-summon',
      lineage: ['Hermes', 'OmniHermes', 'OA_Hermes'],
      tier: 'reinforced',
      layers: ['萬能標籤', '萬能同步', '萬能共鳴', '萬能糾纏'],
      summonedAt: now,
      message: 'OmniAgent 萬能代理 已召喚 — 全域節點瞬時糾纏關聯',
    };
    const pkt = this.makePacket('esggo', '*', 'summon', rite);
    this.onBroadcast?.(pkt);
    return pkt;
  }

  getHealth(): SyncHealth { return { ...this.health }; }
  getEsggo(): ESGGOState | null { return this.esggo; }
  getOmni(): OmniState | null { return this.omni; }

  // ── 內部：封包工廠 / 合併 / 節點追蹤 ──────────────────────
  private makePacket(
    from: NodeKind, to: NodeKind | '*', kind: SyncPacket['kind'], payload: unknown,
  ): SyncPacket {
    this.seq++;
    this.health.packetsSent++;
    return {
      v: 1, from, to, kind, seq: this.seq, ts: Date.now(), payload, originId: this.originId,
    } as SyncPacket;
  }

  private ensureNode(k: NodeKind): void {
    if (!this.health.connectedNodes.includes(k)) this.health.connectedNodes.push(k);
  }

  /** last-write-wins 合併：以 lastHeartbeat / lastSyncAt 較新者為準（逐 agent） */
  private mergeState<T extends { lastSyncAt?: number; agents?: AgentState[] }>(prev: T | null, next: T): T {
    if (!prev) return next;
    const prevAgents = prev.agents ?? [];
    const nextAgents = next.agents ?? [];
    // 衝突：若雙方同時改同一 agent -> 以 lastHeartbeat 較新取勝
    const mergedAgents = [...prevAgents];
    for (const a of nextAgents) {
      const idx = mergedAgents.findIndex((x) => x.agentId === a.agentId);
      if (idx === -1) {
        mergedAgents.push(a);
      } else if (a.lastHeartbeat > mergedAgents[idx].lastHeartbeat) {
        mergedAgents[idx] = a; // 較新者取勝
        this.health.conflictsResolved++;
      } else {
        this.health.conflictsResolved++; // 較舊者被拒也算已處理衝突
      }
    }
    return { ...prev, ...next, agents: mergedAgents, lastSyncAt: Date.now() } as T;
  }
}
