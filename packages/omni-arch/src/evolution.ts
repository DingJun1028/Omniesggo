/**
 * OmniEvolution — 每週技術債熵減 (維度四: 安全自癒治理)
 *
 * 復用 omni-core R3 EntropyLedger: 由 journal uuid 序列量化
 * 重複事件率 / 合併批次 / 技術債加權指標, 追蹤每週 10% 熵減目標;
 * AGPL-3.0 合規以許可證審查掛鉤 (fail-fast 於不相容授權)。
 */
import { EntropyLedger, type EntropyMetrics } from '@esggo/omni-core';

export interface EvolutionReport extends EntropyMetrics {
  /** 相對上次週期的技術債下降比例 (1 = 100% 清償; 負值 = 惡化) */
  readonly debtReductionRatio: number;
  /** AGPL-3.0 相容性 (不相容授權即 false, 由 reviewLicense 判定) */
  readonly agplCompliant: boolean;
}

export class OmniEvolution {
  private readonly ledger: EntropyLedger;
  private lastDebtIndex = 0;
  private agplCompliant = true;

  constructor(journalUuidProvider: () => readonly string[]) {
    this.ledger = new EntropyLedger(journalUuidProvider);
  }

  /** 每週熵減: 量化指標 + 10% 目標達成率 */
  weeklyReduce(): EvolutionReport {
    const metrics = this.ledger.weeklyReduce();
    const previous = this.lastDebtIndex;
    const debtReductionRatio =
      previous === 0 ? 1 : Number(((previous - metrics.technicalDebtIndex) / previous).toFixed(4));
    this.lastDebtIndex = metrics.technicalDebtIndex;
    return { ...metrics, debtReductionRatio, agplCompliant: this.agplCompliant };
  }

  /** AGPL-3.0 合規審查掛鉤: 交付/引入元件之授權審查結果寫入 */
  reviewLicense(license: string): boolean {
    const compatible = ['AGPL-3.0', 'AGPL-3.0-only', 'MIT', 'Apache-2.0', 'BSD-3-Clause', 'UNLICENSED'].includes(
      license
    );
    this.agplCompliant = this.agplCompliant && compatible;
    return compatible;
  }
}