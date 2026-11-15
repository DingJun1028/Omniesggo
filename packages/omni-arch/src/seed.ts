/**
 * OmniSeed — 萬能種子 (細胞分裂母體)
 *
 * 基因藍圖 + germinateAgent / germinateComponent:
 * 分裂出的子代攜帶母代 uuid 血脈與世代計數, 各自取得新 uuid
 * (子代互不影響, 天生快照隔離), 並經 sealComponentCore Hash Lock 刻印。
 */
import { createComponentCore, sealComponentCore, type IComponentCore } from '@esggo/omni-core';

export type SeedKind = 'agent' | 'component';

export interface SeedDna {
  readonly kind: SeedKind;
  readonly traits: readonly string[];
  readonly parentUuid?: string;
}

export interface Germinated<T extends SeedDna> extends IComponentCore {
  readonly kind: T['kind'];
  readonly traits: readonly string[];
  readonly parentUuid: string | undefined;
  readonly generation: number;
}

export class OmniSeed {
  private readonly generations = new Map<SeedKind, number>();

  private async germinate<T extends SeedDna>(
    dna: T,
    sourceOrigin: string
  ): Promise<Readonly<Germinated<T>>> {
    const generation = (this.generations.get(dna.kind) ?? 0) + 1;
    this.generations.set(dna.kind, generation);
    const core = createComponentCore(sourceOrigin);
    const child: Germinated<T> = {
      ...core,
      kind: dna.kind,
      traits: Object.freeze([...dna.traits]),
      parentUuid: dna.parentUuid,
      generation,
    };
    return (await sealComponentCore(child)) as Readonly<Germinated<T>>;
  }

  async germinateAgent(dna: SeedDna): Promise<Readonly<Germinated<SeedDna>>> {
    return this.germinate({ ...dna, kind: 'agent' }, 'omni-arch://omni-seed/agent');
  }

  async germinateComponent(dna: SeedDna): Promise<Readonly<Germinated<SeedDna>>> {
    return this.germinate({ ...dna, kind: 'component' }, 'omni-arch://omni-seed/component');
  }

  generationOf(kind: SeedKind): number {
    return this.generations.get(kind) ?? 0;
  }
}