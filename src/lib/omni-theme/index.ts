// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * OmniTheme v2.0 — 萬能主題（5 種主題 + 設計令牌 + CSS 生成器）
 *
 * 5 種預設主題：solid-card / minimal / print-ready / presentation / dashboard
 * 情感適配：professional / vibrant / minimal / detailed / executive
 * 輸出格式：html / markdown / json / pdf-ready
 * 響應式斷點適配
 */

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type ThemePreset = 'solid-card' | 'minimal' | 'print-ready' | 'presentation' | 'dashboard';
export type ThemeMode = 'light' | 'dark';
export type ThemeMood = 'professional' | 'vibrant' | 'minimal' | 'detailed' | 'executive';
export type OutputFormat = 'html' | 'markdown' | 'json' | 'pdf-ready';
export type Roundness = 'none' | 'sm' | 'md' | 'lg' | 'full';

export interface ThemeColors {
  readonly primary: string;
  readonly accent: string;
  readonly background: string;
  readonly surface: string;
  readonly border: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;
}

export interface ThemeTypography {
  readonly bodyFont: string;
  readonly headlineFont: string;
  readonly codeFont: string;
  readonly baseSize: number;
  readonly lineHeight: number;
}

export interface ThemeSpacing {
  readonly unit: number;
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
}

export interface ThemeConfig {
  readonly preset: ThemePreset;
  readonly mode: ThemeMode;
  readonly mood: ThemeMood;
  readonly outputFormat: OutputFormat;
  readonly roundness: Roundness;
  readonly colors: ThemeColors;
  readonly typography: ThemeTypography;
  readonly spacing: ThemeSpacing;
}

// ═══════════════════════════════════════════════════════════════
// Color Palettes
// ═══════════════════════════════════════════════════════════════

export const SOLID_CARD_COLORS: ThemeColors = Object.freeze({
  primary: '#003262',
  accent: '#FDB515',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
});

export const ESGGO_PALETTE = Object.freeze({
  teal: '#009EB0',
  tealLight: '#00C2AB',
  gold: '#D4AF37',
  zkpBlue: '#3B82F6',
  userPurple: '#8B5CF6',
  lethal: '#FF4D6D',
  critical: '#FFB703',
  optimal: '#219EBC',
  slate900: '#0F172A',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
});

// ═══════════════════════════════════════════════════════════════
// Typography
// ═══════════════════════════════════════════════════════════════

const TYPOGRAPHY_PROFESSIONAL: ThemeTypography = Object.freeze({
  bodyFont: "'Noto Sans TC', 'Inter', sans-serif",
  headlineFont: "'Montserrat', 'Noto Sans TC', sans-serif",
  codeFont: "'Fira Code', 'JetBrains Mono', monospace",
  baseSize: 16,
  lineHeight: 1.8,
});

const TYPOGRAPHY_VIBRANT: ThemeTypography = Object.freeze({
  bodyFont: "'Noto Sans TC', 'Inter', sans-serif",
  headlineFont: "'Montserrat', sans-serif",
  codeFont: "'Fira Code', monospace",
  baseSize: 16,
  lineHeight: 1.7,
});

// ═══════════════════════════════════════════════════════════════
// Spacing
// ═══════════════════════════════════════════════════════════════

const SPACING: ThemeSpacing = Object.freeze({
  unit: 4,
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '48px',
});

// ═══════════════════════════════════════════════════════════════
// Theme Presets
// ═══════════════════════════════════════════════════════════════

export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = Object.freeze({
  'solid-card': {
    preset: 'solid-card',
    mode: 'light',
    mood: 'professional',
    outputFormat: 'html',
    roundness: 'md',
    colors: SOLID_CARD_COLORS,
    typography: TYPOGRAPHY_PROFESSIONAL,
    spacing: SPACING,
  } as ThemeConfig,
  minimal: {
    preset: 'minimal',
    mode: 'light',
    mood: 'minimal',
    outputFormat: 'html',
    roundness: 'md',
    colors: Object.freeze({ ...SOLID_CARD_COLORS, background: '#FFFFFF', surface: '#FFFFFF' }),
    typography: TYPOGRAPHY_PROFESSIONAL,
    spacing: SPACING,
  } as ThemeConfig,
  'print-ready': {
    preset: 'print-ready',
    mode: 'light',
    mood: 'detailed',
    outputFormat: 'pdf-ready',
    roundness: 'none',
    colors: Object.freeze({ ...SOLID_CARD_COLORS, background: '#FFFFFF', surface: '#FFFFFF', border: '#000000' }),
    typography: Object.freeze({ ...TYPOGRAPHY_PROFESSIONAL, baseSize: 12 }),
    spacing: SPACING,
  } as ThemeConfig,
  presentation: {
    preset: 'presentation',
    mode: 'dark',
    mood: 'vibrant',
    outputFormat: 'html',
    roundness: 'lg',
    colors: Object.freeze({
      ...SOLID_CARD_COLORS,
      primary: '#009EB0',
      accent: '#D4AF37',
      background: '#0F172A',
      surface: '#1E293B',
      border: '#334155',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
    }),
    typography: TYPOGRAPHY_VIBRANT,
    spacing: SPACING,
  } as ThemeConfig,
  dashboard: {
    preset: 'dashboard',
    mode: 'light',
    mood: 'executive',
    outputFormat: 'html',
    roundness: 'md',
    colors: Object.freeze({ ...SOLID_CARD_COLORS, background: '#F7F8FA', surface: '#FFFFFF' }),
    typography: TYPOGRAPHY_PROFESSIONAL,
    spacing: SPACING,
  } as ThemeConfig,
});

