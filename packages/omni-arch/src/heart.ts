/**
 * OmniHeart × OmniBrain — 生命體頂層編排
 *
 * OmniHeart (全通之心):
 *   OmniEye  = Memory + Tag + UserRegistry (看見與記得)
 *   OmniCore = Agent + Seed (思考與繁殖)
 *   OmniPulse = Bus + Time (傳輸與時空)
 *   OmniBone = API + Gateway + Evidence (邊界與鐵律)
 * OmniBrain (全息之腦): OmniBase + OmniHealing + OmniEvolution + OmniTheme
 *   — 熵減煉金、混沌突變測試、戒嚴時全域 UI 切換防護色。
 */
import type { OmniMemory } from './memory';
import type { OmniTagRegistry } from './tag';
import type { OmniUserRegistry } from './user-registry';
import type { OmniAgent } from './agent';
import type { OmniSeed } from './seed';
import type { OmniBus } from './bus';
import type { OmniTime } from './time';
import type { OmniAPI } from './api';
import type { OmniGateway } from './gateway';
import type { OmniEvidence } from './evidence';
import type { OmniBase } from './base';
import type { OmniHealing } from './healing';
import type { OmniEvolution } from './evolution';
import type { OmniTheme } from './theme';

export class OmniHeart {
  constructor(
    public readonly eye: {
      readonly memory: OmniMemory;
      readonly tags: OmniTagRegistry;
      readonly userRegistry: OmniUserRegistry;
    },
    public readonly coreAgent: {
      readonly agent: OmniAgent;
      readonly seed: OmniSeed;
    },
    public readonly pulse: {
      readonly bus: OmniBus;
      readonly time: OmniTime;
    },
    public readonly bone: {
      readonly api: OmniAPI;
      readonly gateway: OmniGateway;
      readonly evidence: OmniEvidence;
    }
  ) {}
}

export class OmniBrain {
  constructor(
    public readonly base: OmniBase,
    public readonly healing: OmniHealing,
    public readonly evolution: OmniEvolution,
    public readonly theme: OmniTheme
  ) {}
}