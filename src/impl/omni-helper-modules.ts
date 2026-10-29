import { OmniSeed, type SeedRecord } from '../lib/omni-seed';

export type AgentTemplate = {
  readonly archetype: 'agent' | 'component';
  readonly runeId: string;
  readonly config: Record<string, unknown>;
};

export class OmniAPI {
  private readonly runes = new Map<string, AgentTemplate>();

  register(template: AgentTemplate): void {
    this.runes.set(template.runeId, Object.freeze({ ...template }));
  }

  getRune(runeId: string): AgentTemplate | undefined {
    return this.runes.get(runeId);
  }

  listRunes(): readonly AgentTemplate[] {
    return Object.freeze(Array.from(this.runes.values()));
  }

  async invoke(runeId: string, payload: unknown): Promise<unknown> {
    const rune = this.runes.get(runeId);
    if (!rune) throw new Error(`Unknown rune: ${runeId}`);
    return Object.freeze({ runeId, acceptedAt: Date.now(), payload });
  }
}

export type BlackboardEntry = {
  readonly key: string;
  readonly value: unknown;
  readonly providerUuid: string;
  readonly updatedAt: number;
};

export class OmniBlackboard {
  private readonly board = new Map<string, BlackboardEntry>();

  getSharedKnowledge(key: string): unknown {
    return this.board.get(key)?.value;
  }

  contribute(key: string, value: unknown, providerUuid: string): void {
    const entry = Object.freeze({
      key,
      value: Object.freeze(value as object),
      providerUuid,
      updatedAt: Date.now(),
    } as BlackboardEntry);

    this.board.set(key, entry);
  }

  snapshot(): readonly BlackboardEntry[] {
    return Object.freeze(Array.from(this.board.values()));
  }
}

export type ImplHealingResult =
  | { status: 'repaired'; restoredUuid: string }
  | { status: 'failed'; reason: string };
// ts-matrix: 對外相容別名 (API 不變)
export type { ImplHealingResult as HealingResult };

export class OmniHealing {
  private readonly seedVault = new Map<string, SeedRecord>();
  private readonly regenerated = new Map<string, number>();
  private underMartialLaw = false;
  private reason = '';

  constructor(private readonly seedFactory: OmniSeed = new OmniSeed()) {}

  declareMartialLaw(reason: string): void {
    this.underMartialLaw = true;
    this.reason = reason;
    console.warn(`[OmniHealing] MARTIAL LAW ACTIVATED – ${reason}`);
  }

  liftMartialLaw(): void {
    this.underMartialLaw = false;
    this.reason = '';
    console.info('[OmniHealing] MARTIAL LAW LIFTED');
  }

  isUnderMartialLaw(): boolean {
    return this.underMartialLaw;
  }

  saveSeed(corruptedUuid: string, originalTemplate: Record<string, unknown>): SeedRecord {
    const seed = Object.freeze({
      id: corruptedUuid,
      type: 'company',
      payload: Object.freeze(originalTemplate),
      tags: ['healing', 'seed-vault'],
      createdAt: Date.now(),
    } as SeedRecord);

    this.seedVault.set(corruptedUuid, seed);
    return seed;
  }

  async autoRepair(corruptedUuid: string): Promise<ImplHealingResult> {
    const seed = this.seedVault.get(corruptedUuid);
    if (!seed) {
      return { status: 'failed', reason: `No seed found for ${corruptedUuid}` };
    }

    try {
      const restoredUuid = `repaired-${corruptedUuid}-${Date.now().toString(36)}`;
      const restored = Object.freeze({
        ...seed,
        id: restoredUuid,
        payload: Object.freeze({ ...(seed.payload as Record<string, unknown>), restoredFrom: corruptedUuid }),
      });

      this.seedVault.set(restoredUuid, restored);
      this.regenerated.set(restoredUuid, Date.now());
      this.liftMartialLaw();

      return { status: 'repaired', restoredUuid };
    } catch (error) {
      return { status: 'failed', reason: String(error) };
    }
  }
}

export type DebtMetric = {
  readonly measuredAt: number;
  readonly technicalDebt: number;
  readonly compliancePassed: boolean;
};

export class OmniEvolution {
  private readonly history: DebtMetric[] = [];
  private readonly approvedLicenses = new Set(['AGPL-3.0']);

  auditCompliance(agent: { readonly licenseTag?: string }): boolean {
    const license = agent.licenseTag ?? 'unknown';
    return this.approvedLicenses.has(license);
  }

  async sacrificeTechnicalDebt(amount = 0.1): Promise<DebtMetric> {
    const metric = Object.freeze({
      measuredAt: Date.now(),
      technicalDebt: amount,
      compliancePassed: true,
    } as DebtMetric);

    this.history.push(metric);
    return metric;
  }

  getMetrics(): readonly DebtMetric[] {
    return Object.freeze([...this.history]);
  }
}
