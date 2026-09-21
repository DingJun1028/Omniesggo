/**
 * @esggo/omni-ui v1.0.0
 *
 * 428 浮動心核 + 液態玻璃呈現
 * MECE 角色: 介面顯化層 (Beauty 高流暢視覺與動態回饋)
 *
 * 設計: 純渲染抽象 + Liquid Glass / Floating Core / Metric Visualizer
 *       不依賴 React/Vue/Svelte — 任何前端框架可用
 */

import type { IComponentCore } from '@esggo/omni-core';

export type GlassVariant = 'subtle' | 'standard' | 'prominent';

export interface LiquidGlassConfig {
  variant: GlassVariant;
  blur: number; // px
  opacity: number; // 0-1
  border: boolean;
}

/**
 * 預設 Liquid Glass (深藍 + 暖金 + 米白, 對應 esggo brand)
 */
export const DEFAULT_GLASS: LiquidGlassConfig = {
  variant: 'standard',
  blur: 20,
  opacity: 0.85,
  border: true,
};

export const BRAND_COLORS = {
  deepBlue: '#10243f',
  warmGold: '#c9a24b',
  cream: '#f3ede1',
  green: '#3c6e47',
} as const;

export interface FloatingCoreConfig {
  position: { x: number; y: number };
  size: number; // px
  pulse: boolean;
  theme: keyof typeof BRAND_COLORS;
}

/**
 * 預設 428 浮動心核
 */
export const DEFAULT_FLOATING_CORE: FloatingCoreConfig = {
  position: { x: 428, y: 428 },
  size: 56,
  pulse: true,
  theme: 'warmGold',
};

/**
 * Metric Visualizer
 */
export type MetricKind = 'entropy' | 'pass-rate' | 'drift-count' | 'memory-usage' | 'test-coverage';

export interface Metric {
  kind: MetricKind;
  value: number;
  unit: string;
  threshold?: { warn: number; critical: number };
}

/**
 * LiquidGlassRenderer — 純 CSS 描述 (給前端 framework 用)
 */
export class LiquidGlassRenderer {
  constructor(config?: LiquidGlassConfig) {
    this.config = config ? { ...config } : { ...DEFAULT_GLASS };
  }

  /**
   * 產生 CSS style 物件
   */
  renderStyle(): Record<string, string> {
    return {
      'backdrop-filter': `blur(${this.config.blur}px)`,
      '-webkit-backdrop-filter': `blur(${this.config.blur}px)`,
      'background': `rgba(16, 36, 63, ${this.config.opacity})`,
      'border': this.config.border ? `1px solid rgba(201, 162, 75, 0.3)` : 'none',
      'border-radius': '12px',
      'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.2)',
    };
  }

  /**
   * 設定 variant
   */
  setVariant(variant: GlassVariant): void {
    this.config.variant = variant;
    switch (variant) {
      case 'subtle':
        this.config.blur = 10;
        this.config.opacity = 0.7;
        break;
      case 'standard':
        this.config.blur = 20;
        this.config.opacity = 0.85;
        break;
      case 'prominent':
        this.config.blur = 30;
        this.config.opacity = 0.95;
        break;
    }
  }

  getConfig(): Readonly<LiquidGlassConfig> {
    return { ...this.config };
  }
}

/**
 * FloatingCore — 428 浮動心核
 */
export class FloatingCore {
  private pulseInterval: NodeJS.Timeout | null = null;

  constructor(config?: FloatingCoreConfig) {
    this.config = config ? { ...config } : { ...DEFAULT_FLOATING_CORE };
  }

  /**
   * 開始 pulse 動畫
   */
  startPulse(intervalMs = 1500): void {
    if (this.pulseInterval) return;
    this.pulseInterval = setInterval(() => {
      // 模擬 pulse (生產環境用 CSS animation)
    }, intervalMs);
  }

  /**
   * 停止 pulse
   */
  stopPulse(): void {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
  }

  /**
   * 移動心核到新位置
   */
  moveTo(x: number, y: number): void {
    this.config.position = { x, y };
  }

  /**
   * 產生 CSS animation keyframes
   */
  renderPulseKeyframes(): string {
    return `
@keyframes omni-core-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.9; }
}
    `.trim();
  }

  getConfig(): Readonly<FloatingCoreConfig> {
    return { ...this.config };
  }
}

/**
 * MetricVisualizer — 抽象指標轉具體 UI
 */
export class MetricVisualizer {
  private metrics: Metric[] = [];

  /**
   * 加入 metric
   */
  addMetric(metric: Metric): void {
    this.metrics.push(metric);
  }

  /**
   * 取得 metric 狀態 (warn / critical / ok)
   */
  getStatus(kind: MetricKind): 'ok' | 'warn' | 'critical' {
    const m = this.metrics.find((mt) => mt.kind === kind);
    if (!m || !m.threshold) return 'ok';
    // 預設: value 越高越糟 (e.g., entropy, drift-count)
    // 若 metric kind 是 pass-rate 或 test-coverage, value 越高越好 → 反向
    const reverseOk = kind === 'pass-rate' || kind === 'test-coverage';
    if (reverseOk) {
      if (m.value <= m.threshold.critical) return 'critical';
      if (m.value <= m.threshold.warn) return 'warn';
      return 'ok';
    }
    if (m.value >= m.threshold.critical) return 'critical';
    if (m.value >= m.threshold.warn) return 'warn';
    return 'ok';
  }

  /**
   * 產生 CSS color class
   */
  renderColor(kind: MetricKind): string {
    const status = this.getStatus(kind);
    switch (status) {
      case 'ok':
        return BRAND_COLORS.green;
      case 'warn':
        return BRAND_COLORS.warmGold;
      case 'critical':
        return '#d9534f';
    }
  }

  /**
   * 取得所有 metrics
   */
  getAllMetrics(): readonly Metric[] {
    return [...this.metrics];
  }
}

/**
 * OmniUI 主 class (整合三元件)
 */
export class OmniUI {
  glass: LiquidGlassRenderer;
  core: FloatingCore;
  visualizer: MetricVisualizer;

  constructor() {
    this.glass = new LiquidGlassRenderer();
    this.core = new FloatingCore();
    this.visualizer = new MetricVisualizer();
  }

  /**
   * 渲染完整 UI (給前端 framework consume)
   */
  render(): {
    glass: Record<string, string>;
    core: FloatingCoreConfig;
    metrics: readonly Metric[];
  } {
    return {
      glass: this.glass.renderStyle(),
      core: this.core.getConfig(),
      metrics: this.visualizer.getAllMetrics(),
    };
  }
}

export const omniUI = new OmniUI();
