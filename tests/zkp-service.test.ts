/**
 * 5T Traceable — ZKPService 單元驗證
 * 直接測 src/lib/zkp-service 的 seal/verify/getProofs/getStats，
 * 繞過 NextResponse body 解析限制，純驗證零知識證明邏輯。
 */

import { describe, it, expect } from 'vitest';
import { ZKPService } from '../src/lib/zkp-service';

describe('ZKPService — 零知識證明邏輯', () => {
  it('seal 產生 hashLock 字串', () => {
    const result = ZKPService.seal('doc-123', 'secret-value');
    expect(result).toBeDefined();
    expect(typeof result.hashLock).toBe('string');
    expect(result.hashLock.length).toBeGreaterThan(0);
  });

  it('verify 有效 hashLock → valid: true', () => {
    const sealed = ZKPService.seal('doc-v', 'v');
    const res = ZKPService.verify('doc-v', sealed.hashLock);
    expect(res.valid).toBe(true);
  });

  it('verify 錯誤 hashLock → valid: false', () => {
    const res = ZKPService.verify('doc-v', '0xDEADBEEF');
    expect(res.valid).toBe(false);
  });

  it('getProofs 回陣列', () => {
    ZKPService.seal('doc-p', 'p');
    const proofs = ZKPService.getProofs('doc-p');
    expect(Array.isArray(proofs)).toBe(true);
  });

  it('getStats 回物件', () => {
    const stats = ZKPService.getStats();
    expect(typeof stats).toBe('object');
  });
});
