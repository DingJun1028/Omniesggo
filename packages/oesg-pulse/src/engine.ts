/**
 * OesgPulseEngine — OESG-Pulse 碳排脈動引擎
 *
 * OESG 五路線圖首站: Pulse (碳排監控) → Report → Audit → Exchange → DAO。
 * 復用 12大萬能模組管線 (@esggo/omni-arch), 不重造任何輪子:
 * - OmniAgent: 註冊意圖 oesg.pulse.sweep (可由 agent.understand 觸發)
 * - OmniEvidence: ISO-14064-1 零幻覺驗算 (activity × factor 逐筆重算)
 * - OmniMemory: 脈動結晶留痕 (tags: oesg/pulse/carbon)
 * - OmniBus: 廣播 oesg.pulse.tick (下游 Report/Audit 訂閱)
 * - OmniHealing: 戒嚴期間拒絕脈動 (治理鐵律)
 * - OmniGateway: egress Hash Lock 封裝 (對外發布前封印)
 */
import { computeHash } from '@esggo/omni-core';
import {
  mintEvent,
  OmniArchError,
  type ArchWire,
} from '@esggo/omni-arch';
import {
  PulseError,
  type PulsePeriod,
  type PulseReading,
  type PulseSink,
  type PulseSinkFailure,
  type PulseSource,
  type PulseTick,
  type ScopeEmission,
} from './types';

export interface OesgPulseConfig {
  readonly orgId: string;
  readonly sources: readonly PulseSource[];
  readonly sinks: readonly PulseSink[];
  readonly sourceOrigin?: string;
}

const EMISSION_STANDARD = 'ISO-14064-1';
const FORMULA_NAME = 'activity_data × emission_factor';
const TOPIC_TICK = 'oesg.pulse.tick';
const INTENT_SWEEP = 'oesg.pulse.sweep';

export class OesgPulseEngine {
  readonly orgId: string;
  private readonly wire: ArchWire;
  private readonly sources: readonly PulseSource[];
  private readonly sinks: readonly PulseSink[];
  private readonly sourceOrigin: string;

  constructor(wire: ArchWire, config: OesgPulseConfig) {
    if (!config.orgId) {
      throw new PulseError('E_PULSE_ORG', 'orgId 為必填, 脈動無主不成立');
    }
    if (config.sources.length === 0) {
      throw new PulseError('E_PULSE_SOURCE', '至少需要一個 PulseSource, MECE 不漏');
    }
    this.wire = wire;
    this.orgId = config.orgId;
    this.sources = [...config.sources];
    this.sinks = [...config.sinks];
    this.sourceOrigin = config.sourceOrigin ?? 'oesg://pulse';
  }

  /** 註冊代理意圖: agent.understand('oesg.pulse.sweep', {period}) 即觸發全源脈動 */
  registerIntent(): void {
    this.wire.agent.onIntent(INTENT_SWEEP, async (args: { period: PulsePeriod }) =>
      this.sweep(args.period)
    );
  }

  /** 全源脈動: 讀取 → 驗算 → 彙總 → 結晶 → 留痕 → 廣播 → 寫出 */
  async sweep(period: PulsePeriod): Promise<Readonly<PulseTick>> {
    if (period.end < period.start) {
      throw new PulseError('E_PULSE_PERIOD', '期間終點早於起點, 時空倒置不成立');
    }
    if (this.wire.healing.isLocked()) {
      throw new OmniArchError('E_MARTIAL_LAW', '戒嚴期間拒絕脈動寫入');
    }

    // [始] 收集原始清冊
    const readings: PulseReading[] = [];
    for (const source of this.sources) {
      readings.push(...(await source.read()));
    }
    if (readings.length === 0) {
      throw new PulseError('E_PULSE_EMPTY', '本期無任何活動數據, 脈動空轉不成立');
    }

    // [承] 逐筆 ISO-14064-1 驗算 (零幻覺: 每個宣稱附可重算式)
    let verified = true;
    const perScope: Record<string, number> = { S1: 0, S2: 0, S3: 0 };
    for (const reading of readings) {
      const kgCo2e = reading.activity * reading.factor;
      const verification = await this.wire.evidence.verify({
        standard: EMISSION_STANDARD,
        formula: (inputs) => inputs.activity * inputs.factor,
        formulaName: FORMULA_NAME,
        inputs: { activity: reading.activity, factor: reading.factor },
        expected: kgCo2e,
      });
      if (!verification.passed) {
        verified = false;
      }
      perScope[reading.scope] += kgCo2e;
    }

    // [轉] 範疇彙總
    const emissions: ScopeEmission[] = (['S1', 'S2', 'S3'] as const)
      .filter((scope) => perScope[scope] > 0)
      .map((scope) => ({ scope, kgCo2e: perScope[scope] }));
    const totalKgCo2e = Object.values(perScope).reduce((sum, value) => sum + value, 0);

    // [合] 結晶封存 (Hash Lock 溯源, 供 SLL 第三方稽核)
    const tick: PulseTick = Object.freeze({
      uuid: `oesg-pulse.${Date.now()}`,
      version: '1.0.0',
      timestamp: Date.now(),
      source_origin: this.sourceOrigin,
      orgId: this.orgId,
      periodStart: period.start,
      periodEnd: period.end,
      readings: Object.freeze([...readings]),
      emissions: Object.freeze(emissions),
      totalKgCo2e,
      verified,
      attestationHash: computeHash({ readings, totalKgCo2e, orgId: this.orgId }),
      failures: Object.freeze([]),
    });

    // [終] 留痕 + 廣播 + 寫出 (sink 失敗不毀 tick, 結晶留痕供自癒)
    await this.wire.memory.remember(`oesg://pulse/${tick.uuid}`, tick, [
      'oesg',
      'pulse',
      'carbon',
    ]);
    await this.wire.bus.publish(mintEvent(this.sourceOrigin, TOPIC_TICK, tick));

    const failures: PulseSinkFailure[] = [];
    for (const sink of this.sinks) {
      try {
        await sink.write(tick);
      } catch (error) {
        failures.push({ sinkId: sink.id, error: String(error) });
      }
    }
    if (failures.length > 0) {
      const sealed: PulseTick = Object.freeze({ ...tick, failures: Object.freeze(failures) });
      return sealed;
    }
    return tick;
  }

  /** 供 Report/Audit 下游訂閱脈動廣播 */
  subscribe(listener: (tick: Readonly<PulseTick>) => void): void {
    this.wire.bus.subscribe(TOPIC_TICK, (event) => listener(event.payload as PulseTick));
  }
}
