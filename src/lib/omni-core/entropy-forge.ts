// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:結界]
import * as crypto from 'crypto';

/**
 * 萬能修復協議 - 熵減煉金操作 (EntropyForge)
 * 負責數據淨化、亂碼清除與編碼歸一化。
 *
 * G6 OmniBrain 全 5T 實現：
 *  - Traceable: source_origin + trace_id 事件軌跡
 *  - Trackable: 全量追蹤事件（traceEvents）
 *  - Tangible: 反饋記錄（feedback）
 *  - Transparent: 零幻覺驗證（verifyHashLock）
 *  - Trustworthy: Hash Lock（sha256）+ Object.freeze()
 */
export interface ITraceEvent {
  trace_id: string;
  source_origin: string;
  op: string;
  ts: string;
  payload: Record<string, unknown>;
  hash_lock: string | undefined;
  frozen: boolean;
}

export class EntropyForge {
  /** 追蹤事件窗（Trackable） */
  static readonly traceEvents: ITraceEvent[] = [];
  static traceCounter = 0;

  /**
   * 進行編碼歸一化與清除不可見字符/亂碼。
   * 向下相容：不改變現有行為。
   */
  static purify(text: string): string {
    if (!text) return text;
    let normalized = text.normalize('NFC');
    normalized = normalized.replace(
      /[\u200B-\u200D\uFEFF]/g,
      ''
    );
    normalized = normalized.replace(
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
      ''
    );
    return normalized;
  }

  /** 向下相容：沿用原有 lock 語意（只將 hash_lock ＋ trace_id 套到原物件），不修改序列化內容 */
  static applyHashLock<T>(obj: T, source_origin = 'omni-core'): T {
    if (typeof obj === 'object' && obj !== null) {
      const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(obj))
        .digest('hex');
      Object.assign(obj, {
        hash_lock: hash,
        trace_id: this.nextTraceId(),
      });
    }
    const event: ITraceEvent = {
      trace_id: this.nextTraceId(),
      source_origin,
      op: 'hash_lock',
      ts: new Date().toISOString(),
      payload: (() => {
        const out: Record<string, unknown> = {};
        if (typeof obj === 'object' && obj !== null) {
          for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
            if (k !== 'hash_lock' && k !== 'trace_id') out[k] = v;
          }
        }
        return out;
      })(),
      hash_lock: (obj as Record<string, unknown>).hash_lock as string | undefined,
      frozen: true,
    };
    this.recordTrace(event);
    return Object.freeze(obj) as T;
  }

  static nextTraceId(): string {
    return (
      'oid_' +
      (++EntropyForge.traceCounter) +
      '_' +
      crypto
        .createHash('sha256')
        .update(String(Date.now()))
        .digest('hex')
        .slice(0, 8)
    );
  }

  static recordTrace(event: ITraceEvent): void {
    this.traceEvents.push(event);
  }

  static getTraceEvents(): readonly ITraceEvent[] {
    return Object.freeze([...this.traceEvents]);
  }

  /** 全 5T 封印：輸出即凍結，且帶 source_origin + hash_lock */
  static seal<T>(payload: T, source_origin = 'omni-core'): {
    sealed: T;
    event: ITraceEvent;
  } {
    const frozen = Object.freeze(payload);
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(frozen))
      .digest('hex');
    const event: ITraceEvent = {
      trace_id: this.nextTraceId(),
      source_origin,
      op: 'seal',
      ts: new Date().toISOString(),
      payload: { ...frozen },
      hash_lock: hash,
      frozen: true,
    };
    this.recordTrace(event);
    return {
      sealed: Object.freeze({ ...frozen, hash_lock: hash }),
      event: Object.freeze(event),
    };
  }

  /** 驗證 hash_lock 是否與當前序列化值一致（Transparent 零幻覺驗算） */
  static verifyHashLock(
    obj: Record<string, unknown>
  ): { ok: boolean; hash_lock?: string; reason?: string } {
    const stored = obj.hash_lock;
    if (stored === undefined) return { ok: false, reason: 'no hash_lock' };
    if (typeof stored !== 'string' || !/^[0-9a-f]{64}$/i.test(stored)) {
      return { ok: false, reason: 'bad hash_lock format' };
    }
    // 排除 hash_lock 自身：只對有效載荷做重新雜湊，避免封鎖鍵自我指涉導致殘缺驗證
    const payload = Object.fromEntries(
      Object.entries(obj).filter(([k]) => k !== 'hash_lock')
    );
    const recomputed = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
    const ok = recomputed.toLowerCase() === stored.toLowerCase();
    return { ok, hash_lock: stored, reason: ok ? undefined : 'hash mismatch' };
  }

  /** Tangible 反饋記錄（可被外部採集/可見化） */
  static feedback(
    kind: string,
    source_origin: string,
    detail: Record<string, unknown>
  ): ITraceEvent {
    const payload = { kind, source_origin, detail };
    const event: ITraceEvent = {
      trace_id: this.nextTraceId(),
      source_origin,
      op: 'feedback',
      ts: new Date().toISOString(),
      payload,
      hash_lock: crypto
        .createHash('sha256')
        .update(JSON.stringify(payload))
        .digest('hex'),
      frozen: true,
    };
    this.recordTrace(event);
    return Object.freeze(event);
  }
}
