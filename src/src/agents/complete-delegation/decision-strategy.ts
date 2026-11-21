/**
 * ==========================================
 * 完全代主自行 - 決策策略（pluggable）
 * ==========================================
 *
 * 控制 makeDecision 如何從候選方案中選擇最佳者。
 * 預設 balanced（原行為）；可切換 conservative / aggressive。
 */

import { DecisionContext, DecisionOption } from '../../types/complete-delegation';

export type DecisionStrategyName = 'conservative' | 'balanced' | 'aggressive';

export interface DecisionStrategy {
  readonly name: DecisionStrategyName;
  select(options: DecisionOption[], context: DecisionContext): DecisionOption;
}

function byScoreDesc(a: DecisionOption, b: DecisionOption): number {
  return (b.score ?? 0) - (a.score ?? 0);
}

/** 平衡策略：評分為主，成本/風險為次要（原預設行為） */
export class BalancedStrategy implements DecisionStrategy {
  readonly name = 'balanced' as const;
  select(options: DecisionOption[]): DecisionOption {
    if (options.length === 0) throw new Error('No valid options available');
    return [...options].sort((a, b) => {
      const s = byScoreDesc(a, b);
      if (s !== 0) return s;
      return (a.cost ?? 0) - (b.cost ?? 0) || (a.risk ?? 0) - (b.risk ?? 0);
    })[0];
  }
}

/** 保守策略：優先最低風險，其次最低成本，最後評分 */
export class ConservativeStrategy implements DecisionStrategy {
  readonly name = 'conservative' as const;
  select(options: DecisionOption[]): DecisionOption {
    if (options.length === 0) throw new Error('No valid options available');
    return [...options].sort((a, b) => {
      const r = (a.risk ?? 0) - (b.risk ?? 0);
      if (r !== 0) return r;
      const c = (a.cost ?? 0) - (b.cost ?? 0);
      if (c !== 0) return c;
      return byScoreDesc(a, b);
    })[0];
  }
}

/** 激進策略：優先最高評分，可容忍較高風險 */
export class AggressiveStrategy implements DecisionStrategy {
  readonly name = 'aggressive' as const;
  select(options: DecisionOption[]): DecisionOption {
    if (options.length === 0) throw new Error('No valid options available');
    return [...options].sort((a, b) => {
      const s = byScoreDesc(a, b);
      if (s !== 0) return s;
      return (b.risk ?? 0) - (a.risk ?? 0) || (a.cost ?? 0) - (b.cost ?? 0);
    })[0];
  }
}

export function createDecisionStrategy(
  name: DecisionStrategyName | DecisionStrategy = 'balanced'
): DecisionStrategy {
  if (typeof name !== 'string') return name;
  switch (name) {
    case 'conservative':
      return new ConservativeStrategy();
    case 'aggressive':
      return new AggressiveStrategy();
    default:
      return new BalancedStrategy();
  }
}
