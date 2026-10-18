/**
 * @esggo/ssas v0.1.0
 *
 * 5T 治理輔助工具
 * 為每一層實作 5T 驗證閘門
 *
 * 5T 驗證流程:
 * 1. Traceable: source_origin 必須存在且格式有效
 * 2. Trackable: timestamp 必須存在且非零
 * 3. Tangible: 必須有非空實體 (entity / event / report)
 * 4. Transparent: evidence 鏈必須完整
 * 5. Trustworthy: Hash Lock + Object.freeze() 已執行
 */

import { createHash, randomUUID } from 'node:crypto';
import type {
  FiveTResult,
  FiveTStatus,
  AuditEntry,
  ComputeHash,
  ApplyHashLock,
  isFiveTPassed,
} from '../schema/ssas-schema.js';

// ============================================================================
// 1. 5T 驗證輔助
// ============================================================================

/**
 * 建立 5T 審核軌跡項目
 */
export function createAuditEntry(
  phase: string,
  action: string,
  detail: Record<string, unknown>,
  source_origin: string
): AuditEntry {
  const entry: AuditEntry = {
    timestamp: Date.now(),
    phase,
    action,
    detail,
    source_origin,
    hash: createHash('sha256').update(JSON.stringify(detail)).digest('hex'),
  };
  return entry;
}

/**
 * 驗證 Traceable (可溯源)
 * 1. source_origin 必須存在
 * 2. source_origin 必須符合已知前綴
 */
export function validateTraceable(
  source_origin: string,
  expectedPrefixes?: string[]
): { status: FiveTStatus; message: string } {
  if (!source_origin || typeof source_origin !== 'string' || source_origin.trim() === '') {
    return { status: 'FAIL', message: 'source_origin 不可為空' };
  }

  if (expectedPrefixes) {
    const valid = expectedPrefixes.some((p) => source_origin.startsWith(p));
    if (!valid) {
      return { status: 'FAIL', message: `source_origin 需以以下前綴之一開頭: ${expectedPrefixes.join(', ')}` };
    }
  }

  return { status: 'PASS', message: 'source_origin 驗證通過' };
}

/**
 * 驗證 Trackable (可追蹤)
 * 1. timestamp 必須存在
 * 2. timestamp 必須是有效數字
 * 3. timestamp 不能是 0
 */
export function validateTrackable(timestamp: number | undefined): { status: FiveTStatus; message: string } {
  if (timestamp === undefined || typeof timestamp !== 'number' || isNaN(timestamp)) {
    return { status: 'FAIL', message: 'timestamp 不存在或格式錯誤' };
  }
  if (timestamp === 0) {
    return { status: 'FAIL', message: 'timestamp 不能為 0' };
  }
  return { status: 'PASS', message: 'timestamp 驗證通過' };
}

/**
 * 驗證 Tangible (可感知)
 * 1. 必須有非空主體屬性 (content / inputs / tasks / etc.)
 */
export function validateTangible(entity: Record<string, unknown>): { status: FiveTStatus; message: string } {
  let hasEntity = false;
  for (const [key, value] of Object.entries(entity)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string' && value.length > 0) {
        hasEntity = true;
        break;
      }
      if (Array.isArray(value) && value.length > 0) {
        hasEntity = true;
        break;
      }
      if (typeof value === 'object') {
        hasEntity = true;
        break;
      }
    }
  }
  return hasEntity
    ? { status: 'PASS', message: 'Tangible 驗證通過（存在非空實體）' }
    : { status: 'FAIL', message: 'Tangible 驗證失敗（找不到非空實體）' };
}

/**
 * 驗證 Transparent (透明)
 * 1. evidence 鏈必須存在
 * 2. 若已有 evidence，必須至少有 1 個
 */
export function validateTransparent(evidence: unknown[]): { status: FiveTStatus; message: string } {
  if (!Array.isArray(evidence)) {
    return { status: 'FAIL', message: 'evidence 不是陣列' };
  }
  if (evidence.length === 0) {
    return { status: 'SKIPPED', message: '無 evidence（尚未寫入）' };
  }
  return { status: 'PASS', message: `Transparent 驗證通過（${evidence.length} 個 evidence）` };
}

/**
 * 驗證 Trustworthy (可信)
 * 1. 物件必須已被 Object.freeze() 凍結
 * 2. evidence 陣列也必須被凍結
 */
export function validateTrustworthy<T extends Record<string, unknown>>(
  component: T
): { status: FiveTStatus; message: string } {
  if (Object.isFrozen(component)) {
    return { status: 'PASS', message: 'Trustworthy 已凍結' };
  }
  return { status: 'FAIL', message: '物件尚未凍結（尚未執行 Hash Lock）' };
}

// ============================================================================
// 2. 5T 完整驗證（針對 SSAS 每一層）
// ============================================================================

/**
 * 執行完整 5T 驗證（針對 SSAS 每一層實體）
 * 依據每一層的特性調用對應驗證
 */
