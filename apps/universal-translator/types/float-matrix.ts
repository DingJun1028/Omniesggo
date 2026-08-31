// ============================================================
// OmniLive 漂浮窗終始矩陣 — 深貫廣通無礙圓通RWD 雙向同步 TypeScript 型別契約
//
// 單一真諼源: 本檔 → 自動生成 shared/float-matrix.mjs + public/float.html 資料屬性
// 反向: public/float.html 的 data-* / CSS :root 變數 ←→ 本型別 (驗證閉環)
//
// 五大柱: RWD × 字幕 × 音訊 × 房間 × 分享
// ============================================================

/* ==================== RWD 響應式設計矩陣 (Responsive Design Matrix) ==================== */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'ultrawide';
export type Orientation = 'portrait' | 'landscape';
export type SafeAreaInsets = { top: number; left: number; right: number; bottom: number };

export interface RWDConfig {
  breakpoint: Breakpoint;
  orientation: Orientation;
  safeArea: SafeAreaInsets;
  fontScale: number; // 相對於基準字級的倍數 (1.0 = 基準)
  // 深貫廣通: 字級動態縮放 — vw + clamp 實現 1:1 像素完美
  fontSizeSrc: { min: number; preferred: string; max: number };
  fontSizeDst: { min: number; preferred: string; max: number };
}

/* ==================== 字幕矩陣 (Subtitle Matrix) ==================== */
export type SubtitleSource = 'sse' | 'manual' | 'stt' | 'caption';
export type SubtitleStatus = 'waiting' | 'receiving' | 'paused' | 'error';
export type SubtitleAlign = 'left' | 'center' | 'right';
export type SubtitlePosition = 'top' | 'center' | 'bottom';

export interface SubtitleLine {
  text: string;
  speaker?: string;
  ts: number; //時間戳
  id: string;
  // 5T Trackable: 每行字幕附帶 source_origin
  source_origin: SubtitleSource;
  // 5T Trustworthy: Hash Lock
  hash: string;
}

export interface SubtitleGroup {
  lines: SubtitleLine[];
  align: SubtitleAlign;
  position: SubtitlePosition;
  // 是否已固定 (不再合併新字幕)
  finalized: boolean;
  // CSS 類名
  className: string;
}

/* ==================== 音訊矩陣 (Audio Matrix) ==================== */
export type AudioSource = 'system-display' | 'mic' | 'device' | 'caption';
export type AudioStatus = 'idle' | 'recording' | 'paused' | 'stopped';
export type AudioFormat = 'webm' | 'wav' | 'mp3';

export interface AudioConfig {
  source: AudioSource;
  deviceId?: string;
  format: AudioFormat;
  mimeType: string;
  // 音量監聽
  volume: number; // 0-1
  // 分段間隔 (秒)
  chunkSize: number;
}

/* ==================== 房間矩陃 (Room Matrix) ==================== */
export type Role = 'caster' | 'viewer';
export type RoomStatus = 'idle' | 'active' | 'ended' | 'locked';

export interface RoomConfig {
  roomId: string;
  role: Role;
  passwordHash?: string;
  status: RoomStatus;
  // 5T Trackable: 房間生命週期
  createdAt: number;
  updatedAt: number;
  viewerCount: number;
}

/* ==================== 分享矩陣 (Share Matrix) ==================== */
export interface ShareConfig {
  casterLink: string;
  viewerLink: string;
  roomId: string;
  qrCode: string; // base64 圖像
  // 5T Transparent: 分享連結可追蹤
  source_origin: 'manual' | 'api';
  createdAt: number;
}

/* ==================== CSS 變數映射 (CSS Variable Mapping) ==================== */
export interface FloatCSSVars {
  // 顏色
  '--cap-bg': string;
  '--src': string;
  '--trs': string;
  '--gold': string;
  '--ui': string;
  '--accent': string;
  '--accent2': string;
  '--line': string;
  '--ok': string;
  '--warn': string;
  '--err': string;
  '--bg': string;
  '--panel': string;
  '--panel2': string;
  '--muted': string;
  '--txt': string;
  '--radius': string;
  '--gap': string;
  '--font': string;
}

