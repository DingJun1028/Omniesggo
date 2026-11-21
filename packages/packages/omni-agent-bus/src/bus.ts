/**
 * OmniAgentBus — 萬能代理總線骨幹
 *
 * 設計哲學 (無作妙德圓通無礙):
 *   - 無作: handler 未註冊不報錯, 靜默略過 (graceful)
 *   - 圓通: 所有 OA 子框架 / 蜂群 / Team Memory 經同一條總線互通
 *   - 無礙: 訊息流經總線時自動過 5T Gate, 未過閘的不准向下游廣播
 *
 * 5T Gate 對齊 omni-agent gates.ts:
 *   traceable≥100 / transparent≥150 / tangible≥200 / trustworthy≥120 / trackable≥80
 *   品質特徵正則 + SHA256 hash
 */
import { createHash } from 'node:crypto';
import type { BusHandler, BusMessage, OATaskResult, SubFrameId } from './types.js';

/**
 * 5T 閘門的五個維度聯集。
 *
 * 5T-Trustworthy: 必須 export —— bus5TGate 的公開回傳型別含 FiveTDimension[]，
 * 未 export 時 consumer 無法標註該欄位型別（tsc 隱式推導雖可過，但無法
 * 寫出 `const dims: FiveTDimension[] = gate.failed`，也無法做 exhaustive
 * switch）。型別出現在公開簽章卻不可命名，等於契約有洞。
 */
export type FiveTDimension = 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';

const GATE_MIN_LENGTH: Record<FiveTDimension, number> = {
  traceable: 100, transparent: 150, tangible: 200, trustworthy: 120, trackable: 80,
};
const GATE_PATTERNS: Record<FiveTDimension, RegExp> = {
  traceable: /GRI|ISO|TCFD|SDG|來源|引用|reference/i,
  transparent: /%|百分比|比率|比例|公開|揭露/i,
  tangible: /完成|達成|實現|推動|建立|導入|數量|金額/i,
  trustworthy: /ZKP|hash|sha|封印|驗證|審計|audit/i,
  trackable: /202[5-9]|年度|期間|日期|追蹤|monitor/i,
};
const GATES: FiveTDimension[] = ['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'];

/** 對齊 omni-agent verifyGate: 單維度內容閘門 */
function verifyGate(gate: FiveTDimension, content: string, hash?: string): boolean {
  if (!content || content.length < GATE_MIN_LENGTH[gate]) return false;
  if (GATE_PATTERNS[gate] && !GATE_PATTERNS[gate].test(content)) return false;
  if (gate === 'trustworthy' && (!hash || hash.length < 16)) return false;
  return true;
}

/** 總線級 5T 閘門: 對 OATaskResult.output 做內容級驗證 */
export function bus5TGate(result: OATaskResult): { pass: boolean; failed: FiveTDimension[] } {
  const hash = createHash('sha256').update(result.output).digest('hex');
  const failed = GATES.filter((g) => !verifyGate(g, result.output, hash));
  return { pass: failed.length === 0, failed };
}

export class OmniAgentBus {
  private handlers = new Map<string, Set<BusHandler>>();
  private gateEnabled = true;

  /** 切換總線級 5T 閘門 (無礙開關) */
  setGate(enabled: boolean): void {
    this.gateEnabled = enabled;
  }

  /** 註冊主題 handler (無作: 重複註冊靜默合併) */
  subscribe<T = unknown>(topic: string, handler: BusHandler<T>): void {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Set());
    this.handlers.get(topic)!.add(handler as BusHandler);
  }

  unsubscribe<T = unknown>(topic: string, handler: BusHandler<T>): void {
    this.handlers.get(topic)?.delete(handler as BusHandler);
  }

  /** 發佈訊息 — 自動過 5T Gate 後才廣播 (無礙) */
  async publish<T = unknown>(topic: string, source: string, payload: T): Promise<BusMessage<T>> {
    const msg: BusMessage<T> = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      topic, source, timestamp: Date.now(), payload,
    };
    // 5T Gate: 若 payload 是 OATaskResult, 過內容級閘門
    // 豁免: .rejected 結尾的主題是閘門下游 (已在 deployGate 判定), 不再二次攔截
    if (this.gateEnabled && !topic.endsWith('.rejected') && this.isTaskResult(payload)) {
      const g = bus5TGate(payload);
      msg.passedGate = g.pass;
      if (!g.pass) {
        // 未過閘: 發佈到 .rejected 主題但不向下游廣播
        this.dispatch(`${topic}.rejected`, { ...msg, passedGate: false });
        return msg;
      }
    }
    this.dispatch(topic, msg);
    return msg;
  }

  private isTaskResult(p: unknown): p is OATaskResult {
    return !!p && typeof p === 'object' && 'subFrame' in (p as object) && 'output' in (p as object);
  }

  private dispatch<T>(topic: string, msg: BusMessage<T>): void {
    const set = this.handlers.get(topic);
    if (!set) return; // 無作: 無 handler 靜默略過
    for (const h of set) {
      try { void h(msg); } catch { /* 單 handler 錯不中斷總線 */ }
    }
  }

  /** 健康: 回傳註冊主題數 + 閘門狀態 */
  health(): { topics: number; gateEnabled: boolean } {
    return { topics: this.handlers.size, gateEnabled: this.gateEnabled };
  }
}

/** 便捷工廠 */
export function createBus(gateEnabled = true): OmniAgentBus {
  const b = new OmniAgentBus();
  b.setGate(gateEnabled);
  return b;
}

// 重新匯出型別
export type { BusHandler, BusMessage, OATaskResult, SubFrameId };
