/**
 * OmniAgentBus × OA Framework 整合橋接 (圓通)
 *
 * 讓 oa-framework 的 7 子框架產出流經 OmniAgentBus 總線 + 5T 部署閘門:
 *   createOAFrame(config).run(task) → OATaskResult[] → bus.deployGate → 落地
 *
 * 優雅降級: 若 @esggo/oa-framework 未安裝 (workspace 未 build), bridge 回傳 unavailable,
 * 不假造 OA 產出。
 */
import { OmniAgentBus } from './bus.js';
import { deployGate, type DeployResult } from './deploy-gate.js';
import type { OATaskResult } from './types.js';

export interface OAFrameworkModule {
  createOAFrame: (config?: Record<string, unknown>) => {
    run: (task: { id: string; prompt: string }) => Promise<OATaskResult[]>;
  };
}

/** 動態載入 @esggo/oa-framework (優雅降級, 用變數避免 tsc 靜態解析) */
export async function loadOAFramework(): Promise<OAFrameworkModule | null> {
  try {
    const pkg = '@esggo/oa-framework';
    const mod = await import(pkg as string);
    return (mod as unknown as OAFrameworkModule) ?? null;
  } catch {
    return null;
  }
}

/**
 * 端到端管線: OA 框架產出 → 總線 5T 部署閘門
 * @returns 每個子框架產出的部署結果陣列
 */
export async function oaToBusPipeline(
  bus: OmniAgentBus,
  config: Record<string, unknown>,
  task: { id: string; prompt: string; routeTo?: string[] },
  deploy: (r: OATaskResult) => void | Promise<void>
): Promise<{ available: boolean; results?: DeployResult[]; reason?: string }> {
  const oa = await loadOAFramework();
  if (!oa) {
    return { available: false, reason: '@esggo/oa-framework 未安裝 (workspace 未 build) — graceful' };
  }
  const frame = oa.createOAFrame(config);
  const produced = await frame.run(task as any);
  const results: DeployResult[] = [];
  for (const r of produced) {
    results.push(await deployGate(bus, 'oa', r, deploy));
  }
  return { available: true, results };
}
