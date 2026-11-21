/**
 * OmniAgentBus — 實體部署閘門 (Deploy Gate)
 *
 * 讓 OA 框架的產出在「部署前」必須過 5T 總線閘門 (無礙):
 *   - 合規 → publish 到 `<source>.deploy` 主題 + 執行 deploy 回調 (落地)
 *   - 不合規 → publish 到 `<source>.rejected` + 不部署, 回傳失敗原因
 *
 * 與 oa-framework 整合: 若 @esggo/oa-framework 可解析, 直接吃它的 forgeT5 產出;
 * 否則優雅降級, 用本地對齊的 OATaskResult 形狀。
 */
import { OmniAgentBus, bus5TGate } from './bus.js';
import type { OATaskResult } from './types.js';

export interface DeployResult {
  deployed: boolean;
  reason?: string;
  messageId?: string;
}

/** 實體部署閘門: 結果過 5T 才准部署 */
export async function deployGate(
  bus: OmniAgentBus,
  source: string,
  result: OATaskResult,
  deploy: (r: OATaskResult) => void | Promise<void>
): Promise<DeployResult> {
  const g = bus5TGate(result);
  if (!g.pass) {
    const msg = await bus.publish(`${source}.rejected`, source, result);
    return { deployed: false, reason: `5T gate failed: ${g.failed.join(',')}`, messageId: msg.id };
  }
  const msg = await bus.publish(`${source}.deploy`, source, result);
  await deploy(result);
  return { deployed: true, messageId: msg.id };
}

/**
 * 嘗試從 @esggo/oa-framework 取 forgeT5 (動態 import, 優雅降級)。
 * 用變數形式避免 tsc 靜態解析未安裝的 workspace 包。
 */
export async function tryLoadForgeT5(): Promise<((opts: {
  subFrame: OATaskResult['subFrame'];
  output: string;
  uuid: string;
  version: string;
  evidence?: Record<string, unknown>;
}) => OATaskResult) | null> {
  try {
    const pkg = '@esggo/oa-framework';
    const mod = await import(pkg as string);
    return (mod as any).forgeT5 ?? null;
  } catch {
    return null;
  }
}