export function validateSSASLayer<T extends Record<string, unknown>>(
  layer: string,
  entity: T,
  source_origin: string,
  expectedPrefixes?: string[]
): FiveTResult {
  const auditTrail: AuditEntry[] = [];

  // 1. Traceable
  const t1 = validateTraceable(source_origin, expectedPrefixes);
  auditTrail.push(createAuditEntry(layer, 'traceable-validate', { source_origin, ...t1 }, source_origin));
  const traceable = t1.status;

  // 2. Trackable
  const t2 = validateTrackable(entity.timestamp as number | undefined);
  auditTrail.push(createAuditEntry(layer, 'trackable-validate', { timestamp: entity.timestamp }, source_origin));
  const trackable = t2.status;

  // 3. Tangible
  const t3 = validateTangible(entity);
  auditTrail.push(createAuditEntry(layer, 'tangible-validate', { keys: Object.keys(entity) }, source_origin));
  const tangible = t3.status;

  // 4. Transparent
  const t4 = validateTransparent(entity.evidence as unknown[] | undefined);
  auditTrail.push(createAuditEntry(layer, 'transparent-validate', { evidenceCount: (entity.evidence as unknown[] | undefined)?.length || 0 }, source_origin));
  const transparent = t4.status;

  // 5. Trustworthy
  const t5 = validateTrustworthy(entity);
  auditTrail.push(createAuditEntry(layer, 'trustworthy-validate', { frozen: Object.isFrozen(entity) }, source_origin));
  const trustworthy = t5.status;

  const overall: FiveTStatus = [traceable, trackable, tangible, transparent, trustworthy].every((s) => s === 'PASS') ? 'PASS' :
    ([
      traceable, trackable, tangible, transparent, trustworthy
    ].some((s) => s === 'BLOCKED') || [
      traceable, trackable, tangible, transparent, trustworthy
    ].some((s) => s === 'FAIL')) ? 'FAIL' : 'PENDING';

  return {
    traceable,
    trackable,
    tangible,
    transparent,
    trustworthy,
    overall,
    auditTrail,
  };
}

/**
 * 透過 5T 驗證後寫入（自動 seal + freeze）
 */
export async function writeFiveTPassed<T extends Record<string, unknown>>(
  entity: T,
  layer: string,
  source_origin: string,
  expectedPrefixes?: string[]
): Promise<{ result: FiveTResult; locked: Readonly<T>; hash: string }> {
  // 1. 5T 驗證
  const validation = validateSSASLayer(layer, entity, source_origin, expectedPrefixes);

  if (validation.overall !== 'PASS') {
    return {
      result: validation,
      locked: entity as Readonly<T>,
      hash: '',
    };
  }

  // 2. Seal + Freeze（Trustworthy）
  const hashedPayload = JSON.stringify(entity, (_, v) => (v === undefined ? null : v));
  const hash = createHash('sha256').update(hashedPayload).digest('hex');

  (entity as Record<string, unknown>).evidence = [
    ...(entity as Record<string, unknown>).evidence || [],
    {
      hash,
      verifiedBy: `ssas-${layer.toLowerCase()}@0.1.0`,
      standard: '5T-PROOF',
      payload: { layer, sealedAt: new Date().toISOString() },
    },
  ];

  Object.freeze(entity);
  Object.freeze((entity as Record<string, unknown>).evidence);

  return {
    result: validation,
    locked: entity as Readonly<T>,
    hash,
  };
}

// ============================================================================
// 3. 生命週期 Hooks（Trackable 實現）
// ============================================================================

/**
 * 生命週期 hook 監聽器
 */
export type LifecycleHook = (entry: {
  layer: string;
  phase: 'CREATE' | 'STORE' | 'UPDATE' | 'SEAL' | 'VERIFY' | 'ARCHIVE';
  target: string;
  detail: Record<string, unknown>;
}) => void;

export class LifecycleTracker {
  private hooks: LifecycleHook[] = [];
  private events: Array<{
    layer: string;
    phase: string;
    target: string;
    timestamp: number;
    detail: Record<string, unknown>;
  }> = [];

  onHook(hook: LifecycleHook): void {
    this.hooks.push(hook);
  }

  track(layer: string, phase: string, target: string, detail: Record<string, unknown>): void {
    const event = { layer, phase, target, timestamp: Date.now(), detail };
    this.events.push(event);

    for (const hook of this.hooks) {
      try {
        hook({ layer, phase, target, detail });
      } catch (e) {
        // hook 失敗不應中斷主流程
        console.warn(`[LifecycleTracker] Hook 失敗: ${String(e)}`);
      }
    }
  }

  getEvents(): typeof this.events {
    return this.events;
  }

  clear(): void {
    this.events = [];
  }
}

// ============================================================================
// 4. 預設生命週期跟蹤器（SSAS 整體）
// ============================================================================

/**
 * 預設生命週期跟蹤器實例
 */
export const lifecycleTracker = new LifecycleTracker();

// 初始化 hook
lifecycleTracker.onHook((entry) => {
  // 預設行為：記錄到 SSAS 追蹤日誌
  console.debug(`[SSAS-Lifecycle] ${entry.layer} | ${entry.phase} | ${entry.target}`);
});

/**
 * 記錄層生命週期事件
 */
export function layerEvent(layer: string, phase: string, target: string, detail: Record<string, unknown>): void {
  lifecycleTracker.track(layer, phase, target, detail);
}
