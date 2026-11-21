/**
 * fiveTUtil — 5T 驗證閘工具 (對齊 bus.ts bus5TGate + §12 各模式 5T 對應)
 *
 * 提取 bus.ts 的閘門邏輯為可複用工具, 供 6 個進階整合模式共用,
 * 避免重複實作 (DRY + 結界擴散: 新模式自動 inheriting 5T 規範)。
 *
 * 5T 對齊 (omni-agent gates.ts):
 *   traceable≥100 / transparent≥150 / tangible≥200 / trustworthy≥120 / trackable≥80
 */
import { createHash } from 'node:crypto';
import type { FiveTDimension, FiveTResult } from './types.js';
import type { OATaskResult } from '../types.js';

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

const GATES: FiveTDimension[] = ['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'];

/** 單維度閘門 (對齊 omni-agent verifyGate) */
export function verifyGate(gate: FiveTDimension, content: string, hash?: string): boolean {
  if (!content || content.length < GATE_MIN_LENGTH[gate]) return false;
  if (GATE_PATTERNS[gate] && !GATE_PATTERNS[gate].test(content)) return false;
  if (gate === 'trustworthy' && (!hash || hash.length < 16)) return false;
  return true;
}

/** 5T 驗證: 對內容做內容級驗證 + SHA256 */
export function verify5T(content: string): FiveTResult {
  const hash = createHash('sha256').update(content).digest('hex');
  const failed = GATES.filter((g) => !verifyGate(g, content, hash));
  return { pass: failed.length === 0, failed };
}

/** 對 OATaskResult 做 5T 驗證 (對齊 bus.bus5TGate) */
export function bus5TGateLocal(result: OATaskResult): FiveTResult {
  const hash = createHash('sha256').update(result.output).digest('hex');
  const failed = GATES.filter((g) => !verifyGate(g, result.output, hash));
  return { pass: failed.length === 0, failed };
}

/** 產生 SHA256 hash lock (Trustworthy 不可篡改) */
export function hashLock(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
