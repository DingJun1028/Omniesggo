/**
 * OA Framework — 萬能分身元框架入口
 * 整合: ADK + Agent0 + CrewAI + Agent Reach + DeerFlow + 騰訊 Agent 記憶 + OpenMontage + OmniRoute + TurboVec
 */
import { OAOrchestrator } from './core/orchestrator.js';
import { verify5T } from './core/t5.js';
import type { OAFrameConfig, SubFrameId } from './core/types.js';

import { ADKAdapter } from './adapters/adk.js';
import { Agent0Adapter } from './adapters/agent0.js';
import { CrewAIAdapter } from './adapters/crewai.js';
import { AgentReachAdapter } from './adapters/agentreach.js';
import { DeerFlowAdapter } from './adapters/deerflow.js';
import { TencentMemAdapter } from './adapters/tencent-mem.js';
import { OpenMontageAdapter } from './adapters/openmontage.js';
import { OmniRouteAdapter } from './adapters/omniroute.js';
import { TurboVecAdapter } from './adapters/turbovec.js';
import { OneRingAIAdapter } from './adapters/oneringai.js';

/** 建立並註冊全部 10 個子框架適配器的 Orchestrator */
export function createOAFrame(config: OAFrameConfig = {}): OAOrchestrator {
  const oa = new OAOrchestrator(config);
  oa.register(new ADKAdapter(config));
  oa.register(new Agent0Adapter(config));
  oa.register(new CrewAIAdapter(config));
  oa.register(new AgentReachAdapter(config));
  oa.register(new DeerFlowAdapter(config));
  oa.register(new TencentMemAdapter(config));
  oa.register(new OpenMontageAdapter(config));
  oa.register(new OmniRouteAdapter(config));
  oa.register(new TurboVecAdapter(config));
  oa.register(new OneRingAIAdapter(config));
  return oa;
}

export { OAOrchestrator, verify5T };
export * from './core/types.js';
export * from './core/omni-gate.js';
export * from './core/unverified-registry.js';
export * from './core/swarm-map.js';
export const OA_SUBFRAMES: SubFrameId[] = [
  'adk', 'agent0', 'crewai', 'agentreach', 'deerflow', 'tencent-mem', 'openmontage', 'omniroute', 'turbovec', 'oneringai',
];
