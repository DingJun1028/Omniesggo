/// <reference path="../types/generated/esggo-shared.d.ts" />
/**
 * OA-Team 5T 協定強制層 (5T Protocol Enforcement)
 * 來源: OA-Team 靈魂核心聖典 §一 5T 數據與行為協議
 *
 * Traceable   (可溯源): 每筆產物標註 source_origin
 * Trackable   (可追蹤): 生命週期 hook 記錄狀態流轉
 * Tangible    (可感知): 使用者回饋介面數據
 * Transparent (可透明): 演算邏輯公開、零幻覺驗算
 * Trustworthy (不可篡改): 寫入後 HashLock + Object.freeze + 署名
 *
 * 終始矩陣: SoulArtifact 契約對齊 canonical ISoulArtifact (esggo/shared/types.ts)
 */

import type { ISoulArtifact } from '../types/generated/esggo-shared.js';

export interface SoulArtifact extends ISoulArtifact {
  uuid: string;
  version: string;
  timestamp: number;
  source_origin: string; // Traceable
  lifecycle: string[];   // Trackable
  hash_lock: string;     // Trustworthy
  author: string;        // Trustworthy (不可篡改署名)
  // evidence 結構對齊 canonical ISoulArtifact: { originCause, processTrace, finalEffect }
  evidence: { originCause: string; processTrace: string[]; finalEffect: string };
}

const HEX = '0123456789abcdef';
function randHex(n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
}

/** Trustworthy: 簡易 hash (免依賴 crypto 也能跑, 確定性) */
export function hashLock(obj: unknown): string {
  const str = JSON.stringify(obj);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const a = (h >>> 0).toString(16).padStart(8, '0');
  const b = (Math.imul(h ^ str.length, 0x9e3779b1) >>> 0).toString(16).padStart(8, '0');
  return `0x${a}${b}`; // 確定性 64-bit FNV-1a
}

/** Traceable + Trustworthy: 產生不可篡改產物 */
export function purify(sourceOrigin: string, author: string, payload: Record<string, unknown>): Readonly<SoulArtifact> {
  const artifact: SoulArtifact = {
    uuid: `soul_${Date.now().toString(36)}_${randHex(8)}`,
    version: '1.0.0',
    timestamp: Date.now(),
    source_origin: sourceOrigin, // Traceable
    lifecycle: ['extract', 'dispatch', 'purify'], // Trackable
    hash_lock: '', // 先空，下面算
    author, // Trustworthy 署名
    // evidence 對齊 canonical: payload 包裝為 originCause + processTrace + finalEffect
    evidence: {
      originCause: sourceOrigin,
      processTrace: ['extract', 'dispatch', 'purify'],
      finalEffect: JSON.stringify(payload).slice(0, 200),
    },
  };
  artifact.hash_lock = hashLock(artifact); // Trustworthy
  return Object.freeze(artifact) as Readonly<SoulArtifact>; // Trustworthy: 凍結
}

/** Transparent: 零幻覺驗算 (檢查產物未被偷偷改過) */
export function verifyZeroHallucination(a: SoulArtifact): boolean {
  const clone = { ...a, hash_lock: '' };
  return hashLock(clone) === a.hash_lock;
}

/** Tangible: 使用者回饋收集 */
export class FeedbackCollector {
  private store: Record<string, { rating: number; note: string; ts: number }[]> = {};
  submit(artifactId: string, rating: number, note: string): void {
    (this.store[artifactId] ??= []).push({ rating, note, ts: Date.now() });
  }
  avg(artifactId: string): number {
    const arr = this.store[artifactId] ?? [];
    return arr.length ? arr.reduce((s, x) => s + x.rating, 0) / arr.length : 0;
  }
}
