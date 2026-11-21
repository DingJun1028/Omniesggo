/**
 * CompressionEngine — 輕量壓縮 (對齊 §12.0 Compression: gzip 70% 體積減少)
 *
 * 無作: 壓縮失敗回傳原始 JSON buffer (graceful 降級)
 * 圓通: 用 node:zlib gzip 實作, 不依賴外部套件
 * 無礙: 全程同步 API (小 payload), 大 payload 用非同步版本
 */
import { gzipSync, gunzipSync } from 'node:zlib';

export class CompressionEngine {
  /** 壓縮: 任何可 JSON 序列化物件 → gzip Buffer */
  compress(data: unknown): Buffer {
    try {
      const json = JSON.stringify(data);
      return gzipSync(Buffer.from(json, 'utf8'));
    } catch {
      // 無作: 降級為純 JSON buffer
      return Buffer.from(typeof data === 'string' ? data : JSON.stringify(data ?? ''), 'utf8');
    }
  }

  /** 解壓: gzip Buffer → 原始物件 */
  decompress(buf: Buffer): unknown {
    try {
      const gunzipped = gunzipSync(buf).toString('utf8');
      return JSON.parse(gunzipped);
    } catch {
      try {
        return buf.toString('utf8');
      } catch {
        return undefined;
      }
    }
  }

  /** 估算壓縮率 (0~1, 越大越好) */
  ratio(original: unknown, compressed: Buffer): number {
    const origBytes = Buffer.byteLength(
      typeof original === 'string' ? original : JSON.stringify(original ?? ''),
      'utf8'
    );
    if (origBytes === 0) return 0;
    return 1 - compressed.length / origBytes;
  }
}
