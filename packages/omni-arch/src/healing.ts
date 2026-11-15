/**
 * OmniHealing — 戒嚴與自癒 (維度四: 安全自癒治理)
 *
 * 集體免疫的中樞: sys.martial_law 全域戒嚴 (全體 OA 唯讀鎖定) +
 * 混沌自癒 (復用 omni-core R7 LearningLoop + ChaosEngine):
 * 失敗先查聖典模板 (觸類旁通), 未命中自癒後結晶沉澱新模板。
 */
import { ChaosEngine, LearningLoop } from '@esggo/omni-core';
import { OmniArchError } from './types';

export type HealOutcome = 'passed' | 'learned' | 'crystallized';

export class OmniHealing {
  private readonly learning = new LearningLoop();
  private readonly chaos: ChaosEngine;
  private locked = false;
  private reason: string | undefined;
  private readonly onStateChange?: (locked: boolean, reason: string | undefined) => void;

  constructor(onStateChange?: (locked: boolean, reason: string | undefined) => void) {
    this.chaos = new ChaosEngine(this.learning);
    this.onStateChange = onStateChange;
  }

  /** 全域戒嚴: 廣播 sys.martial_law, 全體 OA 唯讀鎖定 */
  declareMartialLaw(reason: string): void {
    if (reason === '') {
      throw new OmniArchError('E_REASON_REQUIRED', '戒嚴必須附帶原因 (可追溯)');
    }
    this.locked = true;
    this.reason = reason;
    this.onStateChange?.(this.locked, this.reason);
  }

  liftMartialLaw(): void {
    this.locked = false;
    const previous = this.reason;
    this.reason = undefined;
    this.onStateChange?.(this.locked, previous);
  }

  isLocked(): boolean {
    return this.locked;
  }

  lockReason(): string | undefined {
    return this.reason;
  }

  /** 混沌自癒: 主動突變測試, 未命中模板即自癒結晶 */
  async heal(failureSignature: string, probe: () => Promise<void>): Promise<HealOutcome> {
    return this.chaos.injectMutation(probe, failureSignature);
  }

  templateCount(): number {
    return this.learning.templateCount();
  }
}