/**
 * @esggo/omni-forge v1.0.0
 *
 * 熵減煉金 + 代碼自省
 * MECE 角色: 治理熵減層 (Trust Object.freeze)
 */

import {
  createComponentCore,
  sealComponentCore,
  verifySeal,
  type IComponentCore,
} from '@esggo/omni-core';

export type DebtType =
  | 'dead-code'
  | 'duplicate-code'
  | 'untracked-deps'
  | 'missing-types'
  | 'circular-deps'
  | 'oversized-files';

export type DebtSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface DebtItem {
  type: DebtType;
  path: string;
  severity: DebtSeverity;
  line_count: number;
  suggestion: string;
}

export interface EntropyReport extends IComponentCore {
  entropy_before: number;
  entropy_after: number;
  reduction_percent: number;
  debt_items: DebtItem[];
}

export interface ContractViolation {
  rule: string;
  line: number;
  severity: DebtSeverity;
}

export interface ContractLintResult {
  file: string;
  violations: ContractViolation[];
}

/**
 * OmniForge: 熵減治理引擎
 */
export class OmniForge {
  /**
   * 測量當前系統熵值 (簡化實作: 計算 debt items 加權)
   */
  async measureEntropy(debtItems: DebtItem[] = []): Promise<EntropyReport> {
    const severityWeight: Record<DebtSeverity, number> = {
      critical: 0.1,
      high: 0.05,
      medium: 0.02,
      low: 0.01,
    };

    const entropy = Math.min(
      1.0,
      debtItems.reduce((sum, d) => sum + severityWeight[d.severity], 0)
    );

    const core = createComponentCore(`omni-forge://entropy/measure`);
    const sealed = await sealComponentCore(core);

    const report: EntropyReport = {
      ...sealed,
      entropy_before: entropy,
      entropy_after: entropy, // 量測不變更熵值
      reduction_percent: 0,
      debt_items: debtItems,
    };

    return report;
  }

  /**
   * 執行熵減煉金 (自動清理)
   * 簡化: 移除 critical/high items
   */
  async forgeEntropy(dryRun = true, debtItems: DebtItem[] = []): Promise<EntropyReport> {
    const remaining = dryRun
      ? debtItems
      : debtItems.filter((d) => d.severity !== 'critical' && d.severity !== 'high');

    const beforeReport = await this.measureEntropy(debtItems);
    const afterReport = await this.measureEntropy(remaining);

    const reductionPercent =
      beforeReport.entropy_before > 0
        ? ((beforeReport.entropy_before - afterReport.entropy_after) /
            beforeReport.entropy_before) *
          100
        : 0;

    const core = createComponentCore(`omni-forge://entropy/forge?dryRun=${dryRun}`);
    const sealed = await sealComponentCore(core);

    return {
      ...sealed,
      entropy_before: beforeReport.entropy_before,
      entropy_after: afterReport.entropy_after,
      reduction_percent: reductionPercent,
      debt_items: remaining,
    };
  }

  /**
   * 對元件執行 Hash Lock + Object.freeze (Trust)
   */
  async seal<T extends IComponentCore>(component: T): Promise<Readonly<T>> {
    return sealComponentCore(component);
  }

  /**
   * 驗證元件仍維持不可篡改
   */
  async verify(component: Readonly<IComponentCore>): Promise<boolean> {
    return verifySeal(component);
  }

  /**
   * 合約 Linter (簡化: 檢查 source_origin 是否存在)
   */
  lintContract(components: IComponentCore[]): ContractLintResult[] {
    return components
      .filter((c) => !c.source_origin || c.source_origin.trim() === '')
      .map((c) => ({
        file: c.source_origin || 'unknown',
        violations: [
          {
            rule: 'IComponentCore.source_origin must be non-empty (Traceable)',
            line: 0,
            severity: 'high' as DebtSeverity,
          },
        ],
      }));
  }

  /**
   * 觸發演進循環 (每週跑)
   * 簡化: measure + forge + lint
   */
  async evolve(debtItems: DebtItem[] = [], components: IComponentCore[] = []): Promise<{
    entropy: EntropyReport;
    lintResults: ContractLintResult[];
  }> {
    const entropy = await this.forgeEntropy(true, debtItems);
    const lintResults = this.lintContract(components);
    return { entropy, lintResults };
  }
}

/**
 * 預設單例
 */
export const omniForge = new OmniForge();
