// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Theme Manager — ESGGO Brand Customization
 */

export type ThemeMode = 'light' | 'dark';

export interface BrandTheme {
  id: string;
  name: string;
  mode: ThemeMode;
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    gold?: string;
    blue?: string;
  };
  fonts: {
    main: string;
    mono: string;
    display: string;
  };
  radius: string;
  customLogo?: string;
}

export const DEFAULT_THEMES: Record<ThemeMode, BrandTheme> = {
  light: {
    id: 'esggo-light',
    name: 'ESGGO Light',
    mode: 'light',
    colors: {
      primary: '#009EB0',
      accent: '#00C2AB',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#070a13',
      textSecondary: '#475569',
      border: '#e2e8f0',
      gold: '#D4AF37',
      blue: '#3B82F6',
    },
    fonts: {
      main: "'Noto Sans TC', sans-serif",
      mono: "'Fira Code', monospace",
      display: "'Montserrat', sans-serif",
    },
    radius: '12px',
  },
  dark: {
    id: 'esggo-dark',
    name: 'ESGGO Dark',
    mode: 'dark',
    colors: {
      primary: '#009EB0',
      accent: '#00C2AB',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      gold: '#D4AF37',
      blue: '#3B82F6',
    },
    fonts: {
      main: "'Noto Sans TC', sans-serif",
      mono: "'Fira Code', monospace",
      display: "'Montserrat', sans-serif",
    },
    radius: '12px',
  },
};

export class ThemeManager {
  private current: ThemeMode = 'light';
  private custom: Map<string, BrandTheme> = new Map();

  setMode(mode: ThemeMode): void {
    this.current = mode;
  }

  getMode(): ThemeMode {
    return this.current;
  }

  getTheme(): BrandTheme {
    const custom = this.custom.get(this.current);
    return custom ?? DEFAULT_THEMES[this.current];
  }

  registerCustom(theme: BrandTheme): void {
    this.custom.set(theme.mode, Object.freeze(theme));
  }

  toCSSVariables(theme?: BrandTheme): string {
    const t = theme ?? this.getTheme();
    return `
      --brand-teal: ${t.colors.primary};
      --brand-teal-light: ${t.colors.accent};
      --brand-gold: ${t.colors.gold ?? '#D4AF37'};
      --zkp-blue: ${t.colors.blue ?? '#3B82F6'};
      --base-bg: ${t.colors.background};
      --slate-950: ${t.colors.text};
      --slate-900: ${t.colors.text};
      --slate-800: ${t.colors.textSecondary};
      --slate-600: ${t.colors.textSecondary};
      --slate-100: ${t.colors.surface};
      --font-main: ${t.fonts.main};
      --font-mono: ${t.fonts.mono};
      --font-display: ${t.fonts.display};
      --radius-atom: ${t.radius};
      --radius-molecule: ${t.radius};
    `;
  }
}

export const themeManager = new ThemeManager();
