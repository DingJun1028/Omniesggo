// Omni-Blueprint Hub — Plugin System Core Types (5T-Aware)
// 設計哲學 (無作妙德圓通無礙): 外掛皆過 5T Gate 才掛載, 未過不註冊 (結界阻斷)
import type { IComponentCore, BlueprintProduct, BroadcastPayload } from './core-types.js';

/** 外掛生命週期階段 */
export type PluginPhase = 'registered' | 'enabled' | 'disabled' | 'errored' | 'unloaded';

/** 外掛可掛載的 Hub 事件鉤子 (對齊 monitor-server broadcast 事件) */
export type HubHook =
  | 'onBlueprintCreated'
  | 'onProductManifested'
  | 'onBroadcastPushed'
  | 'onTranslation'
  | 'onCaption'
  | 'onSnapshot'
  | 'onHealthCheck';

/** 外掛元資料 (對齊 IComponentCore 5T 意念) */
export interface PluginManifest extends IComponentCore {
  pluginId: string;
  name: string;
  version: string;
  description: string;
  author: string;
  /** 註冊的蜂群代理編號 (對齊 soul.md §二 30 Souls Matrix, 例如 '07') */
  ownedBy?: string;
  hooks: HubHook[];
  /** 5T 聲明: 外掛自身承諾的 5T 維度 */
  fiveT: {
    traceable: boolean;
    trackable: boolean;
    tangible: boolean;
    transparent: boolean;
    trustworthy: boolean;
  };
}

/** 外掛上下文 — 提供 Hub 核心能力給外掛使用 (圓通無礙) */
export interface PluginContext {
  hub: import('./hub-engine.js').OmniBlueprintHub;
  /** 廣播一筆 payload 到指定 src (複用 monitor-server broadcast) */
  broadcast: (src: string, event: { type: string; data: unknown }) => void;
  /** 日誌 (無作: 靜默 graceful) */
  log: (level: 'info' | 'warn' | 'error', msg: string) => void;
  /** 取得單一資料表 (Trackable) */
  getUnifiedTable: () => import('./core-types.js').UnifiedBlueprintEntity[];
}

/** 外掛實例介面 — 所有外掛必須實作 */
export interface HubPlugin {
  manifest: PluginManifest;
  /** 啟用: 註冊鉤子監聽 (無作: 失敗靜默回 false, 不拋) */
  enable(ctx: PluginContext): boolean | Promise<boolean>;
  /** 停用: 移除監聽, 釋放資源 */
  disable(): boolean | Promise<boolean>;
  /** 處理鉤子事件 (收件方反驗: 外掛內部自保 5T) */
  onHook?(hook: HubHook, payload: unknown, ctx: PluginContext): void | Promise<void>;
  /** 健康自檢 (Transparent) */
  health?(): { ok: boolean; detail: string };
}

/** 註冊表項目 */
export interface RegistryEntry {
  plugin: HubPlugin;
  phase: PluginPhase;
  registeredAt: string;
  lastError?: string;
}
