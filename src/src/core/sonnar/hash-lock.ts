// ============================================================
// Hash Lock — Content integrity & change detection
// src/core/sonnar/hash-lock.ts
// Uses SHA-256 (Node.js crypto built-in, zero deps)
// ============================================================

import * as crypto from 'crypto';

export interface HashLock {
  contentId: string;
  hash: string;
  algorithm: 'sha256' | 'sha512';
  createdAt: string;
  version: number;
}

export interface VersionHistory {
  contentId: string;
  versions: HashLock[];
  currentVersion: number;
}

/**
 * Generate content hash (SHA-256 by default)
 */
export function generateHash(content: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
  return crypto.createHash(algorithm).update(content).digest('hex');
}

/**
 * Generate HMAC (requires a secret key — used for tamper-proof seals)
 */
export function generateHMAC(content: string, key: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
  return crypto.createHmac(algorithm, key).update(content).digest('hex');
}

/**
 * Constant-time comparison (prevents timing attacks)
 */
export function verifyHash(content: string, expectedHash: string): boolean {
  const actualHash = generateHash(content);
  if (actualHash.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
}

/**
 * Verify HMAC in constant time
 */
export function verifyHMAC(content: string, key: string, expectedHmac: string): boolean {
  const actualHmac = generateHMAC(content, key);
  if (actualHmac.length !== expectedHmac.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actualHmac), Buffer.from(expectedHmac));
}

/**
 * Create a new HashLock for a piece of content
 */
export function createHashLock(contentId: string, content: string, version = 1): HashLock {
  return {
    contentId,
    hash: generateHash(content),
    algorithm: 'sha256',
    createdAt: new Date().toISOString(),
    version,
  };
}

/**
 * Batch hash for multiple items
 */
export function batchHash(items: Array<{ id: string; content: string }>): HashLock[] {
  return items.map((item, i) => createHashLock(item.id, item.content, i + 1));
}

/**
 * Detect changes between two content versions
 */
export function detectChanges(oldContent: string, newContent: string): {
  changed: boolean;
  oldHash: string;
  newHash: string;
} {
  const oldHash = generateHash(oldContent);
  const newHash = generateHash(newContent);
  return {
    changed: oldHash !== newHash,
    oldHash,
    newHash,
  };
}

/**
 * Trinity Hash — combines source + content + timestamp for 5T protocol
 */
export function trinityHash(sourceId: string, content: string, timestamp?: string): string {
  const salt = timestamp || new Date().toISOString();
  return generateHash(`${sourceId}::${content}::${salt}`);
}
