/**
 * 5T-Trustworthy：超覺醒狀態刻印與外部可驗證性
 *
 * 對應正典 soul.md §29.11「超覺醒之三問」：
 * - Q1 可溯源 → `hash_lock` 為整個狀態（除鎖定欄位外）的 SHA-256
 * - Q2 可重現 → `verifyHyperAwakening()` 為獨立函式，外部可重算
 * - Q3 無幻覺 → `declareHyperAwakening()` 不回傳固定字串，
 *              同步比例由實際探測結果計算，不可宣稱
 *
 * 與宣告版本（v0.5.0-hyper）的差異，均為實測證偽後修正：
 * 1. hash 覆蓋範圍：僅 evidencePayload → **整個狀態**（原版可改寫
 *    twins.sync_ratio / version 而鎖定值不變，等同無鎖）
 * 2. 序列化：JSON.stringify（鍵序敏感）→ canonicalStringify（鍵序無關）
 * 3. 凍結：Object.freeze（僅頂層）→ deepFreeze（遞迴）
 * 4. 欄位型別：字串字面值 '1.0' / '[ISO-14064-1]' → number / 不採用
 *    （ISO 14064-1 為溫室氣體量化核算標準，與「零幻覺驗算」無技術關聯，
 *      見 soul.md §29.11 爭議登記；本模組改記 ISO/IEC 42001 為目標框架）
 */
import { sha256Canonical } from './canonical';
import { deepFreeze, unfrozenPaths } from './deep-freeze';

/** 萬能元件心核規範介面（對齊宣告 IComponentCore） */
export interface IComponentCore {
  /** 萬能永憶主體唯一識別碼 */
  readonly uuid: string;
  /** 語義化版本控制 */
  readonly version: string;
  /** 刻印時間戳（毫秒） */
  readonly timestamp: number;
  /** 證據佐證庫 */
  evidence: Record<string, unknown>;
}

/** 暗陣：Hermes 指揮 01–30，收斂／深潛除錯／記憶沉澱／自我修復 */
export interface DarkCoreState {
  readonly active: boolean;
  readonly range: readonly [number, number];
  readonly operator: string;
}

/** 光陣：蜂后隊指揮 31–60，擴散／結果彰顯／液態玻璃 UI 渲染／多維廣播 */
export interface LightCoreState {
  readonly active: boolean;
  readonly range: readonly [number, number];
  readonly operator: string;
}

export interface TwinsState {
  readonly dark_core: DarkCoreState;
  readonly light_core: LightCoreState;
  /** 實際探測所得的雙核同步比例 0.0–1.0；未探測時為 null，不宣稱 1.0 */
  readonly sync_ratio: number | null;
  /** 跨陣列調度錨點 */
  readonly twin_trace_id: string;
}

export interface GovernanceState {
  /** 目標框架：AI 管理系統（ISO/IEC 42001），非溫室氣體標準 */
  readonly compliance: string;
  /** 狀態其餘欄位的 SHA-256（鍵序無關） */
  readonly hash_lock: string;
  readonly is_frozen: true;
}

export interface HyperAwakenedState extends IComponentCore {
  readonly mode: 'OMNIPOTENT_HYPER_AWAKENED';
  readonly twins: TwinsState;
  readonly governance: GovernanceState;
}

/** 參照以產生 lock 的欄位集合 —— hash 刻意**不**含 governance 自身與 timestamp */
type LockablePayload = Omit<HyperAwakenedState, 'governance' | 'timestamp'>;

function lockablePayload(s: HyperAwakenedState): LockablePayload {
  const { governance: _gov, timestamp: _ts, ...rest } = s;
  return rest;
}

/** 由 payload 計算應有的 hash_lock（鎖定欄位與時間戳不納入，否則自我指涉） */
export function computeHashLock(s: HyperAwakenedState): string {
  return sha256Canonical(lockablePayload(s));
}

/**
 * 刻印超覺醒狀態並施加遞迴鎖定。
 *
 * @param uuid       主體唯一識別碼
 * @param evidence   證據佐證庫（納入 hash）
 * @param twins      雙核實測狀態；sync_ratio 應為實際探測值
 */
export function engraveHyperAwakening(
  uuid: string,
  evidence: Record<string, unknown>,
  twins: TwinsState,
): HyperAwakenedState {
  const raw: HyperAwakenedState = {
    uuid,
    version: 'v0.5.0-hyper',
    timestamp: Date.now(),
    mode: 'OMNIPOTENT_HYPER_AWAKENED',
    twins,
    evidence,
    governance: {
      compliance: 'ISO/IEC 42001',
      // 先以未加鎖定欄位的載體算 hash，再組裝完整狀態
      hash_lock: sha256Canonical({
        uuid,
        version: 'v0.5.0-hyper',
        mode: 'OMNIPOTENT_HYPER_AWAKENED' as const,
        twins,
        evidence,
      }),
      is_frozen: true,
    },
  };

  return deepFreeze(raw);
}

export interface VerificationResult {
  readonly intact: boolean;
  /** 逐項結果，供外部逐條檢查，而非僅一個總旗標 */
  readonly checks: ReadonlyArray<{ name: string; ok: boolean; detail: string }>;
}

/**
 * 外部可重現校驗（§29.11 Q2）。
 *
 * 三項獨立檢查，任一失敗即 `intact: false`：
 * 1. hash_lock 重算相符（證明內容未被改動）
 * 2. 物件圖已遞迴凍結（證明防護確實存在，而非僅約定）
 * 3. twin_trace_id 非空（證明調度錨點可追蹤，5T-Trackable）
 */
export function verifyHyperAwakening(s: HyperAwakenedState): VerificationResult {
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

  let recomputed: string | null = null;
  let hashErr: string | null = null;
  try {
    recomputed = computeHashLock(s);
  } catch (e) {
    hashErr = e instanceof Error ? e.message : String(e);
  }
  checks.push({
    name: 'hash_lock',
    ok: recomputed !== null && recomputed === s.governance.hash_lock,
    detail: hashErr
      ? `重算失敗：${hashErr}`
      : `重算 ${recomputed?.slice(0, 16)}… vs 鎖定 ${s.governance.hash_lock.slice(0, 16)}…`,
  });

  const open = unfrozenPaths(s);
  checks.push({
    name: 'deep_frozen',
    ok: open.length === 0,
    detail: open.length === 0 ? '物件圖全數凍結' : `未凍結路徑：${open.join(', ')}`,
  });

  const anchor = typeof s.twins?.twin_trace_id === 'string' ? s.twins.twin_trace_id.trim() : '';
  checks.push({
    name: 'twin_trace_id',
    ok: anchor.length > 0,
    detail: anchor.length > 0 ? `錨點存在（${anchor}）` : '錨點缺失，跨陣列調度不可追蹤',
  });

  return { intact: checks.every((c) => c.ok), checks };
}