/* ==================== 終始矩陣 (End-Beginning Matrix) ==================== */
export interface FloatEndState {
  // 終態驗收條件
  breakpoint: Breakpoint;
  subtitles: SubtitleLine[];
  audioConfig: AudioConfig;
  roomConfig: RoomConfig;
  shareConfig?: ShareConfig;
  cssVars: FloatCSSVars;
  // 5T 驗算結果
  traceable: boolean;
  trackable: boolean;
  tangible: boolean;
  transparent: boolean;
  trustworthy: boolean;
}

export interface FloatStartChain {
  // 起始必行清單
  steps: string[];
  blocker: string | null;
  verify: string;
}

// 深貫廣通: 終始矩陣定義
export interface FloatEndBeginMatrix {
  endState: FloatEndState;
  startChain: FloatStartChain;
  // 5T 驗算閘
  gate: {
    pass: boolean;
    score: number; // 0-1
    hashLock: string;
  };
}

/* ==================== 全域全端全量同步 (Global Full-Stack Sync) ==================== */
export interface FloatGlobalState {
  // 全域狀態
  version: string;
  lastUpdated: number;
  // 雙向同步: 前端狀態 ↔ 後端狀態
  frontend: Record<string, unknown>;
  backend: Record<string, unknown>;
  // RWD 配置
  rwd: RWDConfig;
  // 字幕流
  subtitles: SubtitleGroup[];
  // 音訊配置
  audio: AudioConfig;
  // 房間配置
  room: RoomConfig;
  // 分享配置
  share?: ShareConfig;
  // 5T Hash Lock
  hashLock: string;
}

/* ==================== 宣告式 API ==================== */
export const FLOAT_CANONICAL: {
  breakpoints: Record<Breakpoint, { min: number; max: number }>;
  orientations: Orientation[];
  subtitleSources: SubtitleSource[];
  audioSources: AudioSource[];
  roles: Role[];
  roomStatuses: RoomStatus[];
  versions: string[];
} = {
  breakpoints: {
    mobile: { min: 0, max: 600 },
    tablet: { min: 601, max: 900 },
    desktop: { min: 901, max: 1440 },
    ultrawide: { min: 1441, max: Infinity },
  },
  orientations: ['portrait', 'landscape'],
  subtitleSources: ['sse', 'manual', 'stt', 'caption'],
  audioSources: ['system-display', 'mic', 'device', 'caption'],
  roles: ['caster', 'viewer'],
  roomStatuses: ['idle', 'active', 'ended', 'locked'],
  versions: ['1.0.0', '1.1.0', '1.2.0', '2.0.0'],
};

/** 根據螢幕寬度判斷斷點 */
export function getBreakpoint(width: number): Breakpoint {
  if (width <= 600) return 'mobile';
  if (width <= 900) return 'tablet';
  if (width <= 1440) return 'desktop';
  return 'ultrawide';
}

/** 計算字級縮放比例 */
export function getFontScale(rwd: RWDConfig): number {
  const scales: Record<Breakpoint, number> = {
    mobile: 0.85,
    tablet: 1.0,
    desktop: 1.0,
    ultrawide: 1.15,
  };
  return scales[rwd.breakpoint];
}

/** 驗證 5T 驗算 */
export function validateFiveT(state: FloatGlobalState): boolean {
  // Traceable: source_origin 存在且可逆向
  const traceable = state.subtitles.every(g =>
    g.lines.every(l => l.source_origin !== undefined)
  );
  // Trackable: 生命週期 Hook 記錄完整
  const trackable = state.lastUpdated > 0 && state.version !== '';
  // Tangible: UI 可感知
  const tangible = state.rwd.fontSizeSrc.min > 0 && state.rwd.fontSizeDst.min > 0;
  // Transparent: 驗算結果公開
  const transparent = state.hashLock !== '';
  // Trustworthy: Hash Lock 生效
  const trustworthy = state.hashLock.length === 64; // SHA-256

  return traceable && trackable && tangible && transparent && trustworthy;
}

// 5T 驗算結果 (單一真諼源)
export interface FiveTResult {
  pass: boolean;
  score: number;
  details: {
    traceable: boolean;
    trackable: boolean;
    tangible: boolean;
    transparent: boolean;
    trustworthy: boolean;
  };
  hashLock: string;
}
