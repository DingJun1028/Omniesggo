/**
 * Conduit — 5T 合規訊息通道 (點對點 / 點對組收件箱)
 *
 * 定位：補齊 §12 進階整合模式的「第七種 5T 合規模式」。
 *   - EventBus (§12.1.1) = 發佈訂閱 (廣播, 多對多)
 *   - StreamBuffer (§12.0) = 流式緩衝 (暫存, 增量讀)
 *   - Conduit = 有向通道 (Directed Channel): 明確 sender→recipient(s)，
 *     每封訊息自帶 5T 憑證 (hash lock)，收件方在投遞前驗證，
 *     確保「跨蜂通訊」也過 5T 閘區，而非繞過。
 *
 * 與跨組協作協定 (§四 萬有引力 + 缺口補齊 15 對) 的對應：
 *   - 每條 Conduit 實例可綁定一對跨組配對 (如 02規劃蜂 ↔ 12設計蜂)
 *   - send() 前的 verify5T 對應「5T 驗證閘」；收件箱 inbox 對應「無縫交接 <2h」
 *
 * 增量優化：收件箱支援 since 增量讀取 (delta)，大批次 sendMany 用 WorkerPool 並行，
 *           訊息本體 gzip 壓縮 (CompressionEngine)，對齊 §12.0。
 *
 * 設計哲學 (無作妙德圓通無礙)：
 *   - 無作: recipient 不存在 / 通道未開啟 → 靜默入死信 (dead-letter)，不報錯
 *   - 圓通: 與 EventBus / StreamBuffer 共用 five-t Gate 與增量基礎設施
 *   - 無礙: 凡過通道的訊息皆附 hashLock，下游可 verifyGate 反驗，不可篡改
 */
import { createHash } from 'node:crypto';
import { StreamBuffer } from './stream-buffer.js';
import { WorkerPool } from './worker-pool.js';
import { CompressionEngine } from './compression.js';
import { verify5T, hashLock } from './five-t.js';
import type { FiveTDimension, FiveTResult } from './types.js';

/** 訊息信封 (對齊 IComponentCore 意念: 可溯源 + 不可改) */
export interface ConduitEnvelope<T = unknown> {
  /** 可溯源 id: sender 雜湊前綴 + 序號 */
  readonly id: string;
  /** 發送方 (soul.md 編號, 如 '02' 規劃蜂) */
  readonly sender: string;
  /** 接收方 (單一或群組, 如 '12' 或 ['12','13']) */
  readonly recipients: string[];
  /** 主題 (可對應配對鍵, 如 'gap_02_12') */
  readonly topic: string;
  /** 投遞時間戳 */
  readonly timestamp: number;
  /** 5T 憑證雜湊 (hashLock 結果) */
  readonly seal: string;
  /** 壓縮後本體 (gzip Buffer) — 解壓得 payload */
  readonly body: Buffer;
}

/** 開箱後的純訊息 (收件方讀取用) */
export interface ConduitMessage<T = unknown> {
  id: string;
  sender: string;
  recipients: string[];
  topic: string;
  timestamp: number;
  seal: string;
  payload: T;
  /** 收件方本地驗證結果 (可null: 未驗證) */
  verified: FiveTResult | null;
}

export interface ConduitOptions {
  /** 並行 worker 數 (sendMany 用) */
  concurrency?: number;
  /** 收件箱容量 (per recipient StreamBuffer) */
  inboxCap?: number;
  /** 是否強制 5T 驗證才投遞 (false=寬鬆, 仍附 seal 但容錯) */
  strict?: boolean;
}

type Box = StreamBuffer<ConduitEnvelope>;

const DIMENSIONS: FiveTDimension[] = [
  'traceable',
  'transparent',
  'tangible',
  'trustworthy',
  'trackable',
];

/**
 * Conduit — 有向 5T 合規通道
 *
 * 用法:
 *   const c = new Conduit({ strict: true });
 *   const id = await c.send('02', ['12'], 'gap_02_12', { text: '品牌戰略草案' });
 *   const msgs = c.read('12', since);
 *   for (const m of msgs) if (m.verified?.pass) consume(m.payload);
 */
export class Conduit {
  private readonly boxes = new Map<string, Box>();
  private readonly workers: WorkerPool;
  private readonly compression = new CompressionEngine();
  private readonly inboxCap: number;
  private readonly strict: boolean;
  private seq = 0;

  constructor(opts: ConduitOptions = {}) {
    this.workers = new WorkerPool(opts.concurrency ?? 4);
    this.inboxCap = Math.max(1, opts.inboxCap ?? 1024);
    this.strict = opts.strict ?? false;
  }

  /** Traceable: 產生可溯源信封 id (sender 雜湊前綴) */
  private makeId(sender: string): string {
    const h = createHash('sha256').update(sender).digest('hex').slice(0, 8);
    this.seq += 1;
    return `cdt_${h}_${Date.now()}_${this.seq}`;
  }

