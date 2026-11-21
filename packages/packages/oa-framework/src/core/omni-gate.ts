/**
 * Omni-Gate 橋接器 — 對齊 @esggo/omni-agent/src/gates.ts 的 5T Gate 邏輯
 * 讓 OA 框架產出在「部署前」過真實內容級 5T 閘門 (非只查布林欄位)
 *
 * 複刻自 omni-agent gates.ts:
 *   - GATE_MIN_LENGTH (各維度最低字數)
 *   - GATE_PATTERNS (品質特徵正則)
 *   - createAgentHash (SHA256)
 * 目的: OA 框架獨立可驗證, 不依賴未 build 的 workspace 包
 */
import { createHash } from 'node:crypto';

export type FiveTDimension = 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';

export interface FiveTVerificationResult {
  passed: boolean;
  issues: string[];
  gate: FiveTDimension;
  score: number;
}

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

const FIVE_T_GATES: FiveTDimension[] = [
  'traceable', 'transparent', 'tangible', 'trustworthy', 'trackable',
];

/** 對齊 omni-agent gates.ts verifyGate: 單維度內容閘門 */
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
    issues.push(`缺少 ${gate} 品質特徵模式`);
  }

  if (gate === 'trustworthy' && (!contentHash || contentHash.length < 16)) {
    issues.push('缺少或無效的內容 Hash（信任閘門要求）');
  }

  const base = gate === 'trustworthy' ? 0.9 : 0.8;
  const score = Math.max(0, Math.round((base - issues.length * 0.15) * 100) / 100);
  return { passed: issues.length === 0, issues, gate, score };
}

/** 對齊 omni-agent verifyAllGates: 全部 5T 維度 */
export function verifyAllGates(content: string, contentHash?: string): FiveTVerificationResult[] {
  return FIVE_T_GATES.map((g) => verifyGate(g, content, contentHash));
}

export function isAllGatesPassed(results: FiveTVerificationResult[]): boolean {
  return results.length === 5 && results.every((r) => r.passed);
}

/** 對齊 omni-agent createAgentHash */
export function createAgentHash(data: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
