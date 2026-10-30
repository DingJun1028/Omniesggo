/**
 * OmniArch — 萬能架構 (MECE 調度規則)
 *
 * 組裝 12大萬能模組 + 頂層 (Engine/Theme/Seed/UserRegistry/Heart/Brain):
 * - 四大維度各三模組, 共 12, MECE 不重不漏 (moduleTopology 可驗收)。
 * - 戒嚴廣播: OmniHealing 狀態變化 → bus 發佈 sys.martial_law,
 *   並由 OmniTheme 於 current()/set() 強制防護色。
 * - 契約執行: ensureContract 驗證 IComponentCore 形狀 + deepFreeze。
 */
import { deepFreeze } from '@esggo/omni-core';
import { OmniArchError } from './types';
import { MODULE_IDS } from './types';
import type { BusEvent, ModuleId, OmniDimension } from './types';
import { OmniBase } from './base';
import { OmniMemory } from './memory';
import { OmniTime } from './time';
import { OmniComponent } from './component';
import { OmniTagRegistry } from './tag';
import { OmniEvidence } from './evidence';
import { OmniAgent } from './agent';
import { OmniAPI } from './api';
import { OmniBus } from './bus';
import { OmniGateway } from './gateway';
import { OmniHealing } from './healing';
import { OmniEvolution } from './evolution';
import { OmniSeed } from './seed';
import { OmniUserRegistry } from './user-registry';
import { OmniTheme } from './theme';
import { OmniEngine } from './engine';
import { OmniBrain, OmniHeart } from './heart';

const TOPOLOGY: Readonly<Record<OmniDimension, readonly ModuleId[]>> = Object.freeze({
  physical: ['OmniBase', 'OmniMemory', 'OmniTime'],
  semantic: ['OmniComponent', 'OmniTag', 'OmniEvidence'],
  dynamic: ['OmniAgent', 'OmniAPI', 'OmniBus'],
  governance: ['OmniGateway', 'OmniHealing', 'OmniEvolution'],
});

const CONTRACT_FIELDS = ['uuid', 'version', 'timestamp', 'source_origin'] as const;

export interface ArchWire {
  readonly base: OmniBase;
  readonly memory: OmniMemory;
  readonly time: OmniTime;
  readonly component: OmniComponent;
  readonly tags: OmniTagRegistry;
  readonly evidence: OmniEvidence;
  readonly agent: OmniAgent;
  readonly api: OmniAPI;
  readonly bus: OmniBus;
  readonly gateway: OmniGateway;
  readonly healing: OmniHealing;
  readonly evolution: OmniEvolution;
  readonly seed: OmniSeed;
  readonly userRegistry: OmniUserRegistry;
  readonly theme: OmniTheme;
  readonly engine: OmniEngine;
  readonly heart: OmniHeart;
  readonly brain: OmniBrain;
}

export class OmniArch {
  readonly topology: Readonly<Record<OmniDimension, readonly ModuleId[]>> = TOPOLOGY;

  private constructor(readonly wire: ArchWire) {}

  static germinate(): OmniArch {
    const bus = new OmniBus();
    const time = new OmniTime();

    // 戒嚴廣播接線: healing 狀態變化 → bus sys.martial_law + time 裂縫留痕
    const healing = new OmniHealing((locked, reason) => {
      const event: BusEvent = {
        uuid: `sys.martial_law.${Date.now()}`,
        version: '1.0.0',
        timestamp: Date.now(),
        source_origin: 'omni-arch://omni-healing',
        topic: 'sys.martial_law',
        payload: { locked, reason },
      };
      void bus.publish(event);
      time.append(event);
    });
    const theme = new OmniTheme(() => healing.isLocked());
    const gateway = new OmniGateway(healing);
    const evolution = new OmniEvolution(() => {
      const fromBus = bus.journalUuids();
      const fromTime = time.journalUuids();
      return [...fromBus, ...fromTime];
    });
    const base = new OmniBase();
    const memory = new OmniMemory();
    const component = new OmniComponent();
    const tags = new OmniTagRegistry();
    const evidence = new OmniEvidence();
    const agent = new OmniAgent();
    const api = new OmniAPI();
    const seed = new OmniSeed();
    const userRegistry = new OmniUserRegistry();

    const engine = new OmniEngine(healing, evolution, theme);
    const heart = new OmniHeart(
      { memory, tags, userRegistry },
      { agent, seed },
      { bus, time },
      { api, gateway, evidence }
    );
    const brain = new OmniBrain(base, healing, evolution, theme);

    // 容器註冊 (MECE: 一模組一席)
    base.register('OmniBase', base);
    base.register('OmniMemory', memory);
    base.register('OmniTime', time);
    base.register('OmniComponent', component);
    base.register('OmniTag', tags);
    base.register('OmniEvidence', evidence);
    base.register('OmniAgent', agent);
    base.register('OmniAPI', api);
    base.register('OmniBus', bus);
    base.register('OmniGateway', gateway);
    base.register('OmniHealing', healing);
    base.register('OmniEvolution', evolution);

    const wire: ArchWire = {
      base,
      memory,
      time,
      component,
      tags,
      evidence,
      agent,
      api,
      bus,
      gateway,
      healing,
      evolution,
      seed,
      userRegistry,
      theme,
      engine,
      heart,
      brain,
    };
    return new OmniArch(wire);
  }

  /** MECE 驗收: 四維度 × 3 模組 = 12, 與 MODULE_IDS 一致不重不漏 */
  verifyTopology(): boolean {
    const flattened = Object.values(TOPOLOGY).flat();
    const unique = new Set(flattened);
    return flattened.length === MODULE_IDS.length && unique.size === MODULE_IDS.length;
  }

  /** 契約執行: IComponentCore 形狀驗證 + deepFreeze (核心禁區) */
  ensureContract<T extends { uuid: string; version: string; timestamp: number; source_origin: string }>(
    component: T
  ): Readonly<T> {
    for (const field of CONTRACT_FIELDS) {
      const value = component[field];
      if (value === undefined || value === null || value === '') {
        throw new OmniArchError('E_CONTRACT_SHAPE', `元件缺 ${field} 欄位, 契約不成立`);
      }
    }
    return deepFreeze(component);
  }
}