import { createHash } from 'crypto';
import { IBusEvent } from '../types/bus-event';

/**
 * Secure utility functions for the Core Secure Zone.
 *
 * HexLock freeze — 5T Protocol T4 Trustworthy 的「內容繫結」鎖定：
 *   1. 對記錄內容計算 SHA-256 digest，寫入 `(evidence as any).hash_lock`（`0x` + 64 hex）。
 *   2. 執行 `Object.freeze()`，讓頂層記錄不可再被指派。
 *
 * 鎖定值必須與內容綁定（content-committing）：任何內容變更都會使
 * `verifyHashLock` 驗證失敗，達到竄改偵測的目的。
 */
export class SecureUtils {
  /**
   * Lock an object by computing a SHA-256 hash of its JSON representation,
   * attach the digest as `(evidence as any).hash_lock` (`0x`-prefixed hex), then freeze
   * the object to make it immutable at the top level.
   *
   * NOTE: `Object.freeze` is shallow. Nested objects (e.g. `evidence`) remain
   * mutable — but because `hash_lock` commits to the full serialized record,
   * any nested mutation will invalidate `verifyHashLock`.
   *
   * @param obj The object to lock and freeze. It must be a plain object.
   * @returns The same object instance, now frozen and carrying a `hash_lock`.
   */
  public static lockAndFreeze<T extends object>(obj: T): T {
    // Compute a deterministic SHA‑256 hash of the object's JSON representation.
            // Ensure evidence object exists
    const rec = obj as Record<string, unknown>;
    if (!rec.evidence) rec.evidence = {};
    const evidence = rec.evidence as Record<string, unknown>;

    // Content-committing SHA-256 hash lock. Hash BEFORE attaching the lock so
    // the digest can later be re-derived (evidence minus hash_lock).
    const serialized = JSON.stringify(rec);
    const digest = createHash('sha256').update(serialized).digest('hex');
    (evidence as any)['hash_lock'] = `0x${digest}`;

    // Execute native JavaScript Object.freeze() to prevent further tampering
    Object.freeze(obj);
    return obj;
  }

  /**
   * Verify that a locked record's `hash_lock` still matches its current
   * content. Returns `false` for records without a valid lock, and for records
   * whose content (including nested `evidence`) has been mutated after locking.
   *
   * @param obj The record previously locked by `lockAndFreeze`.
   */
  public static verifyHashLock<T extends object>(obj: T): boolean {
    const rec = obj as Record<string, unknown>;
    if (!rec.evidence || typeof rec.evidence !== 'object') return false;

    const evidence = { ...(rec.evidence as Record<string, unknown>) };
    const stored = (evidence as any)['hash_lock'];
    if (typeof stored !== 'string' || !stored.startsWith('0x')) return false;

    // Re-derive the digest over the same shape that was hashed at lock time
    // (evidence minus the hash_lock field itself).
    delete (evidence as any)['hash_lock'];
    const expected = `0x${createHash('sha256').update(JSON.stringify({ ...rec, evidence })).digest('hex')}`;
    return stored === expected;
  }

  /**
   * Execute Hash Lock – generate a hash imprint for an IBusEvent.
   * This is a thin wrapper around `lockAndFreeze` that works with the event
   * interface used throughout the OmniAgent ecosystem.
   *
   * @param event The bus event to be locked.
   * @returns The same event instance, now frozen and carrying a `hash_lock`.
   */
  public static applyHashLock(event: IBusEvent): IBusEvent {
    // Re‑use the generic lockAndFreeze implementation.
    return SecureUtils.lockAndFreeze(event as unknown as object) as IBusEvent;
  }
}
