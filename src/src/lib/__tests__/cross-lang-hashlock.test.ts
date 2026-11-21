import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { FiveTHashLock } from '../five-t-protocol';

/**
 * §18 跨語言 Hash Lock 一致性測試。
 * 向量由 Python src/core/verification.py:emit_cross_lang_vectors() 產生，
 * 本測試用 TS FiveTHashLock.generate 重算並斷言字節級一致，
 * 證明 Python 與 TS 兩端的 Trustworthy 不可篡改契約同構。
 */
const VECTOR_PATH = join(process.cwd(), 'tests', 'hashlock_vectors.json');

interface Vector {
  source: string;
  content: string;
  timestamp: number;
  expected_hash: string;
}

const vectors: Vector[] = JSON.parse(readFileSync(VECTOR_PATH, 'utf-8'));

describe('§18 跨語言 Hash Lock 一致性 (Python ⇄ TS)', () => {
  it('loads cross-lang vectors from Python emitter', () => {
    expect(vectors.length).toBeGreaterThan(0);
    for (const v of vectors) {
      expect(v.expected_hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  for (const v of vectors) {
    it(`hash一致: ${v.source} / ${v.content.slice(0, 12)}…`, () => {
      const tsHash = FiveTHashLock.generate(v.source, v.content, v.timestamp);
      expect(tsHash).toBe(v.expected_hash);
      // 雙向：TS 產生的也應被 TS verify 接受（精確時間戳路徑）
      expect(FiveTHashLock.verify(v.source, v.content, tsHash, 0, v.timestamp)).toBe(true);
    });
  }

  it('tamper detection: 內容微變即 hash 失配 (Trustworthy 不可篡改)', () => {
    const v = vectors[0];
    const good = FiveTHashLock.generate(v.source, v.content, v.timestamp);
    const bad = FiveTHashLock.generate(v.source, v.content + 'X', v.timestamp);
    expect(good).toBe(v.expected_hash);
    expect(bad).not.toBe(v.expected_hash);
  });
});
