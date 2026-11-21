// ═══════════════════════════════════════════════════════════════
// @esggo/omni-agent — 5T Gate Verification Engine
// 合併自 v2.1 verify5TGate() 邏輯 + v5.0 gate color mapping
// ═══════════════════════════════════════════════════════════════

import { createHash } from 'crypto';
import type { FiveTDimension, FiveTVerificationResult, FiveTScore } from './types';
import { FIVE_T_META, FIVE_T_GATES } from './types';

// ── Gate Minimum Requirements ─────────────────────────────────

const GATE_MIN_LENGTH: Record<FiveTDimension, number> = {
  traceable: 100,
  transparent: 150,
  tangible: 200,
  trustworthy: 120,
  trackable: 80,
};

const GATE_PATTERNS: Record<FiveTDimension, RegExp> = {
  traceable: /GRI|ISO|TCFD|SDG|來源|引用|reference/i,
  transparent: /%|百分比|比率|比例|公開|揭露/i,
  tangible: /完成|達成|實現|推動|建立|導入|數量|金額/i,
  trustworthy: /ZKP|hash|sha|封印|驗證|審計|audit/i,
  trackable: /202[5-9]|年度|期間|日期|追蹤|monitor/i,
};

const DEFAULT_SCORE: FiveTScore = {
  traceable: 0.8,
  transparent: 0.8,
  tangible: 0.8,
  trustworthy: 0.9,
  trackable: 0.8,
};

// ── Gate Verification ─────────────────────────────────────────

/**
 * Verify a single 5T gate for content quality.
 */
export function verifyGate(
  gate: FiveTDimension,
  content: string,
  contentHash?: string
): FiveTVerificationResult {
  const issues: string[] = [];
  const minLen = GATE_MIN_LENGTH[gate];

  if (!content || content.trim().length === 0) {
    issues.push('內容為空');
  } else if (content.length < minLen) {
    issues.push(`內容長度 (${content.length}) 低於 ${gate} 閘門最低要求 (${minLen})`);
  }

  if (GATE_PATTERNS[gate] && !GATE_PATTERNS[gate].test(content)) {
    issues.push(`缺少 ${FIVE_T_META[gate].zh} (${gate}) 品質特徵模式`);
  }

  if (gate === 'trustworthy' && (!contentHash || contentHash.length < 16)) {
    issues.push('缺少或無效的內容 Hash（信任閘門要求）');
  }

  // Calculate score based on issues
  const baseScore = DEFAULT_SCORE[gate];
  const score = Math.max(0, baseScore - issues.length * 0.15);

  return {
    passed: issues.length === 0,
    issues,
    gate,
    score: Math.round(score * 100) / 100,
  };
}

/**
 * Verify all 5T gates for content.
 */
export function verifyAllGates(
  content: string,
  contentHash?: string
): FiveTVerificationResult[] {
  return FIVE_T_GATES.map((gate) => verifyGate(gate, content, contentHash));
}

/**
 * Verify all 5T gates are passed.
 */
export function isAllGatesPassed(results: FiveTVerificationResult[]): boolean {
  return results.length === 5 && results.every((r) => r.passed);
}

// ── 5T Score Calculation ──────────────────────────────────────

/**
 * Create a default or partial 5T score with sensible defaults.
 */
export function createFiveTScore(overrides?: Partial<FiveTScore>): FiveTScore {
  return { ...DEFAULT_SCORE, ...overrides };
}

// ── Gate Color Helpers ────────────────────────────────────────

export function getGateMeta(gate: FiveTDimension) {
  return FIVE_T_META[gate];
}

export function getGateColor(gate: FiveTDimension): string {
  return FIVE_T_META[gate].color;
}

// ── Hash Utils ─────────────────────────────────────────────────

export function createAgentHash(data: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export function createDecisionHash(
  prevHash: string,
  action: string,
  output: string,
  timestamp: number
): string {
  return createHash('sha256')
    .update(`${prevHash}:${action}:${output}:${timestamp}`)
    .digest('hex');
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
