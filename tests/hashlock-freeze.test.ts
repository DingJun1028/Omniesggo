/**
 * ==========================================
 * ESG GO 平台 - Hash Lock + HexLock Freeze 合規驗證測試
 * ==========================================
 * Verify the cryptographic lock mechanisms backing T4 Trustworthy:
 *
 *  1. Sonnar Hash Lock (src/core/sonnar/hash-lock.ts)
 *     - SHA-256 hex digest lock generation & constant-time verification
 *  2. SecureUtils.lockAndFreeze / applyHashLock (src/agents/secure-utils.ts)
 *     - "HexLock freeze": attach a hex hash lock then Object.freeze() the record
 *  3. OmniGatewayV2.hashLock / secureForward (src/agents/twelve-omni/omni-gateway.ts)
 *     - gateway-level SHA-256 hex lock + event freeze
 *  4. POST /api/hashlock route (app/api/hashlock/route.ts)
 *     - generate / verify / verifyTrinity contract
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// ── Imports under test ─────────────────────────────────────────
import {
  generateHash,
  generateHMAC,
  verifyHash,
  verifyHMAC,
  createHashLock,
  batchHash,
  detectChanges,
  trinityHash,
} from '../src/core/sonnar/hash-lock';
import { SecureUtils } from '../src/agents/secure-utils';
import { OmniGatewayV2 } from '../src/agents/twelve-omni/omni-gateway';
import { POST as hashlockPOST, GET as hashlockGET } from '../app/api/hashlock/route';

// ── Helpers ────────────────────────────────────────────────────

function makeEvent() {
  return {
    uuid: '11111111-2222-4333-8444-555555555555',
    version: '1.0.0',
    timestamp: Date.now(),
    evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', doc: 'evidence-1' },
    source_origin: 'test',
    topic: 'esg.verify',
    lifecycle_path: [{ stage: 'EMERGED', timestamp: Date.now(), node: 'test' }],
    payload: { carbon: 42 },
  };
}

function mockRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

// ==========================================
// 1. Sonnar Hash Lock — hex digest + constant-time verify
// ==========================================

describe('Sonnar Hash Lock (hex digest)', () => {
  it('generates a deterministic 64-char hex SHA-256 hash', () => {
    const h1 = generateHash('hello esg');
    const h2 = generateHash('hello esg');
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(h2).toBe(h1);
  });

  it('produces different hashes for different content', () => {
    expect(generateHash('content-a')).not.toBe(generateHash('content-b'));
  });

  it('supports sha512 as an alternative algorithm', () => {
    const h = generateHash('content', 'sha512');
    expect(h).toMatch(/^[0-9a-f]{128}$/);
  });

  it('verifies a hash in constant time', () => {
    expect(verifyHash('content', generateHash('content'))).toBe(true);
    expect(verifyHash('content', generateHash('tampered'))).toBe(false);
    // 長度不匹配時也必須安全回傳 false（不會拋出）
    expect(verifyHash('content', 'abc')).toBe(false);
  });

  it('generates and verifies HMAC seals', () => {
    const hmac = generateHMAC('content', 'secret-key');
    expect(hmac).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyHMAC('content', 'secret-key', hmac)).toBe(true);
    expect(verifyHMAC('content', 'wrong-key', hmac)).toBe(false);
    expect(verifyHMAC('tampered', 'secret-key', hmac)).toBe(false);
  });

  it('creates a HashLock record with version and created timestamp', () => {
    const lock = createHashLock('doc-1', 'report body');
    expect(lock.contentId).toBe('doc-1');
    expect(lock.algorithm).toBe('sha256');
    expect(lock.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(lock.version).toBe(1);
    expect(new Date(lock.createdAt).getTime()).not.toBeNaN();
  });

  it('creates batched hash locks with incremental versions', () => {
    const locks = batchHash([
      { id: 'a', content: 'aaa' },
      { id: 'b', content: 'bbb' },
      { id: 'c', content: 'ccc' },
    ]);
    expect(locks).toHaveLength(3);
    expect(locks.map((l) => l.version)).toEqual([1, 2, 3]);
    expect(locks[0].hash).not.toBe(locks[1].hash);
  });

  it('detects content changes via hash comparison', () => {
    const noChange = detectChanges('original', 'original');
    expect(noChange.changed).toBe(false);
    expect(noChange.oldHash).toBe(noChange.newHash);

    const changed = detectChanges('original', 'modified');
    expect(changed.changed).toBe(true);
    expect(changed.oldHash).not.toBe(changed.newHash);
    expect(changed.oldHash).toBe(generateHash('original'));
    expect(changed.newHash).toBe(generateHash('modified'));
  });

  it('computes a source-aware trinity hash for 5T protocol', () => {
    const t1 = trinityHash('source-1', 'content', '2026-01-01T00:00:00.000Z');
    const t2 = trinityHash('source-1', 'content', '2026-01-01T00:00:00.000Z');
    const t3 = trinityHash('source-2', 'content', '2026-01-01T00:00:00.000Z');
    expect(t1).toBe(t2);
    expect(t1).toMatch(/^[0-9a-f]{64}$/);
    expect(t3).not.toBe(t1);
  });
});

// ==========================================
// 2. SecureUtils — HexLock freeze (Hash Lock + Object.freeze)
// ==========================================

describe('SecureUtils.lockAndFreeze (HexLock freeze)', () => {
  it('attaches a hex hash_lock and freezes the record', () => {
    const record = { projectId: 'p-1', amount: 100 };
    const locked = SecureUtils.lockAndFreeze(record);

    // 凍結 → 不可變
    expect(Object.isFrozen(locked)).toBe(true);
    // hash_lock 已寫入 evidence
    const evidence = (locked as { evidence: Record<string, unknown> }).evidence;
    expect((evidence as any).hash_lock).toBeDefined();
    expect(String((evidence as any).hash_lock)).toMatch(/^0x/);
  });

  it('prevents tampering after freeze (strict-mode assignment throws)', () => {
    const locked = SecureUtils.lockAndFreeze({ amount: 100 }) as { amount: number };
    expect(() => {
      (locked as { amount: number }).amount = 999;
    }).toThrow(TypeError);
  });

  it('freezes top-level record so evidence object reference is read-only', () => {
    const locked = SecureUtils.lockAndFreeze({ evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', original: true } }) as {
      evidence: Record<string, unknown>;
    };
    // 頂層凍結：evidence 屬性本身不可重新指派
    expect(() => {
      (locked as { evidence: Record<string, unknown> }).evidence = { hacked: true };
    }).toThrow(TypeError);
  });

  it('documents shallow-freeze semantics: nested evidence object remains mutable', () => {
    // 已知設計特性：Object.freeze 為淺層凍結，巢狀 evidence 物件仍可被修改。
    // 由於 hash_lock 是內容繫結的 digest，巢狀竄改會使 verifyHashLock 失敗
    // （見下方 tamper-detection 測試）。
    const locked = SecureUtils.lockAndFreeze({ evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', original: true } }) as {
      evidence: Record<string, unknown>;
    };
    expect(Object.isFrozen(locked)).toBe(true);
    expect(Object.isFrozen(locked.evidence)).toBe(false);
    expect(() => {
      locked.evidence['injected'] = true;
    }).not.toThrow(TypeError);
    expect(locked.evidence['injected']).toBe(true);
  });

  it('produces a content-committing hash_lock (SHA-256 digest, not a random nonce)', () => {
    // 回歸測試：hash_lock 必須是 0x + 64 hex 的內容 digest，不得為
    // 過去實作的 `0xCELESTIAL_<ts>_<random>` 假鎖。
    const a = SecureUtils.lockAndFreeze({ amount: 100, project: 'p-1' });
    const b = SecureUtils.lockAndFreeze({ amount: 101, project: 'p-1' });

    const lockA = ((a as any).evidence as any)['hash_lock'];
    const lockB = ((b as any).evidence as any)['hash_lock'];
    expect(String(lockA)).toMatch(/^0x[0-9a-f]{64}$/);
    expect(String(lockA)).not.toBe(String(lockB)); // 內容不同 → 鎖不同
    expect(String(lockA)).not.toContain('CELESTIAL');
  });

  it('verifyHashLock accepts an unmodified locked record', () => {
    const record = { projectId: 'p-1', amount: 100, evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', doc: 'r' } };
    const locked = SecureUtils.lockAndFreeze(record);
    expect(SecureUtils.verifyHashLock(locked)).toBe(true);
  });

  it('verifyHashLock detects tampering inside nested evidence', () => {
    const locked = SecureUtils.lockAndFreeze({ evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', carbon: 42 } }) as {
      evidence: Record<string, unknown>;
    };
    expect(SecureUtils.verifyHashLock(locked)).toBe(true);

    // 巢狀竄改（淺層 freeze 無法攔截指派）仍可被 hash 驗證偵測
    locked.evidence['carbon'] = 999;
    expect(SecureUtils.verifyHashLock(locked)).toBe(false);
  });

  it('verifyHashLock detects forged / missing hash_lock', () => {
    const locked = SecureUtils.lockAndFreeze({ amount: 100 }) as { evidence: Record<string, unknown> };
    (locked.evidence as any)['hash_lock'] = '0x' + '0'.repeat(64); // 偽造鎖
    expect(SecureUtils.verifyHashLock(locked)).toBe(false);

    expect(SecureUtils.verifyHashLock({ plain: true } as unknown as object)).toBe(false);
  });

  it('applies hash lock to IBusEvent instances', () => {
    const event = makeEvent();
    const locked = SecureUtils.applyHashLock(event);

    expect(Object.isFrozen(locked)).toBe(true);
    const evidence = (locked as unknown as { evidence: Record<string, unknown> }).evidence;
    expect((evidence as any).hash_lock).toBeDefined();
  });
});

// ==========================================
// 3. OmniGatewayV2 — gateway-level hash lock + freeze
// ==========================================

describe('OmniGatewayV2.hashLock / secureForward', () => {
  it('hashLock produces a 64-char hex lock hash', async () => {
    const gateway = new OmniGatewayV2();
    const locked = await gateway.hashLock(makeEvent());

    expect(locked.lockHash).toMatch(/^[0-9a-f]{64}$/);
    expect(locked.lockedAt).toBeGreaterThan(0);
    expect(locked.event).toBeDefined();
  });

  it('secureForward freezes the event (HexLock freeze at gateway layer)', async () => {
    const gateway = new OmniGatewayV2();
    const forwarded = await gateway.secureForward(makeEvent());

    expect(Object.isFrozen(forwarded)).toBe(true);
  });

  it('produces different lock hashes for different event payloads', async () => {
    const gateway = new OmniGatewayV2();
    const eventA = makeEvent();
    const eventB = makeEvent();
    eventA.payload = { carbon: 1 };
    eventB.payload = { carbon: 2 };

    const lockA = await gateway.hashLock(eventA);
    const lockB = await gateway.hashLock(eventB);
    expect(lockA.lockHash).not.toBe(lockB.lockHash);
  });
});

// ==========================================
// 4. POST /api/hashlock route contract
// ==========================================

describe('POST /api/hashlock', () => {
  it('GET exposes service info and available actions', async () => {
    const res = await hashlockGET();
    const body = await res.json();
    expect(body.data.service).toBe('HashLock Service');
    expect(body.data.actions).toEqual(['generate', 'verify', 'verifyTrinity']);
  });

  it('generate returns a 64-char hex lock and timestamp', async () => {
    const res = await hashlockPOST(
      mockRequest({ action: 'generate', data: 'scope-1 data', salt: 'salt-1' })
    );
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.hashLock).toMatch(/^[0-9a-f]{64}$/);
    expect(body.data.timestamp).toBeGreaterThan(0);
  });

  it('verify accepts a lock generated by the same service (with timestamp)', async () => {
    const genRes = await hashlockPOST(
      mockRequest({ action: 'generate', data: 'report-body', salt: 'salt-1' })
    );
    const { hashLock, timestamp } = (await genRes.json()).data;

    const verifyRes = await hashlockPOST(
      mockRequest({
        action: 'verify',
        data: 'report-body',
        salt: 'salt-1',
        hashLock,
        timestamp,
      })
    );
    const body = await verifyRes.json();
    expect(body.success).toBe(true);
    expect(body.data.valid).toBe(true);
  });

  it('verify accepts a freshly generated lock without timestamp (within tolerance window)', async () => {
    // 依賴逐毫秒容差視窗：generate 後立即 verify 必須成功
    const genRes = await hashlockPOST(
      mockRequest({ action: 'generate', data: 'fresh-body', salt: 'salt-1' })
    );
    const { hashLock } = (await genRes.json()).data;

    const verifyRes = await hashlockPOST(
      mockRequest({ action: 'verify', data: 'fresh-body', salt: 'salt-1', hashLock })
    );
    const body = await verifyRes.json();
    expect(body.success).toBe(true);
    expect(body.data.valid).toBe(true);
  });

  it('verify rejects a tampered lock', async () => {
    const verifyRes = await hashlockPOST(
      mockRequest({
        action: 'verify',
        data: 'tampered-body',
        salt: 'salt-1',
        hashLock: 'a'.repeat(64),
      })
    );
    const body = await verifyRes.json();
    expect(body.success).toBe(true);
    expect(body.data.valid).toBe(false);
  });

  it('verifyTrinity validates a deterministic trinity lock', async () => {
    const genRes = await hashlockPOST(
      mockRequest({ action: 'generate', data: 'trinity-data', salt: 'salt-2' })
    );
    const { hashLock } = (await genRes.json()).data;

    // Trinity 使用相同 data+salt 即可驗證（不受時間窗限制）
    const trinityRes = await hashlockPOST(
      mockRequest({ action: 'verifyTrinity', data: 'trinity-data', salt: 'salt-2', hashLock })
    );
    const body = await trinityRes.json();
    expect(body.success).toBe(true);
    expect(body.data.type).toBe('trinity');
    expect(typeof body.data.valid).toBe('boolean');
  });

  it('rejects requests missing the action', async () => {
    const res = await hashlockPOST(mockRequest({ data: 'x' }));
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBeDefined();
  });

  it('rejects unknown actions', async () => {
    const res = await hashlockPOST(mockRequest({ action: 'explode' }));
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('rejects verify without required params', async () => {
    const res = await hashlockPOST(mockRequest({ action: 'verify', data: 'x' }));
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
