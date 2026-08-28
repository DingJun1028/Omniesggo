import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateHashLock } from '../index';

/**
 * §18 跨語言同構測試: TypeScript generateHashLock 必須與 Python
 * src.core.verification.generate_hash_lock / src.incremental.gate.generate_hash_lock
 * 產出完全相同的 SHA-256 向量。
 *
 * 向量檔來自 tests/hashlock_vectors.json (由 Python emit_cross_lang_vectors 產生).
 */
describe('§18 cross-language Hash Lock isomorphism (TS <-> Python)', () => {
  const vectorsPath = resolve(__dirname, '../../../tests/hashlock_vectors.json');
  const vectors = JSON.parse(readFileSync(vectorsPath, 'utf-8')) as Array<{
    source: string;
    content: string;
    timestamp: number;
    expected_hash: string;
  }>;

  it('loads cross-lang vectors from the Python-generated fixture', () => {
    expect(Array.isArray(vectors)).toBe(true);
    expect(vectors.length).toBeGreaterThan(0);
    for (const v of vectors) {
      expect(v.expected_hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('TS generateHashLock == Python expected_hash for every vector', () => {
    for (const v of vectors) {
      const got = generateHashLock(v.source, v.content, v.timestamp);
      expect(got).toBe(v.expected_hash);
    }
  });

  it('matches the literal §18 algorithm sha256(source|content|ts)', () => {
    const { createHash } = require('node:crypto');
    for (const v of vectors) {
      const payload = `${v.source}|${v.content}|${v.timestamp}`;
      const expected = createHash('sha256').update(payload, 'utf-8').digest('hex');
      expect(generateHashLock(v.source, v.content, v.timestamp)).toBe(expected);
    }
  });
});
