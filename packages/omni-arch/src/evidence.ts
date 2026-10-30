/**
 * OmniEvidence — 證據佐證庫 / 零幻覺驗算存證 (維度二: 邊界實體語義)
 *
 * 每個宣稱必須附可重算的驗算式: 輸入 + 公式重算 + 期望值比對,
 * 通過者以 IComponentCore + Hash Lock 封存為證據 (如 ISO-14064-1 碳盤查)。
 */
import { computeHash, createComponentCore, sealComponentCore, type Evidence, type IComponentCore } from '@esggo/omni-core';

export interface VerificationInputs {
  readonly [key: string]: number;
}

export interface Verification {
  readonly core: IComponentCore;
  readonly standard: Evidence['standard'];
  readonly inputs: VerificationInputs;
  readonly formula: string;
  readonly expected: number;
  readonly actual: number;
  readonly passed: boolean;
}

export interface VerifyOptions {
  readonly standard: Evidence['standard'];
  readonly formula: (inputs: VerificationInputs) => number;
  readonly formulaName: string;
  readonly inputs: VerificationInputs;
  readonly expected: number;
  readonly tolerance?: number;
}

export class OmniEvidence {
  private readonly verifications: Verification[] = [];

  async verify(options: VerifyOptions): Promise<Readonly<Verification>> {
    const actual = options.formula(options.inputs);
    const tolerance = options.tolerance ?? 1e-6;
    const passed = Math.abs(actual - options.expected) <= tolerance;
    const core = createComponentCore('omni-arch://omni-evidence');
    const sealed = await sealComponentCore(core);
    const verification: Verification = Object.freeze({
      core: sealed,
      standard: options.standard,
      inputs: Object.freeze({ ...options.inputs }),
      formula: options.formulaName,
      expected: options.expected,
      actual,
      passed,
    });
    this.verifications.push(verification);
    return verification;
  }

  records(): readonly Verification[] {
    return [...this.verifications];
  }

  /** 驗算存證雜湊: 對通過之驗算內容取 SHA-256, 供外部獨立複核 */
  attestationHash(verification: Readonly<Verification>): string {
    return computeHash({
      standard: verification.standard,
      inputs: verification.inputs,
      formula: verification.formula,
      expected: verification.expected,
      actual: verification.actual,
      passed: verification.passed,
    });
  }
}