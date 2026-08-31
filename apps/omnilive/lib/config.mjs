// ============================================================
// OmniLive — 設定層 (集中管理環境變數)
// 避免分散設定造成啟動失敗 (驗收: 設定項目有明確說明)。
// @ts-check
// ============================================================

const AUDIO_SOURCES = ['mic', 'system-display', 'device', 'caption'];

/**
 * 讀取並驗證設定；必要設定缺漏時拋 CONFIG_MISSING。
 * @returns {{
 *   port: number,
 *   audioSource: string,
 *   audioDeviceId: string,
 *   sttPort: number,
 *   sttTimeoutMs: number,
 *   sttLang: string,
 *   from: string,
 *   to: string,
 *   translateTimeoutMs: number,
 *   translateRetries: number,
 *   myMemoryEmail: string,
 *   libretranslateUrl: string,
 *   subtitleMaxLines: number,
 *   subtitleTtlMs: number,
 *   geminiApiKey: string,
 *   geminiModel: string,
 *   autoStartStt: boolean,
 *   sttModel: string,
 *   sttDevice: string,
 *   sttCompute: string,
 *   roomPasswordEnabled: boolean,
 *   roomTtlMs: number,
 *   roomCleanupIntervalMs: number,
 * }}
 */
export function loadConfig() {
  const audioSource = (process.env.OMNILIVE_AUDIO_SOURCE || 'system-display').trim();
  if (!AUDIO_SOURCES.includes(audioSource)) {
    throw new Error(
      `CONFIG_MISSING: OMNILIVE_AUDIO_SOURCE="${audioSource}" 不合法，必須是 ${AUDIO_SOURCES.join(' | ')}`
    );
  }
  const from = (process.env.OMNILIVE_FROM || 'auto').trim();
  const to = (process.env.OMNILIVE_TO || 'en').trim();
  if (!from || !to) {
    throw new Error('CONFIG_MISSING: OMNILIVE_FROM 與 OMNILIVE_TO 皆不可為空');
  }
  return {
    port: Number(process.env.PORT || 8795),
    audioSource,
    audioDeviceId: (process.env.AUDIO_DEVICE_ID || '').trim(),
    sttPort: Number(process.env.STT_PORT || 8791),
    sttTimeoutMs: Number(process.env.STT_TIMEOUT_MS || 30000),
    sttLang: (process.env.STT_LANG || 'auto').trim(),
    from,
    to,
    translateTimeoutMs: Number(process.env.TRANSLATE_TIMEOUT_MS || 8000),
    translateRetries: Number(process.env.TRANSLATE_RETRIES || 2),
    myMemoryEmail: (process.env.MYMEMORY_EMAIL || 'esggo.translate@gmail.com').trim(),
    libretranslateUrl: (process.env.LIBRETRANSLATE_URL || '').trim(),
    subtitleMaxLines: Number(process.env.SUBTITLE_MAX_LINES || 40),
    subtitleTtlMs: Number(process.env.SUBTITLE_TTL_MS || 12000),
    geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
    geminiModel: (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim(),
    autoStartStt: (process.env.OMNILIVE_AUTOSTART_STT || 'true').toLowerCase() !== 'false',
    sttModel: (process.env.WHISPER_MODEL || 'tiny').trim(),
    sttDevice: (process.env.WHISPER_DEVICE || 'cpu').trim(),
    sttCompute: (process.env.WHISPER_COMPUTE || 'int8').trim(),
    roomPasswordEnabled: (process.env.OMNILIVE_ROOM_PASSWORD || '').trim().length > 0,
    roomTtlMs: Number(process.env.OMNILIVE_ROOM_TTL_MS || 2 * 60 * 60 * 1000),
    roomCleanupIntervalMs: Number(process.env.OMNILIVE_ROOM_CLEANUP_MS || 5 * 60 * 1000),
  };
}

/** 設定層公開快照 (供 /config 端點與前端初始化) */
export function publicConfig(cfg) {
  return {
    audioSource: cfg.audioSource,
    audioDeviceId: cfg.audioDeviceId ? '<set>' : '',
    sttPort: cfg.sttPort,
    sttLang: cfg.sttLang,
    from: cfg.from,
    to: cfg.to,
    subtitleMaxLines: cfg.subtitleMaxLines,
    subtitleTtlMs: cfg.subtitleTtlMs,
    geminiEnabled: Boolean(cfg.geminiApiKey),
    roomPasswordEnabled: cfg.roomPasswordEnabled,
    roomTtlMs: cfg.roomTtlMs,
    appVersion: '1.0.0',
  };
}
