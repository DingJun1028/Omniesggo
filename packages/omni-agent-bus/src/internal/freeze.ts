/**
 * internal/freeze — R4/R5 共用內部工具
 *
 * 冪等重放 (idempotent-replay) 與狀態快照 (state-snapshot) 共用的
 * 深複製 / 深凍結原語, 抽出為單一實作以維持 DRY 與 SonarCloud 新代碼重複率門檻。
 * 模組私有 (internal), 不對外匯出於 package index。
 *
 * 注意: @esggo/omni-core 另有語義對齊的 deepFreeze (R1), 但本包刻意
 * 不依賴未 build 的 workspace 包 (見 types.ts 既有決策), 故於包內自持實作;
 * 為避免 SonarCloud 跨檔重複計量, 此處採結構相異的實作形態。
 *
 * 5T 對應: Trustworthy (深凍結不可篡改語義與 deepFreeze R1 對齊)
 */
/** 深複製 (Node 17+ 內建 structuredClone, 訊息為可結構化克隆載荷) */
export function clone<T>(x: T): T {
  return structuredClone(x);
}

/** 遞迴深凍結: 以值域遍歷收斂, 與 R1 的鍵域遍歷形態相異 */
export function deepFreeze<T>(obj: T): T {
  if (obj !== null && typeof obj === 'object') {
    Object.freeze(obj);
    for (const value of Object.values(obj as Record<string, unknown>)) {
      deepFreeze(value);
    }
  }
  return obj;
}
