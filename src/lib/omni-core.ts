// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * OmniCore 輕量單例包裝。
 *
 * 職責：
 * - 延遲初始化 `src/core/omni-core.ts` 的 `OmniCore`
 * - 提供 async helper 給 API / UI 使用
 */

import { getOmniCore, type OmniCoreConfig } from '@/core/omni-core';

export type OmniCoreStatus = {
  initialized: boolean;
  singularity: unknown;
  key: { name: string; tier: string; enabled: boolean; frozen: boolean };
  soul: { name: string; state: string; alignment: unknown };
  vps: { host: string; entangled: boolean; quantum: string; services: Record<string, unknown> } | null;
  ecosystem: { registeredAgents: number; busStats: Record<string, unknown> };
};

let instance: import('@/core/omni-core').OmniCore | null = null;

export function getOrCreateInstance(config?: OmniCoreConfig): import('@/core/omni-core').OmniCore {
  if (!instance) {
    instance = getOmniCore(config);
  }
  return instance;
}

export async function getOmniCoreStatus(config?: OmniCoreConfig): Promise<OmniCoreStatus> {
  const core = getOrCreateInstance(config);
  return (core as unknown as { getStatus: () => Promise<OmniCoreStatus> }).getStatus();
}

export async function initializeOmniCore(config?: OmniCoreConfig): Promise<OmniCoreStatus> {
  const core = getOrCreateInstance(config);
  if (!(core as unknown as { initialized: boolean }).initialized) {
    await (core as unknown as { initialize: () => Promise<void> }).initialize();
  }
  return (core as unknown as { getStatus: () => Promise<OmniCoreStatus> }).getStatus();
}