  /** 確保 recipient 收件箱存在 (無作: 懶初始化) */
  private boxOf(recipient: string): Box {
    let b = this.boxes.get(recipient);
    if (!b) {
      b = new StreamBuffer<ConduitEnvelope>(this.inboxCap);
      this.boxes.set(recipient, b);
    }
    return b;
  }

  /** 將 JSON.stringify 產生的 \uXXXX 跳脫還原為可讀中文, 供 verify5T 正則匹配 */
  private readable(json: string): string {
    try {
      return json.replace(/\\u([0-9a-fA-F]{4})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)));
    } catch {
      return json;
    }
  }

  /**
   * 發送一條跨蜂訊息 (5T 驗證閘在前)
   * @returns 訊息 id; 若 strict 且未過 5T 則拋錯 (結界阻斷, 信不落地)
   */
  async send<T = unknown>(
    sender: string,
    recipients: string | string[],
    topic: string,
    payload: T
  ): Promise<string> {
    const recips = Array.isArray(recipients) ? recipients : [recipients];

    // Transparent: 將 payload 序列化為可驗證字串 (反跳脫後供 5T 正則匹配中文標記)
    const serialized = JSON.stringify(payload ?? null);
    const readable = this.readable(serialized);
    const result: FiveTResult = verify5T(readable);

    if (this.strict && !result.pass) {
      // Trustworthy: 嚴格模式下, 未過 5T 的訊息不放行 (結界阻斷)
      throw new Error(
        `Conduit[${sender}→${recips.join(',')}] 5T 驗證失敗: ${result.failed.join(',')}`
      );
    }

    // Trustworthy: hash lock 封存憑證
    const seal = hashLock(serialized + topic + sender);
    const id = this.makeId(sender);
    const envelope: ConduitEnvelope<T> = Object.freeze({
      id,
      sender,
      recipients: recips,
      topic,
      timestamp: Date.now(),
      seal,
      body: this.compression.compress(payload),
    });

    // Trackable: 投遞至每個 recipient 收件箱 (增量寫入)
    for (const r of recips) {
      this.boxOf(r).append(envelope, {
        id,
        topic,
        source: sender,
      });
    }
    return id;
  }

  /**
   * 批次發送 (增量: WorkerPool 並行封裝, 不一次全開)
   * 回傳每封的結果 (成功=id, 失敗=undefined 靜默)
   */
  async sendMany(
    sender: string,
    items: Array<{ recipients: string | string[]; topic: string; payload: unknown }>
  ): Promise<(string | undefined)[]> {
    return this.workers.processDelta(items, (it) =>
      this.send(sender, it.recipients, it.topic, it.payload)
    );
  }

  /**
   * 讀取 recipient 收件箱 (增量: 僅回傳 timestamp > since 的變更)
   * 每封自動 verifyGate 反驗 seal, 填入 verified 欄
   */
  read<T = unknown>(recipient: string, since = 0): ConduitMessage<T>[] {
    const box = this.boxes.get(recipient);
    if (!box) return [];
    const entries = box.getDelta(since) as unknown as Array<{ payload: ConduitEnvelope<T> }>;
    return entries.map((entry) => {
      const env = entry.payload;
      const payload = this.compression.decompress(env.body) as T;
      // Transparent + Trustworthy: 收件方反驗 seal
      const verified = this.verifyEnvelope(env, payload);
      return {
        id: env.id,
        sender: env.sender,
        recipients: env.recipients,
        topic: env.topic,
        timestamp: env.timestamp,
        seal: env.seal,
        payload,
        verified,
      };
    });
  }

  /** 反驗信封: 重建 serialized 並 verifyGate('trustworthy', ...) 對照 seal */
  private verifyEnvelope(env: ConduitEnvelope, payload: unknown): FiveTResult {
    const serialized = JSON.stringify(payload ?? null);
    const expected = hashLock(serialized + env.topic + env.sender);
    const trusted =
      expected === env.seal ? { pass: true, failed: [] as FiveTDimension[] } : { pass: false, failed: ['trustworthy'] as FiveTDimension[] };
    // 完整 5T: 先驗 seal 再驗內容 (用 readable 還原中文供正則)
    const full = verify5T(this.readable(serialized));
    if (!trusted.pass) full.failed = Array.from(new Set([...full.failed, ...trusted.failed]));
    full.pass = trusted.pass && full.pass;
    return full;
  }

  /** 死信/未投遞統計 (無作: 不存在的 recipient 視為已靜默處理) */
  health(): { recipients: number; buffered: number; strict: boolean } {
    let buffered = 0;
    for (const b of this.boxes.values()) buffered += b.size();
    return { recipients: this.boxes.size, buffered, strict: this.strict };
  }
}

/** 便捷工廠 */
export function createConduit(opts?: ConduitOptions): Conduit {
  return new Conduit(opts);
}
