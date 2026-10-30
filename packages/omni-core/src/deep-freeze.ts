/**
 * deepFreeze — 核心禁區深凍結 (R1)
 *
 * Object.freeze 僅為淺凍結: evidence / lifecycle 內層物件仍可被篡改,
 * 與 5T-Trustworthy「不可篡改」宣告矛盾。deepFreeze 遞迴鎖定整棵物件樹,
 * 補齊 sealComponentCore 淺凍結之後的殘餘缺口。
 *
 * 5T 對應: Trustworthy (深層不可篡改) / Tangible (凍結結果可驗證: Object.isFrozen)
 */
export function deepFreeze<T>(obj: T): T {
  if (obj !== null && (typeof obj === 'object' || typeof obj === 'function')) {
    Object.freeze(obj);
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const value = (obj as Record<string, unknown>)[key];
      if (value !== null && typeof value === 'object') {
        deepFreeze(value);
      }
    }
  }
  return obj;
}
