/**
 * OmniAvatarCore — 千面化身元件核心 (UAACC Tri-Mode 吸收版)
 *
 * 來源: 萬能代理千面化身元件核心 (UAACC) 技術白皮書研究之「採納改造」裁決 —
 *   Tri-Mode 狀態機與 AvatarConfig 化身配置契約, 落於表現層語義;
 *   不新建平行編排器 (MECE: 編排仍屬 OmniArch / OmniEngine / OmniHeart)。
 *
 * 三態 (Tri-Mode):
 *   Companion   (Mode I   沉浸式對話態) — 線性敘事、高情感頻寬
 *   CommandGrid (Mode II  戰略指揮網格態) — 模組化網格、高資訊密度
 *   Phantom     (Mode III 幽靈執行態) — 無頭後台、事件驅動
 *
 * 明確排除 (UAACC 研究裁決, 2026-10-31):
 *   - 生物識別感知輸入 (違反數據氣密艙 PII 承諾)
 *   - 外部向量庫選型 (Pinecone/Chroma; 沿用 Supabase + Weaviate + Ollama)
 *   - 模型毫秒級熱切換 (與先知矩陣 0ms 響應矛盾, 延後)
 *
 * 安全語義: 工具權限三清單 fail-closed — 未列冊一律 deny (default-deny),
 * 與 OAG 神聖契約、mcp-gateway default-deny auth 同一哲學。
 */
import { OmniArchError } from './types';

export type AvatarMode = 'Companion' | 'CommandGrid' | 'Phantom';
export type TriModeIntent = 'chat' | 'query' | 'execute';
export type ToolPermissionDecision = 'allow' | 'require_approval' | 'deny';
export type AvatarLayoutEngine = 'chat_stream' | 'modular_grid' | 'headless';

const DEFAULT_MODE_BY_INTENT: Readonly<Record<TriModeIntent, AvatarMode>> = Object.freeze({
  chat: 'Companion',
  query: 'CommandGrid',
  execute: 'Phantom',
});

const LAYOUT_BY_MODE: Readonly<Record<AvatarMode, AvatarLayoutEngine>> = Object.freeze({
  Companion: 'chat_stream',
  CommandGrid: 'modular_grid',
  Phantom: 'headless',
});

export interface AvatarTriggerRules {
  readonly intents: readonly TriModeIntent[];
  readonly userRole?: string;
  readonly urgency?: 'low' | 'medium' | 'high';
}

export interface AvatarCognitiveProfile {
  readonly systemPromptTemplate: string;
  readonly tone: string;
  readonly reasoningDepth: 'fast' | 'deep' | 'chain_of_thought';
  readonly creativityTemperature: number;
}

export interface AvatarWidget {
  readonly type: string;
  readonly refreshRateMs?: number;
  readonly source?: string;
}

export interface AvatarInterfaceConfig {
  readonly layoutEngine: AvatarLayoutEngine;
  readonly density: 'minimal' | 'standard' | 'ultra_high';
  readonly activeWidgets: readonly AvatarWidget[];
}

export interface AvatarToolPermissions {
  readonly allow: readonly string[];
  readonly requireApproval: readonly string[];
  readonly deny: readonly string[];
}

export interface AvatarConfig {
  readonly avatarId: string;
  readonly displayName: string;
  readonly baseMode: AvatarMode;
  readonly triggerRules: AvatarTriggerRules;
  readonly cognitiveProfile: AvatarCognitiveProfile;
  readonly interfaceConfig: AvatarInterfaceConfig;
  readonly toolPermissions: AvatarToolPermissions;
}

/** 意圖 → 預設三態映射 (化身未宣告該意圖時之保底) */
export function suggestMode(intent: TriModeIntent): AvatarMode {
  return DEFAULT_MODE_BY_INTENT[intent];
}

/** 化身配置封存: 契約驗證 + 淺凍結 (純資料, 禁熱改, 杜絕越權注入) */
export function sealAvatarConfig(config: AvatarConfig): Readonly<AvatarConfig> {
  if (config.avatarId === '') {
    throw new OmniArchError('E_AVATAR_ID_REQUIRED', 'avatarId 不可為空');
  }
  if (config.toolPermissions.allow.includes('*')) {
    throw new OmniArchError('E_AVATAR_WILDCARD_FORBIDDEN', 'allow 清單禁用萬用字元 * (default-deny)');
  }
  if (config.interfaceConfig.layoutEngine !== LAYOUT_BY_MODE[config.baseMode]) {
    throw new OmniArchError(
      'E_AVATAR_LAYOUT_MISMATCH',
      `layoutEngine 與 baseMode 不一致: ${config.baseMode} 應為 ${LAYOUT_BY_MODE[config.baseMode]}`,
    );
  }
  if (config.interfaceConfig.layoutEngine === 'headless' && config.interfaceConfig.activeWidgets.length > 0) {
    throw new OmniArchError('E_AVATAR_HEADLESS_WIDGETS', 'headless 化身不得掛載 activeWidgets');
  }
  return Object.freeze({ ...config });
}

export class OmniAvatarCore {
  private readonly config: Readonly<AvatarConfig>;

  constructor(config: AvatarConfig) {
    this.config = sealAvatarConfig(config);
  }

  currentMode(): AvatarMode {
    return this.config.baseMode;
  }

  displayName(): string {
    return this.config.displayName;
  }

  /** 意圖解析: 命中化身宣告意圖 → baseMode; 未宣告 → 回退預設三態映射 */
  resolveMode(intent: TriModeIntent): AvatarMode {
    return this.config.triggerRules.intents.includes(intent)
      ? this.config.baseMode
      : suggestMode(intent);
  }

  /** 工具權限裁決: deny 優先 → requireApproval → allow → 未列冊一律 deny (fail-closed) */
  toolPermission(tool: string): ToolPermissionDecision {
    const { deny, requireApproval, allow } = this.config.toolPermissions;
    if (deny.includes(tool)) return 'deny';
    if (requireApproval.includes(tool)) return 'require_approval';
    if (allow.includes(tool)) return 'allow';
    return 'deny';
  }
}
