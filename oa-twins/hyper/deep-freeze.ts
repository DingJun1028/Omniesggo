/**
 * 5T-Trustworthy：遞迴凍結（deep freeze）
 *
 * 為何需要（v0.5.0-hyper 實測推翻的宣告）：
 * 宣告以 `Object.freeze(rawState)` 宣稱「核心禁區：數據寫入後即刻執行
 * Object.freeze()」。實測證偽 —— `Object.freeze` 僅凍結**頂層**物件，
 * 其巢狀屬性物件仍可自由改寫：
 *
 *   const s = Object.freeze({ governance: { hash_lock: 'abc' } });
 *   s.governance.hash_lock = 'HIJACKED';   // 成功，無 TypeError
 *
 * 在宣告的 HyperAwakenedState 結構中，`governance.hash_lock` 與
 * `twins.sync_ratio` 皆位於巢狀層，故單層 freeze 恰好放行了「改掉鎖定值
 * 讓竄改無法被驗證發現」這條路徑 —— 即 Trustworthy 的失效路徑。
 *
 * 注意：嚴格模式（ESM / TS 編譯產物）下對已凍結物件賦值會拋 TypeError，
 * 而非靜默失敗。故本模組的防護不能只依賴 freeze，必須搭配
 * `verifyHyperAwakening()` 的再計算比對（見 state.ts）。
 */

/**
 * 遞迴凍結物件及其所有可達的巢狀物件。
 *
 * - 已凍結者短路返回，避免重複遍歷
 * - 以 WeakSet 追蹤棧上節點，循環參照不會無限遞迴
 * - 回傳同一個引用（in-place），故 `deepFreeze(o) === o`
 */
export function deepFreeze<T>(value: T): T {
  // 只凍結物件；原始值（number/string/boolean/null/undefined/bigint）無屬性可寫
  if (value === null || typeof value !== 'object') return value;

  // 巢狀物件可能共享同一引用（DAG），已凍結即代表其子樹已處理完畢
  if (Object.isFrozen(value)) return value;

  // 先凍結自身，再下探：即使子樹中出現指向父層的循環，也不會無限遞迴
  Object.freeze(value);

  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }

  return value;
}

/**
 * 診斷用：回傳物件圖中**尚未凍結**的所有可達路徑。
 *
 * 存在意義：讓「已宣告不可篡改」的狀態能被外部逐一檢查，而不是靠信任
 * 呼叫端遵守約定。`verifyHyperAwakening()` 以此為其中一項檢查。
 */
export function unfrozenPaths(root: unknown, basePath = '$'): string[] {
  const found: string[] = [];
  const seen = new WeakSet<object>();

  const walk = (node: unknown, path: string): void => {
    if (node === null || typeof node !== 'object') return;
    if (seen.has(node as object)) return;
    seen.add(node as object);

    if (!Object.isFrozen(node)) found.push(path);
    for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
      walk(val, `${path}.${key}`);
    }
  };

  walk(root, basePath);
  return found;
}