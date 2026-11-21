/**
 * OmniTheme Design Tokens — Solid Card Palette
 *
 * Canonical source: src/lib/omni-theme/index.ts (OmniTheme v2.0)
 * This file provides the Solid Card color tokens for @lib/omni-theme alias.
 */

export type FiveTGate = 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';

export interface GateColor {
  readonly bg: string;
  readonly text: string;
  readonly accent: string;
  readonly label: string;
}

export const DESIGN_TOKENS = {
  colors: {
    teal: { value: '#009EB0', description: 'Primary: sustainability, trust' },
    tealLight: { value: '#00C2AB', description: 'Secondary: hover states' },
    gold: { value: '#D4AF37', description: 'Trust anchor: emphasis, credibility' },
    zkpBlue: { value: '#3B82F6', description: 'Agent blue: intelligence layer' },
    userPurple: { value: '#8B5CF6', description: 'User growth: XP, achievements' },
    lethal: { value: '#FF4D6D', description: 'Error / critical alerts' },
    critical: { value: '#FFB703', description: 'Warning / attention' },
    optimal: { value: '#219EBC', description: 'Success / transparent' },
  },
  typography: {
    h1: { fontSize: '2rem', lineHeight: '2.5rem' },
    h2: { fontSize: '1.5rem', lineHeight: '2rem' },
    h3: { fontSize: '1.25rem', lineHeight: '1.75rem' },
    body: { fontSize: '1rem', lineHeight: '1.5rem' },
  },
};

// 5T Gate Colors (aligned with OmniTheme v2.0 GATE_COLORS)
export const FIVE_T_COLORS: Record<FiveTGate, GateColor> = {
  traceable:    { bg: '#EFF6FF', text: '#1E40AF', accent: '#3B82F6', label: '溯源' },
  transparent:  { bg: '#F0FDF4', text: '#166534', accent: '#22C55E', label: '透明' },
  tangible:     { bg: '#FEF3C7', text: '#92400E', accent: '#F59E0B', label: '可量化' },
  trustworthy:  { bg: '#EDE9FE', text: '#5B21B6', accent: '#8B5CF6', label: '信任' },
  trackable:    { bg: '#ECFEFF', text: '#155E75', accent: '#06B6D4', label: '可追蹤' },
};

export type FiveTGateColor = GateColor;

export function getGateColor(gate: FiveTGate): GateColor {
  return FIVE_T_COLORS[gate];
}
