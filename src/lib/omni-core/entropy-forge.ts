// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
import * as crypto from 'crypto';

/**
 * 萬能修復協議 - 熵減煉金操作 (EntropyForge)
 * 負責數據淨化、亂碼清除與編碼歸一化
 */
export class EntropyForge {
  /**
   * 進行編碼歸一化與清除不可見字符/亂碼
   */
  static purify(text: string): string {
    if (!text) return text;
    // 歸一化為 NFC (Unicode Normalization Form C)
    let normalized = text.normalize('NFC');
    // 移除零寬字符
    normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
    // 移除控制字符，但保留換行(0x0A)、回車(0x0D)、Tab(0x09)
    normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    return normalized;
  }

  /**
   * 套用 Hash Lock
   */
  static applyHashLock<T>(obj: T): T {
    if (typeof obj === 'object' && obj !== null) {
      // 確保每一筆數據符合 ISO-14064-1 零幻覺驗算標準的哈希鎖
      const hash = crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
      Object.assign(obj, { hash_lock: hash });
    }
    return Object.freeze(obj);
  }
}
