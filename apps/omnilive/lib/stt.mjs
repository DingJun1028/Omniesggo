// ============================================================
// OmniLive — 辨識層 (STT)
// 將即時音訊切片後送入本地 faster-whisper 微服務 (apps/stt)，
// 輸出逐段文字與語言標籤。5T: engine 標記 stt:whisper (本地 CPU 推理, 零 key)。
// 優雅回落: 服務不可用 → 拋 STT_UNAVAILABLE；靜音 → 空結果不報錯。
// @ts-check
// ============================================================

import { toOmniLiveError } from './errors.mjs';
import fs from 'node:fs';

/**
 * @typedef {Object} SttResult
 * @property {string} text
 * @property {string} language  規範語言碼 (zh-TW | en | ...)
 * @property {string} engine
 * @property {Array<{speaker:string, text:string, start:number, end:number}>} [segments]  VAD 語者分段 (啟用時)
 */

/**
 * 規範化 STT 回傳語言為展示碼 (繁中視為 zh-TW)。
 * @param {string} lang
 * @returns {string}
 */
function normLang(lang) {
  const l = String(lang || '').toLowerCase();
  if (l.startsWith('zh')) return 'zh-TW';
  if (l.startsWith('en')) return 'en';
  return l || 'unknown';
}

/**
 * 簡易能量 VAD (針對 16-bit PCM WAV)：依 RMS 門檻切出語音段，
 * 段間靜音 > silenceGapMs 視為更換語者，輪流標 A/B。
 * 非 WAV (webm/ogg/mp3) 無法純前端解碼 → 回傳單段 speaker A (交由 whisper 處理)。
 * @param {Buffer} wav
 * @param {{frameMs?:number, silenceGapMs?:number, threshold?:number}} [opt]
 * @returns {Array<{speaker:string, text?:string, start:number, end:number}>}
 */
export function vadSegments(wav, opt = {}) {
  const frameMs = opt.frameMs || 20;
  const silenceGapMs = opt.silenceGapMs || 600;
  const threshold = opt.threshold || 0.015;
  // RIFF/WAVE 解析
  if (wav.length < 44 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') {
    return [{ speaker: 'A', text: '', start: 0, end: 0 }];
  }
  const channels = wav.readUInt16LE(22);
  const sampleRate = wav.readUInt32LE(24);
  const bits = wav.readUInt16LE(34);
  if (bits !== 16 || channels < 1) return [{ speaker: 'A', text: '', start: 0, end: 0 }];
  const dataStart = wav.findIndex((b, i) => i >= 12 && wav.toString('ascii', i, i + 4) === 'data');
  if (dataStart < 0) return [{ speaker: 'A', text: '', start: 0, end: 0 }];
  const off = dataStart + 4;
  const bytesPerSample = 2 * channels;
  const totalSamples = Math.floor((wav.length - off) / bytesPerSample);
  const frameSamples = Math.floor((sampleRate * frameMs) / 1000) * channels;
  const speech = [];
  let cur = null;
  let lastSpeechEnd = -Infinity;
  let speaker = 'A';
  for (let i = 0; i < totalSamples; i += frameSamples) {
    let sum = 0;
    const n = Math.min(frameSamples, totalSamples - i);
    for (let j = 0; j < n; j++) {
      const idx = off + (i + j) * bytesPerSample;
      const s = wav.readInt16LE(idx) / 32768;
      sum += s * s;
    }
    const rms = Math.sqrt(sum / n);
    const tMs = Math.floor(((i / channels) / sampleRate) * 1000);
    if (rms > threshold) {
      if (!cur) {
        // 靜音間隔超過門檻 → 換語者
        if (tMs - lastSpeechEnd > silenceGapMs && lastSpeechEnd > 0) speaker = speaker === 'A' ? 'B' : 'A';
        cur = { speaker, start: tMs, end: tMs };
      }
      cur.end = tMs;
      lastSpeechEnd = tMs;
    } else if (cur) {
      if (tMs - cur.end > silenceGapMs) { speech.push(cur); cur = null; }
    }
  }
  if (cur) speech.push(cur);
  return speech.length ? speech : [{ speaker: 'A', text: '', start: 0, end: 0 }];
}

/**
 * 通用 VAD: 任意格式 (webm/ogg/mp3/opus...) → 經 ffmpeg 解碼為 16kHz mono 16-bit PCM → vadSegments。
 * 依賴主機 ffmpeg (Windows 已裝)。找不到 ffmpeg 或解碼失敗 → 回退單段 speaker A (交由 whisper 整段處理)。
 * @param {Buffer} audio
 * @param {string} [ffmpegPath]
 * @returns {Promise<Array<{speaker:string, text?:string, start:number, end:number}>>}
 */
