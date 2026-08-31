/**
 * src/lib/omnitag-contract.ts — §20 OmniTag 萬能標籤契約自動校驗
 *
 * 承接 soul.md §20.2 六大維度與 §20.5 驗證規則。
 * 本模組為純函式、零外部依賴，供 5T 驗算陣列 (25-30) 在產物誕生時
 * 自動稽核「必備三枚」與凍結不可改等契約，對齊 §20.5 規則 1-5。
 *
 * [agent:25][squad:5T驗算][lifecycle:active][p2][platform:esggo][best-practice:结界]
 */

// ── §20.2 六大維度定義 ──────────────────────────────────────
export type OmnitagSecurity = 'public' | 'internal' | 'confidential' | 'restricted';
export type OmnitagLifecycle = 'draft' | 'active' | 'frozen' | 'archived';
export type OmnitagPriority = 'p0' | 'p1' | 'p2' | 'p3';
export type OmnitagPlatform = 'esggo' | 'omni' | 'vps' | 'firebase';

export interface OmniTagSet {
  /** 代理歸屬: agent:01 ~ agent:30 */
  agent?: string;
  /** 陣列歸屬: 智庫聖所 / 符文契約 / 光之羽翼 / 煉金熵減 / 5T驗算 */
  squad?: string;
  /** 安全分級 */
  security?: OmnitagSecurity;
  /** 生命週期 */
  lifecycle?: OmnitagLifecycle;
  /** 品質分級 */
  priority?: OmnitagPriority;
  /** 平台環境 */
  platform?: OmnitagPlatform;
  /** 結界繼承 */
  bestPractice?: 'awakened' | '结界';
}

export interface ContractCheck {
  valid: boolean;
  violations: string[];
}

const AGENT_ID_RE = /^agent:(0?[1-9]|[12][0-9]|30)$/;
const SQUAD_SET = new Set([
  '智庫聖所',
  '符文契約',
  '光之羽翼',
  '煉金熵減',
  '5T驗算',
]);

/**
 * §20.5 規則 1 — 必備三枚自動校驗
 * 每筆產物至少 agent:* + lifecycle:* + p* 三枚，缺一即不合約。
 */
export function validateRequiredTriad(tag: OmniTagSet): ContractCheck {
  const violations: string[] = [];

  if (!tag.agent || !AGENT_ID_RE.test(tag.agent)) {
    violations.push('Missing required [agent:*] (agent:01~agent:30)');
  }
  if (!tag.lifecycle) {
    violations.push('Missing required [lifecycle:*] (draft/active/frozen/archived)');
  }
  if (!tag.priority) {
    violations.push('Missing required [p*] (p0/p1/p2/p3)');
  }

  return { valid: violations.length === 0, violations };
}

/**
 * §20.5 規則 2 — 凍結不可改
 * lifecycle:frozen + restricted 的產物禁止任何修改。
 * 傳入 attemptedMutation=true 表示試圖修改，應被拒絕。
 */
export function enforceFrozenLock(
  tag: OmniTagSet,
  attemptedMutation: boolean,
): ContractCheck {
  const violations: string[] = [];
  const isSealed = tag.lifecycle === 'frozen' && tag.security === 'restricted';
  if (isSealed && attemptedMutation) {
    violations.push('H4 frozen: lifecycle:frozen + restricted artifact is immutable');
  }
  return { valid: violations.length === 0, violations };
}

/**
 * §20.5 規則 3 — 結界自動繼承
 * 標記 best-practice:结界 後，全部子代理自動 inheriting。
 * 回傳該標籤組是否處於結界繼承態。
 */
export function isBarrierInherited(tag: OmniTagSet): boolean {
  return tag.bestPractice === '结界';
}

/**
 * §20.5 規則 4 — 熵減連動
 * p0 任務完成後，熵值必須下降。此處做靜態契約檢查：
 * 若 priority=p0 且聲稱已完成 (completed=true)，必須附 entropyAfter < entropyBefore。
 */
export function validateEntropyReduction(
  tag: OmniTagSet,
  opts: { completed: boolean; entropyBefore: number; entropyAfter: number },
): ContractCheck {
  const violations: string[] = [];
  if (tag.priority === 'p0' && opts.completed) {
    if (!(opts.entropyAfter < opts.entropyBefore)) {
      violations.push('p0 completed but entropy did not decrease (< 0.1 target)');
    }
  }
  return { valid: violations.length === 0, violations };
}

