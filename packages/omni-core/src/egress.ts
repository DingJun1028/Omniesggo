/**
 * egress — OAG 核心禁區出口封裝 (R2)
 *
 * hashLockEvent: 對事件規範化內容執行 SHA-256 (node:crypto), 可獨立重驗。
 * egressLock: Hash Lock 刻印 -> evidence 證據佐證 -> deepFreeze 深凍結。
 *
 * 與 index.ts sealComponentCore 之差異: sealComponentCore 封「元件」,
 * egressLock 封「事件」(帶 topic / payload / source_origin), 供 OAB/OAB-下游
 * 事件出口使用。模組自持 createHash, 不回匯入 index.ts, 避免循環匯入。
 */
import { createHash } from 'node:crypto';
import { deepFreeze } from './deep-freeze';

/** 可封印事件的最小契約 (對齊 src/types/core-contract.ts IBusEvent 子集) */
export interface LockableEvent {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  readonly source_origin: string;
  readonly topic: string;
  payload: unknown;
  evidence?: Record<string, unknown>;
}

/** 對事件規範化內容執行 SHA-256 內容雜湊 (同 payload 必得同 hash, 可獨立重驗) */
export function hashLockEvent(event: LockableEvent): string {
  const canonical = JSON.stringify(
    {
      uuid: event.uuid,
      version: event.version,
      timestamp: event.timestamp,
      source_origin: event.source_origin,
      topic: event.topic,
      payload: event.payload,
    },
    (_key, value) => (value === undefined ? null : value)
  );
  return createHash('sha256').update(canonical).digest('hex');
}

export interface EgressSeal<T> {
  /** SHA-256 內容雜湊刻印 */
  readonly hash: string;
  /** 深凍結後的事件 (Readonly) */
  readonly sealed: Readonly<T>;
}

/**
 * 出口封裝: Hash Lock 刻印 + 證據佐證 + 深凍結。
 * 凍結後任何寫入皆靜默失敗 (strict mode 下 throw), 達成不可篡改保證。
 */
export function egressLock<T extends LockableEvent>(
  event: T,
  standard = 'ISO-14064-1'
): EgressSeal<T> {
  const hash = hashLockEvent(event);
  const evidence = (event.evidence ??= {});
  evidence['hash_lock'] = hash;
  evidence['verification_standard'] = evidence['verification_standard'] ?? standard;
  deepFreeze(event);
  return { hash, sealed: event };
}
