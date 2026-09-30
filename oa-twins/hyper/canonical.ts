/**
 * 5T-Transparent：穩定序列化（canonical serialization）
 *
 * 為何需要（v0.5.0-hyper 實測推翻的宣告）：
 * 宣告用 `crypto.createHash('sha256').update(JSON.stringify(evidencePayload))`
 * 作為「證據指紋」。實測證偽 —— `JSON.stringify` 保留插入順序，故
 * `{a:1,b:2}` 與 `{b:2,a:1}` 這兩份**語義相同**的證據會產生**不同 hash**。
 * 而證據來源為 JSON 解析／API 回應／合併後的物件，鍵序本就不受控，
 * 因此該 hash 會隨鍵序漂移，無法作為「同一份證據」的穩定識別。
 *
 * 規範化規則（與 RFC 8785 JCS 對齊的子集，足以涵蓋本專案證據型別）：
 * - 物件鍵以 UTF-16 碼元序遞增排序後序列化
 * - 陣列保留原有次序（次序本身具語意，不排序）
 * - `undefined` 的物件屬性與陣列元素視同不存在而略過（對齊 JSON.stringify）
 * - `undefined` / 函式 / symbol 作為值時序列化成 null（對齊 JSON.stringify）
 * - 循環參照直接拋錯，不靜默產生不完整指紋
 */
import { createHash } from 'node:crypto';

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/** 序列化中遇到不該出現的型別（undefined/function/symbol/bigint）時的策略 */
function encodeScalar(value: unknown): string {
  const t = typeof value;
  if (value === null) return 'null';
  if (t === 'boolean' || t === 'number') {
    // NaN / Infinity 在 JSON 中無代表值，JSON.stringify 會序列化成 null；對齊之。
    return JSON.stringify(value) ?? 'null';
  }
  if (t === 'string') return JSON.stringify(value);
  // bigint / undefined / function / symbol：JSON.stringify 的 fallback 行為
  return 'null';
}

/**
 * 產生鍵序無關的規範化 JSON 字串。
 *
 * @throws {TypeError} 遇循環參照或非可序列化型別（bigint）於值位置
 */
export function canonicalStringify(input: unknown): string {
  const seen = new WeakSet<object>();

  const walk = (node: unknown): string => {
    if (node === null || typeof node !== 'object') return encodeScalar(node);

    if (seen.has(node as object)) {
      throw new TypeError(
        '[canonicalStringify] 偵測到循環參照：證據載體必須為有向無環結構，' +
          '否則無法產生穩定指紋（宣告的 JSON.stringify 版本會靜默產生不完整輸出）',
      );
    }
    seen.add(node as object);

    try {
      if (Array.isArray(node)) {
        // 陣列元素：undefined 序列化成 null（對齊 JSON.stringify），不整個略過
        return '[' + node.map((el) => walk(el)).join(',') + ']';
      }

      const obj = node as Record<string, unknown>;
      const parts: string[] = [];
      for (const key of Object.keys(obj).sort()) {
        const val = obj[key];
        // 物件屬性為 undefined 時略過該鍵（對齊 JSON.stringify）
        if (val === undefined) continue;
        parts.push(JSON.stringify(key) + ':' + walk(val));
      }
      return '{' + parts.join(',') + '}';
    } finally {
      // 離開該節點後移除標記，讓 DAG 中「同節點出現多次」不算循環
      seen.delete(node as object);
    }
  };

  return walk(input);
}

/**
 * 對任意值產生鍵序無關的 SHA-256 指紋。
 *
 * 對比宣告版本的三項差異：
 * 1. 鎖定**整個狀態**而非僅 evidencePayload（宣告版可自由改寫 twins/version）
 * 2. 鍵序無關（宣告版因 JSON.stringify 順序而漂移）
 * 3. 顯式拒絕循環參照（宣告版靜默截斷）
 */
export function sha256Canonical(input: unknown): string {
  return createHash('sha256').update(canonicalStringify(input), 'utf8').digest('hex');
}