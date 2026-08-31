// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * src/lib/report-brand-theme.ts
 *
 * ESGGO 品牌一體化報告主題系統
 * - 深色 / 淺色主題
 * - 5T 色彩映射
 * - 统一字體/間距/邊界系統
 */

export interface ReportBrandTheme {
  id: 'esggo-dark' | 'esggo-light';
  label: string;
  colors: {
    bg: string;
    surface: string;
    surfaceHover: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    teal: string;
    gold: string;
    zkp: string;
    success: string;
    error: string;
    fiveT: {
      traceable: string;
      transparent: string;
      tangible: string;
      trustworthy: string;
      trackable: string;
    };
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont: string;
    h1: string;
    h2: string;
    h3: string;
    body: string;
    caption: string;
  };
  spacing: {
    section: number;
    card: number;
    element: number;
  };
  borderRadius: {
    card: number;
    button: number;
    input: number;
  };
}

export const ESGGODarkTheme: ReportBrandTheme = {
  id: 'esggo-dark',
  label: 'ESGGO Dark',
  colors: {
    bg: '#0A0F1A',
    surface: '#111827',
    surfaceHover: '#1E293B',
    border: '#1E3A5F',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    teal: '#009EB0',
    gold: '#D4AF37',
    zkp: '#3B82F6',
    success: '#10B981',
    error: '#EF4444',
    fiveT: {
      traceable: '#3B82F6',
      transparent: '#22C55E',
      tangible: '#F59E0B',
      trustworthy: '#8B5CF6',
      trackable: '#06B6D4',
    },
  },
  typography: {
    headingFont: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    bodyFont: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    monoFont: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    h1: '700 28px/1.2',
    h2: '600 22px/1.3',
    h3: '600 18px/1.4',
    body: '400 15px/1.7',
    caption: '400 12px/1.5',
  },
  spacing: {
    section: 24,
    card: 16,
    element: 12,
  },
  borderRadius: {
    card: 12,
    button: 10,
    input: 8,
  },
};

export const ESGGOLightTheme: ReportBrandTheme = {
  id: 'esggo-light',
  label: 'ESGGO Light',
  colors: {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceHover: '#F1F5F9',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    teal: '#009EB0',
    gold: '#D4AF37',
    zkp: '#3B82F6',
    success: '#10B981',
    error: '#EF4444',
    fiveT: {
      traceable: '#3B82F6',
      transparent: '#16A34A',
      tangible: '#D97706',
      trustworthy: '#7C3AED',
      trackable: '#0891B2',
    },
  },
  typography: {
    headingFont: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    bodyFont: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    monoFont: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    h1: '700 28px/1.2',
    h2: '600 22px/1.3',
    h3: '600 18px/1.4',
    body: '400 15px/1.7',
    caption: '400 12px/1.5',
  },
  spacing: {
    section: 24,
    card: 16,
    element: 12,
  },
  borderRadius: {
    card: 12,
    button: 10,
    input: 8,
  },
};

export const ESGGOTHEMES: Record<string, ReportBrandTheme> = {
  'esggo-dark': ESGGODarkTheme,
  'esggo-light': ESGGOLightTheme,
};

export type ReportAssetType = 'chart' | 'table' | 'image' | 'callout';

export interface BaseReportAsset {
  id: string;
  type: ReportAssetType;
  title: string;
}

export interface ChartAsset extends BaseReportAsset {
  type: 'chart';
  chartType: 'line' | 'bar' | 'radar' | 'gauge' | 'area';
  data: Array<Record<string, unknown>>;
  xKey?: string;
  yKey?: string;
  categoryKey?: string;
  color?: string;
  fiveTDimension?: 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';
}

export interface TableAsset extends BaseReportAsset {
  type: 'table';
  columns: Array<{ key: string; label: string; width?: string }>;
  rows: Array<Record<string, unknown>>;
  striped?: boolean;
}

export interface ImageAsset extends BaseReportAsset {
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
  width?: number;
}

export interface CalloutAsset extends BaseReportAsset {
  type: 'callout';
  body: string;
  variant?: 'info' | 'warning' | 'success' | 'insight';
  fiveTDimension?: 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';
}

export type ReportAsset = ChartAsset | TableAsset | ImageAsset | CalloutAsset;

export function resolveFiveTColor(
  theme: ReportBrandTheme,
  dimension?: 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable'
): string {
  if (!dimension) return theme.colors.teal;
  return theme.colors.fiveT[dimension] || theme.colors.teal;
}