// ═══════════════════════════════════════════════════════════════
// Theme Application
// ═══════════════════════════════════════════════════════════════

export function getTheme(preset: ThemePreset = 'minimal'): ThemeConfig {
  return THEME_PRESETS[preset];
}

export function applyTheme(config: ThemeConfig): ThemeConfig {
  return Object.freeze({ ...config });
}

export function setMode(config: ThemeConfig, mode: ThemeMode): ThemeConfig {
  return Object.freeze({ ...config, mode });
}

export function setMood(config: ThemeConfig, mood: ThemeMood): ThemeConfig {
  return Object.freeze({ ...config, mood });
}

// ═══════════════════════════════════════════════════════════════
// CSS Variable Generator
// ═══════════════════════════════════════════════════════════════

export function generateCSSVars(config: ThemeConfig): Record<string, string> {
  return Object.freeze({
    '--color-primary': config.colors.primary,
    '--color-accent': config.colors.accent,
    '--color-bg': config.colors.background,
    '--color-surface': config.colors.surface,
    '--color-border': config.colors.border,
    '--color-text': config.colors.textPrimary,
    '--color-text-secondary': config.colors.textSecondary,
    '--color-text-muted': config.colors.textMuted,
    '--color-success': config.colors.success,
    '--color-warning': config.colors.warning,
    '--color-error': config.colors.error,
    '--color-info': config.colors.info,
    '--font-body': config.typography.bodyFont,
    '--font-headline': config.typography.headlineFont,
    '--font-code': config.typography.codeFont,
    '--font-size-base': `${config.typography.baseSize}px`,
    '--line-height': String(config.typography.lineHeight),
    '--spacing-unit': `${config.spacing.unit}px`,
    '--radius': config.roundness === 'none' ? '0' :
               config.roundness === 'sm' ? '4px' :
               config.roundness === 'md' ? '8px' :
               config.roundness === 'lg' ? '12px' : '16px',
  });
}

export function generateCSSString(config: ThemeConfig): string {
  const vars = generateCSSVars(config);
  const entries = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  return `:root {\n${entries}\n}`;
}

// ═══════════════════════════════════════════════════════════════
// RWD Breakpoints
// ═══════════════════════════════════════════════════════════════

export const BREAKPOINTS = Object.freeze({
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
});

export function isMobile(width: number): boolean {
  return width < BREAKPOINTS.tablet;
}

export function isTablet(width: number): boolean {
  return width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
}

export function isDesktop(width: number): boolean {
  return width >= BREAKPOINTS.desktop;
}

// ═══════════════════════════════════════════════════════════════
// 5T Gate Colors
// ═══════════════════════════════════════════════════════════════

export const GATE_COLORS: Record<string, string> = Object.freeze({
  traceable: '#3B82F6',
  transparent: '#22C55E',
  tangible: '#F59E0B',
  trustworthy: '#8B5CF6',
  trackable: '#06B6D4',
});

export function getGateColor(gate: string): string {
  return GATE_COLORS[gate] ?? '#64748B';
}

// ═══════════════════════════════════════════════════════════════
// Meta
// ═══════════════════════════════════════════════════════════════

export const OMNI_THEME_META = Object.freeze({
  version: '2.0.0',
  presets: ['solid-card', 'minimal', 'print-ready', 'presentation', 'dashboard'] as const,
  moods: ['professional', 'vibrant', 'minimal', 'detailed', 'executive'] as const,
  formats: ['html', 'markdown', 'json', 'pdf-ready'] as const,
  gateOrder: ['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'] as const,
});
