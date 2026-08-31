// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * ESGGO v5.0 萬能系統版 — Solid Card 設計系統
 * 
 * 基於 v3.7 固態極簡光學風格（用戶提供）
 * v5 新增：ZKP Blue + Quantum Purple + OmniBase 三庫配色
 * 
 * 設計原則：
 * - 純色無漸層
 * - 液態玻璃 (backdrop-filter: blur)
 * - 高對比 + 大量留白
 * - 原子→分子→組織 層級
 */

export const DESIGN_TOKENS = Object.freeze({
  // 核心品牌色（v3.7 保留）
  teal: '#009EB0',
  tealLight: '#00C2AB',
  gold: '#D4AF37',
  lethal: '#FF4D6D',
  critical: '#FFB703',
  optimal: '#219EBC',

  // v5 新增：ZKP + 量子色
  zkpBlue: '#3B82F6',
  quantumPurple: '#8B5CF6',
  neonGreen: '#22D3EE',
  sealGold: '#F59E0B',
  trustCyan: '#06B6D4',

  // Slate 灰階
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate600: '#475569',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',

  // 背景
  baseBg: '#FFFFFF',
  darkBg: '#0f172a',

  // 光學
  glassBlur: 'blur(12px)',
  borderGlass: '1px solid rgba(255, 255, 255, 0.4)',
  borderSolid: '1px solid #e2e8f0',

  // 圓角
  radiusAtom: '8px',
  radiusMolecule: '12px',
  radiusOrganism: '16px',

  // 字體
  fontMain: "'Noto Sans TC', sans-serif",
  fontMono: "'Fira Code', monospace",
  fontDisplay: "'Montserrat', sans-serif",

  // 陰影
  shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
  shadowMd: '0 4px 6px -1px rgba(0,0,0,0.05)',
  shadowLg: '0 10px 30px -10px rgba(0,0,0,0.1)',
  shadowXl: '0 25px 50px -12px rgba(0,0,0,0.5)',

  // ZKP 發光
  glowZkp: '0 0 20px rgba(59, 130, 246, 0.3)',
  glowQuantum: '0 0 20px rgba(139, 92, 246, 0.3)',
  glowTeal: '0 0 20px rgba(0, 158, 176, 0.2)',
} as const);

// 5T 協議顏色映射
export const FIVE_T_COLORS = Object.freeze({
  traceable: { bg: '#dbeafe', text: '#1d4ed8', accent: '#3B82F6', label: '真 Traceable' },
  transparent: { bg: '#dcfce7', text: '#166534', accent: '#22C55E', label: '善 Transparent' },
  tangible: { bg: '#fef3c7', text: '#92400e', accent: '#F59E0B', label: '美 Tangible' },
  trustworthy: { bg: '#ede9fe', text: '#5b21b6', accent: '#8B5CF6', label: '信 Trustworthy' },
  trackable: { bg: '#cffafe', text: '#155e75', accent: '#06B6D4', label: '通 Trackable' },
} as const);

// OmniBase 三庫顏色
export const OMNIBASE_COLORS = Object.freeze({
  vault: { bg: '#f0f9ff', border: '#3B82F6', text: '#1e40af', icon: '🏛️', label: '萬能基地' },
  library: { bg: '#fdf4ff', border: '#8B5CF6', text: '#6b21a8', icon: '📚', label: '用戶成長庫' },
  agent: { bg: '#f0fdf4', border: '#22C55E', text: '#166534', icon: '🤖', label: '智能萬用庫' },
} as const);

// 報告狀態徽章
export const STATUS_BADGES = Object.freeze({
  sealed: { bg: '#3B82F6', text: '🔒 ZKP 封印' },
  verified: { bg: '#22C55E', text: '✓ 已驗證' },
  pending: { bg: '#F59E0B', text: '⏳ 處理中' },
  error: { bg: '#FF4D6D', text: '✗ 失敗' },
} as const);

// CSS 生成器（供前端 page.tsx 使用）
export function generateCSSVariables(): string {
  return `
:root {
  --teal-main: ${DESIGN_TOKENS.teal};
  --teal-light: ${DESIGN_TOKENS.tealLight};
  --eternal-gold: ${DESIGN_TOKENS.gold};
  --lethal: ${DESIGN_TOKENS.lethal};
  --critical: ${DESIGN_TOKENS.critical};
  --optimal: ${DESIGN_TOKENS.optimal};
  --zkp-blue: ${DESIGN_TOKENS.zkpBlue};
  --quantum-purple: ${DESIGN_TOKENS.quantumPurple};
  --neon-green: ${DESIGN_TOKENS.neonGreen};
  --seal-gold: ${DESIGN_TOKENS.sealGold};
  --trust-cyan: ${DESIGN_TOKENS.trustCyan};
  --base-bg: ${DESIGN_TOKENS.baseBg};
  --slate-900: ${DESIGN_TOKENS.slate900};
  --slate-800: ${DESIGN_TOKENS.slate800};
  --slate-600: ${DESIGN_TOKENS.slate600};
  --slate-400: ${DESIGN_TOKENS.slate400};
  --slate-200: ${DESIGN_TOKENS.slate200};
  --slate-100: ${DESIGN_TOKENS.slate100};
  --slate-50: ${DESIGN_TOKENS.slate50};
  --glass-blur: ${DESIGN_TOKENS.glassBlur};
  --border-glass: ${DESIGN_TOKENS.borderGlass};
  --border-solid: ${DESIGN_TOKENS.borderSolid};
  --radius-atom: ${DESIGN_TOKENS.radiusAtom};
  --radius-molecule: ${DESIGN_TOKENS.radiusMolecule};
  --radius-organism: ${DESIGN_TOKENS.radiusOrganism};
  --font-main: ${DESIGN_TOKENS.fontMain};
  --font-mono: ${DESIGN_TOKENS.fontMono};
  --font-display: ${DESIGN_TOKENS.fontDisplay};
  --shadow-sm: ${DESIGN_TOKENS.shadowSm};
  --shadow-md: ${DESIGN_TOKENS.shadowMd};
  --shadow-lg: ${DESIGN_TOKENS.shadowLg};
  --shadow-xl: ${DESIGN_TOKENS.shadowXl};
  --glow-zkp: ${DESIGN_TOKENS.glowZkp};
  --glow-quantum: ${DESIGN_TOKENS.glowQuantum};
  --glow-teal: ${DESIGN_TOKENS.glowTeal};
}
`.trim();
}
