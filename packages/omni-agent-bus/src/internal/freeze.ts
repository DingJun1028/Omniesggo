/**
 * internal/freeze — R4/R5 共用內部工具
 *
 * 冪等重放 (idempotent-replay) 與狀態快照 (state-snapshot) 共用的
 * 深複製 / 深凍結原語, 抽出為單一實作以維持 DRY 與 SonarCloud 新代碼重複率門檻。
 * 模組私有 (internal), 不對外匯出於 package index。
 *
 * 5T 對應: Trustworthy (深凍結不可篡改語義與 @esggo/omni-core deep-freeze R1 對齊)
 */
/** 深複製 (Node 17+ 內建 structuredClone, 訊息為可結構化克隆載荷) */
export function clone<T>(x: T): T {
  return structuredClone(x);
}

/** 遞迴深凍結 */
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
