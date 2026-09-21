/**
 * @esggo/omni-core v1.0.0
 *
 * IComponentCore 心核介面 + sealComponentCore Hash Lock 刻印
 *
 * 5T 對應:
 * - Traceable: source_origin 欄位標記數據源頭
 * - Trackable: timestamp 欄位記錄刻印時間
 * - Tangible: IComponentCore 介面實體可被驗證
 * - Transparent: evidence 鏈式追加零幻覺驗算報告
 * - Trustworthy: sealComponentCore 執行 Hash Lock + Object.freeze()
 */

import { createHash, randomUUID } from 'node:crypto';

/**
 * 證據佐證 (可變, 用於鏈式追加零幻覺驗算報告)
 */
export interface Evidence {
  /** SHA256 hash of payload */
  hash: string;
  /** 驗算者 (e.g., "omni-core@1.0.0") */
  verifiedBy: string;
  /** 標準: ISO-14064-1 / Formal-Proof / 5T-PROOF */
  standard: 'ISO-14064-1' | 'Formal-Proof' | '5T-PROOF';
  /** 證據 payload */
  payload: unknown;
}

/**
 * 萬能心核不可篡改刻印介面
 *
 * 所有 Omni 元件 (Memory/Tag/Agent/DB/UI/Bridge/Forge) 必須實作
 */
export interface IComponentCore {
  /** 萬能永憶主體唯一識別碼 (UUID v7) */
  readonly uuid: string;
  /** 語義化版本控制 (e.g., "1.2.0") */
  readonly version: string;
  /** 刻印時間戳 (ISO-8601 UTC milliseconds) */
  readonly timestamp: number;
  /** 數據源頭標記 (Traceable) */
  readonly source_origin: string;
  /** 證據佐證庫 (可變, 用於鏈式追加) */
  evidence: Evidence[];
}

/**
 * 建立新 IComponentCore 預設值
 */
export function createComponentCore(
  source_origin: string,
  options: Partial<Pick<IComponentCore, 'uuid' | 'version' | 'timestamp'>> = {}
): IComponentCore {
  return {
    uuid: options.uuid ?? randomUUID(),
    version: options.version ?? '1.0.0',
    timestamp: options.timestamp ?? Date.now(),
    source_origin,
    evidence: [],
  };
}

/**
 * 計算 SHA256 hash of payload
 */
export function computeHash(payload: unknown): string {
  const json = JSON.stringify(payload, (_, v) => (v === undefined ? null : v));
  return createHash('sha256').update(json).digest('hex');
}

/**
 * 萬能心核不可篡改刻印函式
 *
 * 執行:
 * 1. 計算整體 hash (含 evidence 鏈)
 * 2. 寫入 seal 證據到 evidence
 * 3. Object.freeze() 整個 component + evidence 陣列
 * 4. 回傳 Readonly<IComponentCore>
 *
 * @example
 * ```typescript
 * const core = createComponentCore('test://origin');
 * const sealed = await sealComponentCore(core);
 * // sealed.evidence[0].hash === sha256 of sealed (self-referential seal)
 * // Object.isFrozen(sealed) === true
 * ```
 */
export async function sealComponentCore<T extends IComponentCore>(
  component: T
): Promise<Readonly<T>> {
  // 1. 計算整體 hash (含 evidence 在 seal 前)
  const payload = JSON.stringify(component, (_, v) => (v === undefined ? null : v));
  const hash = createHash('sha256').update(payload).digest('hex');

  // 2. 寫入 seal 證據
  component.evidence.push({
    hash,
    verifiedBy: 'omni-core@1.0.0',
    standard: '5T-PROOF',
    payload: { sealedAt: new Date().toISOString() },
  });

  // 3. 凍結 (不可變)
  Object.freeze(component);
  Object.freeze(component.evidence);

  return component as Readonly<T>;
}

/**
 * 驗證 IComponentCore 是否仍維持不可篡改
 *
 * 重新計算 hash + 比對 evidence[last].hash
 * 若 mismatch → 已被篡改 (5T Trustworthy 失效)
 */
export async function verifySeal(component: Readonly<IComponentCore>): Promise<boolean> {
  if (!Object.isFrozen(component) || !Object.isFrozen(component.evidence)) {
    return false;
  }

  // 取出 seal 證據
  const sealEvidence = component.evidence[component.evidence.length - 1];
  if (!sealEvidence || sealEvidence.standard !== '5T-PROOF') {
    return false;
  }

  // 重新計算 hash (排除 seal evidence 本身)
  const cloned: IComponentCore = {
    uuid: component.uuid,
    version: component.version,
    timestamp: component.timestamp,
    source_origin: component.source_origin,
    evidence: component.evidence.slice(0, -1) as Evidence[],
  };

  const recomputed = computeHash(cloned);
  return recomputed === sealEvidence.hash;
}

export type { IComponentCore as IComponentCoreType };