/**
 * §20.5 規則 5 — 稽核抽驗聚合
 * 對一組標籤做合約率稽核，目標 100%。
 */
export function auditContractRate(tags: OmniTagSet[]): {
  total: number;
  compliant: number;
  rate: number;
} {
  const compliant = tags.filter(
    (t) => validateRequiredTriad(t).valid,
  ).length;
  const total = tags.length;
  const rate = total === 0 ? 1 : compliant / total;
  return { total, compliant, rate };
}

/**
 * 全量契約校驗（§20.5 規則 1-5 彙整）。
 * 供 5T 驗算陣列在產物誕生/變更時呼叫。
 */
export function verifyOmniTagContract(
  tag: OmniTagSet,
  ctx?: {
    attemptedMutation?: boolean;
    completed?: boolean;
    entropyBefore?: number;
    entropyAfter?: number;
  },
): ContractCheck {
  const allViolations: string[] = [];

  allViolations.push(...validateRequiredTriad(tag).violations);
  if (ctx?.attemptedMutation) {
    allViolations.push(...enforceFrozenLock(tag, true).violations);
  }
  if (ctx?.completed && ctx.entropyBefore != null && ctx.entropyAfter != null) {
    allViolations.push(
      ...validateEntropyReduction(tag, {
        completed: ctx.completed,
        entropyBefore: ctx.entropyBefore,
        entropyAfter: ctx.entropyAfter,
      }).violations,
    );
  }

  return { valid: allViolations.length === 0, violations: allViolations };
}

// ── §20.4 自動路由（Auto-Routing） ──────────────────────────
// 將 agent 編號 + squad 對齊五大陣列，路由至對應治理動作。
// 對齊 §20.4 路由表與 §6.2 預設即合規。

export type SquadName =
  | '智庫聖所'
  | '符文契約'
  | '光之羽翼'
  | '煉金熵減'
  | '5T驗算';

export interface RouteTarget {
  squad: SquadName;
  /** 治理動作描述 */
  action: string;
  /** 路由鍵（用於 Trackable 維度追蹤） */
  routeKey: string;
}

/** agent:01~30 → 所屬陣列 */
export function squadOfAgent(agent: string): SquadName | null {
  const m = agent.match(/^agent:0*(\d{1,2})$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n < 1 || n > 30) return null;
  if (n <= 6) return '智庫聖所';
  if (n <= 12) return '符文契約';
  if (n <= 18) return '光之羽翼';
  if (n <= 24) return '煉金熵減';
  return '5T驗算';
}

const ROUTE_TABLE: Record<SquadName, RouteTarget> = {
  智庫聖所: { squad: '智庫聖所', action: '永憶聖所 / 記憶召回', routeKey: 'memory-recall' },
  符文契約: { squad: '符文契約', action: 'API / TypeScript / 型別安全', routeKey: 'typescript-contract' },
  光之羽翼: { squad: '光之羽翼', action: '部署 / cron / 自動化代行', routeKey: 'auto-deploy' },
  煉金熵減: { squad: '煉金熵減', action: '重構 / lint / 熵減煉金', routeKey: 'entropy-forge' },
  '5T驗算': { squad: '5T驗算', action: 'ISO / Hash Lock / 稽核', routeKey: 'audit-lock' },
};

/**
 * §20.4 自動路由解析。
 * 優先以 agent 編號決定陣列；若 agent 缺漏則退用 squad 字面值。
 * best-practice:结界 標記時，繼承旗標全體擴散。
 */
export function routeOmniTag(tag: OmniTagSet): {
  target: RouteTarget | null;
  barrierInherited: boolean;
  /** 路由是否與標籤自述 squad 一致 */
  consistent: boolean;
} {
  const barrierInherited = isBarrierInherited(tag);
  const byAgent = tag.agent ? squadOfAgent(tag.agent) : null;
  const bySquad = (tag.squad as SquadName) ?? null;
  const resolved = byAgent ?? bySquad;
  const target = resolved ? ROUTE_TABLE[resolved] : null;
  const consistent = byAgent == null || bySquad == null || byAgent === bySquad;
  return { target, barrierInherited, consistent };
}
