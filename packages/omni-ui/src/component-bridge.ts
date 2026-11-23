/**
 * OmniComponent 渲染橋 — 12大萬能架構維度二 (邊界實體語義) 的套件層顯化
 *
 * 把 @esggo/omni-arch OmniComponent 封裝描述子 (kind/props/theme/effect,
 * 經 sealComponentCore Hash Lock 刻印) 轉為純 CSS 渲染計畫 (ComponentRenderPlan),
 * 交任何前端框架消費。
 *
 * MECE 邊界:
 * - 描述子生產與封裝 → @esggo/omni-arch OmniComponent
 * - 主題狀態機 (lockProvider 覆寫) → @esggo/omni-arch OmniTheme 同語義鏡像
 * - 前端框架綁定 (React/Vue) → apps/ 層; 本橋 intentionally UI 無關
 *
 * 5T:
 * - Traceable: plan 回填 descriptor uuid
 * - Trackable: 渲染前驗 Hash Lock (verifyDescriptorSeal)
 * - Tangible: plan 經 deepFreeze 不可變
 * - Transparent: themeRequested/themeApplied 分別揭露
 * - Trustworthy: 偽造/未封裝描述子 fail-fast 拒渲染
 */
import { computeHash, deepFreeze } from '@esggo/omni-core';
import type { ComponentDescriptor, ComponentEffect, ThemeState } from '@esggo/omni-arch';
import { LiquidGlassRenderer } from './index';

/** 渲染主題狀態 — 與 @esggo/omni-arch ThemeState 同構 (MECE: 僅型別別名, 不重生狀態機) */
export type RenderThemeState = ThemeState;

/** 渲染計畫 — 純 CSS 描述 + 溯源欄位, deepFreeze 交付 */
export interface ComponentRenderPlan {
  readonly kind: string;
  readonly uuid: string;
  readonly themeRequested: RenderThemeState;
  readonly themeApplied: RenderThemeState;
  readonly locked: boolean;
  readonly style: Readonly<Record<string, string>>;
  readonly effect: ComponentEffect;
  readonly effectKeyframes: string;
}

/** 渲染層錯誤 — fail-fast 代碼化 */
export class OmniUIError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super('[' + code + '] ' + message);
    this.name = 'OmniUIError';
    this.code = code;
  }
}

/**
 * 驗證 OmniComponent 描述子之 Hash Lock 是否完好。
 *
 * 與 @esggo/omni-core verifySeal 之差異 (如實揭露):
 * sealComponentCore 對「整個描述子」(含 kind/props/theme/effect) 計算 SHA-256,
 * 故複核以展開運算子保留 seal 當下之原始鍵序重組 (排除 seal 證據本身) 後比對。
 * (手動逐欄位重組會改變 JSON 鍵序導致失配 — PR #337 缺陷之堵修)
 */
export function verifyDescriptorSeal(descriptor: Readonly<ComponentDescriptor>): boolean {
  if (!Object.isFrozen(descriptor) || !Object.isFrozen(descriptor.evidence)) {
    return false;
  }
  const seal = descriptor.evidence[descriptor.evidence.length - 1];
  if (!seal || seal.standard !== '5T-PROOF') {
    return false;
  }
  // 展開保留原始鍵序 (evidence 原位抽換為 seal 前內容), 與 sealComponentCore
  // 計算 seal.hash 當下之物件完全同構
  const cloned = {
    ...descriptor,
    evidence: descriptor.evidence.slice(0, -1),
  };
  return computeHash(cloned) === seal.hash;
}

/** 戒嚴防護色 — 唯讀防護 (對應 OmniTheme 'MartialLock') */
const MARTIAL_STYLE: Readonly<Record<string, string>> = deepFreeze({
  'background': 'rgba(120, 24, 24, 0.92)',
  'border': '1px solid #d9534f',
  'border-radius': '12px',
  'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.35)',
  'user-select': 'none',
  'pointer-events': 'none',
  'cursor': 'not-allowed',
});

/** 輝煌主題樣式 — 對應 OmniTheme 'CelestialGlow' */
const CELESTIAL_STYLE: Readonly<Record<string, string>> = deepFreeze({
  'background': 'rgba(201, 162, 75, 0.25)',
  'border': '1px solid rgba(201, 162, 75, 0.6)',
  'border-radius': '12px',
  'box-shadow': '0 0 24px rgba(201, 162, 75, 0.45)',
  'backdrop-filter': 'blur(10px)',
  '-webkit-backdrop-filter': 'blur(10px)',
});

/** 特效 keyframes 產生器 */
export function renderEffectKeyframes(effect: ComponentEffect): string {
  switch (effect) {
    case 'ripple':
      return [
        '@keyframes omni-effect-ripple {',
        '  0% { transform: scale(1); }',
        '  100% { transform: scale(1.12); opacity: 0.85; }',
        '}',
      ].join('\n');
    case 'freeze':
      return [
        '@keyframes omni-effect-freeze {',
        '  0%, 100% { filter: saturate(1); }',
        '  50% { filter: saturate(0.2) hue-rotate(180deg); }',
        '}',
      ].join('\n');
    case 'glow':
      return [
        '@keyframes omni-effect-glow {',
        '  0%, 100% { box-shadow: 0 0 8px rgba(201, 162, 75, 0.25); }',
        '  50% { box-shadow: 0 0 28px rgba(201, 162, 75, 0.65); }',
        '}',
      ].join('\n');
  }
}

/** 渲染橋選項 */
export interface OmniComponentRendererOptions {
  /** 戒嚴鎖源 — 與 OmniTheme 同語義: 回 true 則一律套用 MartialLock */
  lockProvider?: () => boolean;
  /** 液態玻璃渲染器 (預設 LiquidGlassRenderer 預設值) */
  glass?: LiquidGlassRenderer;
}

/**
 * OmniComponentRenderer — OmniComponent 描述子 → 純 CSS 渲染計畫
 *
 * 渲染前必驗 Hash Lock; 偽造/未封裝描述子 fail-fast (E_DESCRIPTOR_UNSEALED)。
 */
export class OmniComponentRenderer {
  private readonly lockProvider: () => boolean;
  private readonly glass: LiquidGlassRenderer;

  constructor(options: OmniComponentRendererOptions = {}) {
    this.lockProvider = options.lockProvider ?? (() => false);
    this.glass = options.glass ?? new LiquidGlassRenderer();
  }

  async render(
    descriptor: Readonly<ComponentDescriptor>
  ): Promise<Readonly<ComponentRenderPlan>> {
    if (!verifyDescriptorSeal(descriptor)) {
      throw new OmniUIError(
        'E_DESCRIPTOR_UNSEALED',
        'OmniComponent 描述子未通過 Hash Lock 驗證 (未封裝或已遭篡改), 拒絕渲染'
      );
    }
    const locked = this.lockProvider();
    const themeApplied: RenderThemeState = locked ? 'MartialLock' : descriptor.theme;
    const style: Record<string, string> =
      themeApplied === 'MartialLock'
        ? { ...MARTIAL_STYLE }
        : themeApplied === 'CelestialGlow'
          ? { ...CELESTIAL_STYLE }
          : this.glass.renderStyle();
    const plan: ComponentRenderPlan = {
      kind: descriptor.kind,
      uuid: descriptor.uuid,
      themeRequested: descriptor.theme,
      themeApplied,
      locked,
      style: deepFreeze(style),
      effect: descriptor.effect,
      effectKeyframes: renderEffectKeyframes(descriptor.effect),
    };
    return deepFreeze(plan) as Readonly<ComponentRenderPlan>;
  }
}