export async function vadSegmentsAny(audio, ffmpegPath = 'ffmpeg') {
  // WAV 直接本地解碼 (免外部依賴)
  if (audio.length >= 44 && audio.toString('ascii', 0, 4) === 'RIFF' && audio.toString('ascii', 8, 12) === 'WAVE') {
    return vadSegments(audio);
  }
  const { spawnSync } = await import('node:child_process');
  const tmpIn = `C:/Users/dingj/AppData/Local/Temp/omnilive-vad-in-${Date.now()}.bin`;
  const tmpOut = `C:/Users/dingj/AppData/Local/Temp/omnilive-vad-out-${Date.now()}.wav`;
  try {
    fs.writeFileSync(tmpIn, audio);
    const r = spawnSync(ffmpegPath, ['-y', '-i', tmpIn, '-ar', '16000', '-ac', '1', '-f', 'wav', tmpOut], { timeout: 15000, windowsHide: true });
    if (r.status !== 0) return [{ speaker: 'A', text: '', start: 0, end: 0 }];
    const wav = fs.readFileSync(tmpOut);
    return vadSegments(wav);
  } catch {
    return [{ speaker: 'A', text: '', start: 0, end: 0 }];
  } finally {
    try { fs.unlinkSync(tmpIn); } catch {}
    try { fs.unlinkSync(tmpOut); } catch {}
  }
}

/**
 * 呼叫本地 STT 微服務。音訊以 raw bytes 上送 (webm/ogg/wav)。
 * @param {Buffer|Uint8Array} audioBuf
 * @param {{sttPort:number, sttTimeoutMs:number, sttLang:string, vad?:boolean}} opts
 * @returns {Promise<SttResult>}
 */
export async function transcribe(audioBuf, opts) {
  if (!audioBuf || audioBuf.length === 0) {
    return { text: '', language: opts.sttLang && opts.sttLang !== 'auto' ? normLang(opts.sttLang) : 'unknown', engine: 'stt:empty' };
  }
  const url = `http://127.0.0.1:${opts.sttPort}/transcribe?lang=${encodeURIComponent(opts.sttLang || 'auto')}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: new Uint8Array(audioBuf),
      signal: AbortSignal.timeout(opts.sttTimeoutMs),
    });
  } catch (/** @type {any} */ e) {
    // 區分「服務未啟動」(ECONNREFUSED) vs 其他網路錯誤
    throw toOmniLiveError(e, 'STT_UNAVAILABLE');
  }
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).error || ''; } catch { /* ignore */ }
    if (res.status === 502 || res.status === 503 || /ECONNREFUSED|not installed/i.test(detail)) {
      throw toOmniLiveError(new Error(`STT_UNAVAILABLE: 本地 faster-whisper :${opts.sttPort} 未啟動 — 請先啟動 apps/stt`));
    }
    throw toOmniLiveError(new Error(`STT ${res.status}: ${detail || ''}`), 'STT_UNAVAILABLE');
  }
  const j = await res.json();
  const text = (j.text || '').trim();
  /** @type {SttResult} */
  const result = {
    text,
    language: normLang(j.language || opts.sttLang),
    engine: j.engine || 'stt:whisper',
  };
  // VAD 語者分段: 任意格式經 ffmpeg 解碼後做能量偵測 (webm/ogg/mp3/wav 皆支援)
  if (opts.vad && Buffer.isBuffer(audioBuf)) {
    const segs = await vadSegmentsAny(audioBuf);
    if (segs.length > 1 || segs[0].text !== '') {
      // 將 whisper 整段文字指派給最長語音段, 其餘標註語者輪替
      let maxIdx = 0, maxDur = -1;
      segs.forEach((s, i) => { const d = s.end - s.start; if (d > maxDur) { maxDur = d; maxIdx = i; } });
      result.segments = segs.map((s, i) => ({ ...s, text: i === maxIdx ? text : '' }));
    }
  }
  return result;
}

/**
 * 手動字幕語音輸入 (caption 模式)：直接以文字作為辨識結果，
 * 語言依 sttLang 或預設 from 決定，避免無音訊權限時整條流程斷裂。
 * @param {string} text
 * @param {{sttLang:string, from:string}} opts
 * @returns {SttResult}
 */
export function transcribeCaption(text, opts) {
  const lang = opts.sttLang && opts.sttLang !== 'auto' ? normLang(opts.sttLang) : normLang(opts.from);
  return { text: (text || '').trim(), language: lang, engine: 'stt:caption' };
}
