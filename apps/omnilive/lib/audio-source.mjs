// ============================================================
// OmniLive — 輸入層 (音訊來源模式定義)
// 不實作瀏覽器端 getDisplayMedia/getUserMedia (那在播放器 UI 側);
// 此層負責「定義支援模式 + 模式合法性驗證 + 產生人類可讀描述」，
// 作為 Zoom 場景下音訊接入方案的單一真源 (spec.md §輸入來源)。
// @ts-check
// ============================================================

export const AUDIO_SOURCES = /** @type {const} */ (['mic', 'system-display', 'device', 'caption']);

/**
 * @param {string} source
 * @returns {boolean}
 */
export function isValidSource(source) {
  return AUDIO_SOURCES.includes(/** @type {any} */ (source));
}

/**
 * 產生音訊來源的人類可讀描述 (供 UI 提示與設定驗證訊息)。
 * @param {string} source
 * @param {string} [deviceId]
 * @returns {{id: string, label: string, hint: string, browserApi: string}}
 */
export function describeSource(source, deviceId = '') {
  switch (source) {
    case 'mic':
      return {
        id: 'mic',
        label: '本機麥克風',
        hint: '對著麥克風講話即可收音。適合單人講者。',
        browserApi: 'getUserMedia({audio:true})',
      };
    case 'system-display':
      return {
        id: 'system-display',
        label: '系統音訊 / Zoom 共享聲音',
        hint: '在瀏覽器「分享畫面」時勾選「分享聲音」，即可擷取 Zoom 會議音訊。推薦 Zoom 場景。',
        browserApi: 'getDisplayMedia({video:true, audio:true}) → audio track',
      };
    case 'device':
      return {
        id: 'device',
        label: '指定輸入裝置' + (deviceId ? ` (${deviceId})` : ''),
        hint: '選用特定音訊輸入裝置 (如虛擬音訊線 VB-Cable / BlackHole)。需配合 AUDIO_DEVICE_ID。',
        browserApi: 'getUserMedia({audio:{deviceId:{exact:...}}})',
      };
    case 'caption':
      return {
        id: 'caption',
        label: '手動字幕輸入 (兜底)',
        hint: '無法取得音訊權限或不支援擷音時，直接在播放器貼上文字，仍走雙語翻譯與字幕顯示流程。',
        browserApi: '無 (文字輸入)',
      };
    default:
      return { id: source, label: '未知來源', hint: '請檢查 OMNILIVE_AUDIO_SOURCE 設定。', browserApi: 'n/a' };
  }
}

/**
 * 驗證音訊來源設定；非法時拋錯 (供 server 啟動時快速失敗)。
 * @param {string} source
 * @param {string} [deviceId]
 */
export function assertSource(source, deviceId = '') {
  if (!isValidSource(source)) {
    throw new Error(
      `AUDIO_SOURCE_MISSING: 不支援的音訊來源 "${source}"。支援: ${AUDIO_SOURCES.join(' | ')}`
    );
  }
  if (source === 'device' && !deviceId) {
    throw new Error('AUDIO_SOURCE_MISSING: source=device 需要設定 AUDIO_DEVICE_ID');
  }
}
