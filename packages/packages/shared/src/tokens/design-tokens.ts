// ESGGO 品牌色系與主題令牌
// 單一事實來源（Single Source of Truth）

export const BRAND = {
  teal: '#009EB0',
  tealLight: '#00C2AB',
  gold: '#D4AF37',
  goldLight: '#E6C555',
  navy: '#003262',
  zkpBlue: '#3B82F6',
  quantumPurple: '#8B5CF6',
  trustCyan: '#06B6D4',
} as const;

export const STATUS = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  lethal: '#FF4D6D',
  neonGreen: '#22D3EE',
} as const;

export const NEUTRAL = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  400: '#94A3B8',
  600: '#475569',
  800: '#1E293B',
  900: '#0F172A',
} as const;

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export type ThemeMode = 'light' | 'dark';

export interface ThemeVars {
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  teal: string;
  gold: string;
}

export const THEME: Record<ThemeMode, ThemeVars> = {
  light: {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    teal: '#009EB0',
    gold: '#D4AF37',
  },
  dark: {
    bg: '#0F172A',
    surface: '#1E293B',
    border: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    teal: '#00B5CA',
    gold: '#E6C555',
  },
};

// 向下相容（保留原有匯出名稱）
export const DESIGN_TOKENS = {
  ...BRAND,
  ...STATUS,
  ...NEUTRAL,
  bg: THEME.light.bg,
  surface: THEME.light.surface,
  border: THEME.light.border,
  textPrimary: THEME.light.textPrimary,
  textSecondary: THEME.light.textSecondary,
  textMuted: THEME.light.textMuted,
} as const;

export const FIVE_T_COLORS = {
  traceable:    { bg: '#EFF6FF', text: '#1E40AF', accent: '#3B82F6', label: '溯源' },
  transparent:  { bg: '#F0FDF4', text: '#166534', accent: '#22C55E', label: '透明' },
  tangible:     { bg: '#FEF3C7', text: '#92400E', accent: '#F59E0B', label: '可量化' },
  trustworthy:  { bg: '#EDE9FE', text: '#5B21B6', accent: '#8B5CF6', label: '信任' },
  trackable:    { bg: '#ECFEFF', text: '#155E75', accent: '#06B6D4', label: '可追蹤' },
} as const;

export type FiveTGate = keyof typeof FIVE_T_COLORS;

export function isMobile(width: number): boolean {
  return width < BREAKPOINTS.tablet;
}
export function isTablet(width: number): boolean {
  return width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
}
export function isDesktop(width: number): boolean {
  return width >= BREAKPOINTS.desktop;
}
