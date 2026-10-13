// ============================================================
// OmniLive — 錯誤處理層
// 集中定義可定位錯誤代碼，對應 spec.md §錯誤處理。
// 5T: Trustworthy — 錯誤訊息帶 code + context，便於定位。
// @ts-check
// ============================================================

/**
 * 錯誤代碼分類 (對應驗收條件「錯誤可定位」)
 *  AUDIO_SOURCE_MISSING  音訊來源不存在 / 裝置未取得
 *  STT_UNAVAILABLE       本地辨識微服務未啟動或呼叫失敗
 *  STT_EMPTY             音訊靜音 / 無可辨識文字
 *  TRANSLATE_TIMEOUT     翻譯超時
 *  TRANSLATE_FAILED      所有翻譯引擎皆失敗 (回落原文)
 *  CONFIG_MISSING        必要設定缺漏
 *  SUBTITLE_RENDER       字幕渲染中斷 (播放器端)
 */
export class OmniLiveError extends Error {
  /** @param {string} code @param {string} message @param {any} [context] */
  constructor(code, message, context) {
    super(message);
    this.name = 'OmniLiveError';
    this.code = code;
    this.context = context;
    this.retryable = code === 'STT_UNAVAILABLE' || code === 'TRANSLATE_TIMEOUT';
  }
}

/**
 * 由任意異常轉為帶 code 的 OmniLiveError (防止裸 throw 造成訊息不可讀)
 * @param {unknown} err
 * @param {string} fallbackCode
 * @returns {OmniLiveError}
 */
export function toOmniLiveError(err, fallbackCode = 'UNKNOWN') {
  if (err instanceof OmniLiveError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  if (/ECONNREFUSED|fetch failed|STT service unavailable/i.test(msg)) {
    return new OmniLiveError('STT_UNAVAILABLE', 'STT 微服務未啟動或不可達: ' + msg);
  }
  if (/timeout/i.test(msg)) {
    return new OmniLiveError('TRANSLATE_TIMEOUT', '服務逾時: ' + msg);
  }
  return new OmniLiveError(fallbackCode, msg);
}

/**
 * 將錯誤轉為 JSON (SSE/REST 共用, 統一錯誤形狀)
 * @param {unknown} err
 * @returns {{error: string, code: string, retryable: boolean, context?: any}}
 */
export function errorToJson(err) {
  const e = toOmniLiveError(err);
  return { error: e.message, code: e.code, retryable: e.retryable, context: e.context };
}
