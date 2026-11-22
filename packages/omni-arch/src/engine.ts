/**
 * OmniEngine — 萬能引擎 (OmniHealing + OmniEvolution 心臟)
 *
 * 心跳週期: 混沌自癒探針 + 每週熵減 + 主題同步, 一次心跳產出
 * 可驗收的 EnginePulse (零幻覺: 全域指標皆可由 journal 獨立重算)。
 */
import type { EntropyMetrics } from '@esggo/omni-core';
import type { HealOutcome } from './healing';
import type { OmniHealing } from './healing';
import type { OmniEvolution, EvolutionReport } from './evolution';
import type { OmniTheme } from './theme';
import type { ThemeState } from './types';

export interface EnginePulse {
  readonly heartbeatAt: string;
  readonly probe: HealOutcome;
  readonly entropy: EvolutionReport;
  readonly theme: ThemeState;
}

export class OmniEngine {
  private beats = 0;

  constructor(
    private readonly healing: OmniHealing,
    private readonly evolution: OmniEvolution,
    private readonly theme: OmniTheme
  ) {}

  async heartbeat(): Promise<EnginePulse> {
    this.beats += 1;
    const probe = await this.healing.heal(`sys.heartbeat::${this.beats}`, async () => undefined);
    const entropy = this.evolution.weeklyReduce();
    return {
      heartbeatAt: new Date().toISOString(),
      probe,
      entropy,
      theme: this.theme.current(),
    };
  }

  beatCount(): number {
    return this.beats;
  }

  entropyMetrics(): EntropyMetrics {
    return this.evolution.weeklyReduce();
  }
}