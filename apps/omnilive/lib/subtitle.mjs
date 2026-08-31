// ============================================================
// OmniLive — 字幕層 (雙語字幕資料結構 + 即時刷新隊列)
// 責任: 將 STT+翻譯結果整理為播放器可直接顯示的雙語資料結構，
//       支援即時更新、逐句刷新、基本同步 (時間戳 + TTL)。
// 設計防禦: 節流 (throttle) + 佇列 (queue) + 錯誤重試由上游負責，
//          此層只做「最新字幕計算」與「過期清理」，避免長會議記憶體膨脹。
// @ts-check
// ============================================================

import { hashOf } from './translate.mjs';

let _seq = 0;
function nextSeq() { return ++_seq; }

/**
 * @typedef {Object} BilingualSubtitle
 * @property {number} id           單調遞增序號 (播放器用於去重/排序)
 * @property {string} source       原文 (辨識結果)
 * @property {string} target       目標語翻譯
 * @property {string} from         原文語言
 * @property {string} to           目標語言
 * @property {string} engine       翻譯引擎 (5T 溯源)
 * @property {number} ts           產生時間戳 (ms)
 * @property {string} trace        5T 不可篡改 trace
 * @property {boolean} final       是否為該句最終稿 (false=推測中, true=確認)
 * @property {string} [speaker]    VAD 語者標籤 (A/B), 啟用 VAD 時附加
 */

/**
 * 由辨識+翻譯結果建立一筆雙語字幕。
 * @param {{text:string, language:string, engine:string}} stt
 * @param {{source:string, target:string, from:string, to:string, engine:string, cached:boolean}} tr
 * @returns {BilingualSubtitle}
 */
export function buildSubtitle(stt, tr) {
  return {
    id: nextSeq(),
    source: tr.source,
    target: tr.target,
    from: tr.from,
    to: tr.to,
    engine: tr.engine,
    ts: Date.now(),
    trace: hashOf(tr.source),
    final: true,
  };
}

/**
 * 雙語字幕佇列 — 管理近期字幕視窗、過期清理、播放器快照。
 * 防禦長會議: 只保留最近 N 句 (SUBTITLE_MAX_LINES) 與 TTL 內的資料。
 */
export class SubtitleStore {
  /** @param {{maxLines:number, ttlMs:number}} opts */
  constructor(opts) {
    /** @type {BilingualSubtitle[]} */
    this.items = [];
    this.maxLines = opts.maxLines;
    this.ttlMs = opts.ttlMs;
  }

  /**
   * 推入一筆字幕並回傳最新快照 (過濾空句、裁剪視窗)。
   * @param {BilingualSubtitle} sub
   * @returns {BilingualSubtitle[]}
   */
  push(sub) {
    if (!sub.source && !sub.target) return this.snapshot();
    this.items.push(sub);
    if (this.items.length > this.maxLines) this.items = this.items.slice(-this.maxLines);
    return this.snapshot();
  }

  /** 回傳仍在 TTL 內的「活躍」字幕 (供播放器高亮最新句) */
  snapshot() {
    const now = Date.now();
    return this.items.filter(s => now - s.ts <= this.ttlMs || s === this.items[this.items.length - 1]).slice(-this.maxLines);
  }

  /** 定時清理 (呼叫端可用 setInterval 驅動) */
  prune() {
    const now = Date.now();
    this.items = this.items.filter(s => now - s.ts <= this.ttlMs);
  }

  clear() { this.items = []; }
  size() { return this.items.length; }
}
