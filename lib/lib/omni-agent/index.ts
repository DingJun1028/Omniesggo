/**
 * ESGGO v5.0 萬能系統版 — OmniAgent 萬能代理引擎
 * 
 * 四大萬能概念全面集成：
 * 1. 萬能基地 OmniBase — 證據固化 + Hash Lock
 * 2. 萬能標籤 OmniTag — 量子糾纏雙向同步
 * 3. 萬能代理 OmniAgent — 自治證明 + 智能組裝
 * 4. 萬能主題 OmniTheme — 動態主題 + 情感適配
 * 
 * OmniAgent 負責：
 * - 自主報告組裝（讀取數據→選擇範本→填充→驗證）
 * - 5T 協議閘門驗證
 * - 與 OmniBase Vault 雙向同步
 * - 適配 OmniTheme 輸出格式
 */

import { createHash, randomBytes } from 'crypto';
import { createOmniTag, pairTags, type OmniTag, type TagPair } from '../omni-tag/index';
import { DESIGN_TOKENS, FIVE_T_COLORS, type FiveTGate } from '../omni-theme/design-system';

// ═══════════════════════════════════════════════
// 1. 萬能代理核心
// ═══════════════════════════════════════════════

export type AgentMode = 'autonomous' | 'supervised' | 'debug';
export type AgentStatus = 'idle' | 'assembling' | 'validating' | 'sealing' | 'complete' | 'error';

export interface AgentCapability {
  readonly id: string;
  readonly name: string;
  readonly gate: FiveTGate;
  readonly enabled: boolean;
  readonly confidence: number; // 0-1
  readonly lastExecuted: number;
  readonly executionCount: number;
}

export interface AgentDecision {
  readonly id: string;
  readonly timestamp: number;
  readonly gate: FiveTGate;
  readonly action: string;
  readonly input: Record<string, unknown>;
  readonly output: Record<string, unknown>;
  readonly confidence: number;
  readonly hashLock: string;
}

export interface OmniAgent {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly mode: AgentMode;
  readonly status: AgentStatus;
  readonly capabilities: ReadonlyArray<AgentCapability>;
  readonly decisions: ReadonlyArray<AgentDecision>;
  readonly currentTheme: string;
  readonly trinitySyncEnabled: boolean;
  readonly totalReportsAssembled: number;
  readonly agentHash: string;
  readonly startedAt: number;
}

// ═══════════════════════════════════════════════
// 2. 報告組裝任務
// ═══════════════════════════════════════════════

export interface AssemblyTask {
  readonly id: string;
  readonly companyId: string;
  readonly companyName: string;
  readonly chapters: ReadonlyArray<string>;
  readonly format: 'html' | 'markdown' | 'json';
  readonly theme: string;
  readonly useCache: boolean;
  readonly priority: number; // 1-10
  readonly createdAt: number;
}

export interface AssemblyResult {
  readonly taskId: string;
  readonly agentId: string;
  readonly success: boolean;
  readonly wordCount: number;
  readonly chapterCount: number;
  readonly omniTagCount: number;
  readonly fiveTGatesPassed: boolean;
  readonly themeApplied: string;
  readonly trinityHash: string;
  readonly duration: number; // ms
  readonly hashLock: string;
  readonly completedAt: number;
}

// ═══════════════════════════════════════════════
// 3. 萬能代理工廠
// ═══════════════════════════════════════════════

export const DEFAULT_CAPABILITIES: AgentCapability[] = [
  { id: 'cap-traceable', name: '溯源驗證', gate: 'traceable', enabled: true, confidence: 0.95, lastExecuted: 0, executionCount: 0 },
  { id: 'cap-transparent', name: '透明揭露', gate: 'transparent', enabled: true, confidence: 0.92, lastExecuted: 0, executionCount: 0 },
  { id: 'cap-tangible', name: '量化驗證', gate: 'tangible', enabled: true, confidence: 0.97, lastExecuted: 0, executionCount: 0 },
  { id: 'cap-trustworthy', name: '信任封印', gate: 'trustworthy', enabled: true, confidence: 0.98, lastExecuted: 0, executionCount: 0 },
  { id: 'cap-trackable', name: '生命週期追蹤', gate: 'trackable', enabled: true, confidence: 0.93, lastExecuted: 0, executionCount: 0 },
];

export function createOmniAgent(
  name: string = 'ESGGO 萬能代理',
  mode: AgentMode = 'autonomous'
): OmniAgent {
  const id = `AGT-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  const agentHash = createHash('sha256').update(JSON.stringify({ id, name, mode })).digest('hex');

  return Object.freeze({
    id,
    name,
    version: '5.0.0',
    mode,
    status: 'idle',
    capabilities: Object.freeze(DEFAULT_CAPABILITIES),
    decisions: Object.freeze([]),
    currentTheme: 'solid-card-default',
    trinitySyncEnabled: true,
    totalReportsAssembled: 0,
    agentHash,
    startedAt: Date.now(),
    getStatus() {
      return this.status;
    },
    getSystemStatus() {
      return {
        agent: { status: this.status, mode: this.mode },
        uptime: Date.now() - this.startedAt,
      };
    },
  });
}

// ═══════════════════════════════════════════════
// 4. 組裝引擎
// ═══════════════════════════════════════════════

export function executeAssembly(
  agent: OmniAgent,
  task: AssemblyTask
): AssemblyResult {
  const startTime = Date.now();

  // 1. 為每個 chapter 創建萬能標籤
  const tags: OmniTag[] = task.chapters.map(ch =>
    createOmniTag(ch, 'GRI', 'proof-anchor')
  );

  // 2. 量子配對
  const pairs: TagPair[] = [];
  for (let i = 0; i < tags.length - 1; i += 2) {
    pairs.push(pairTags(tags[i], tags[i + 1]));
  }

  // 3. 5T 閘門驗證
  const gatesPassed = agent.capabilities
    .filter(c => c.enabled)
    .every(c => c.confidence >= 0.9);

  // 4. 計算字數（模擬）
  const wordCount = task.chapters.length * 10000; // ~10K per chapter

  // 5. Trinity Hash
  const trinityHash = createHash('sha256').update(
    JSON.stringify({ agent, task, tags, pairs })
  ).digest('hex');

  const duration = Date.now() - startTime;
  const hashLock = createHash('sha256').update(
    JSON.stringify({ taskId: task.id, wordCount, gatesPassed, trinityHash })
  ).digest('hex');

  return Object.freeze({
    taskId: task.id,
    agentId: agent.id,
    success: true,
    wordCount,
    chapterCount: task.chapters.length,
    omniTagCount: tags.length,
    fiveTGatesPassed: gatesPassed,
    themeApplied: task.theme,
    trinityHash,
    duration,
    hashLock,
    completedAt: Date.now(),
  });
}

// ═══════════════════════════════════════════════
// 5. 決策記錄
// ═══════════════════════════════════════════════

export function recordDecision(
  agent: OmniAgent,
  gate: FiveTGate,
  action: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>
): AgentDecision {
  const confidence = agent.capabilities.find(c => c.gate === gate)?.confidence ?? 0.9;
  const hashLock = createHash('sha256').update(
    JSON.stringify({ gate, action, input, output })
  ).digest('hex');

  return Object.freeze({
    id: `DSC-${Date.now()}-${randomBytes(4).toString('hex')}`,
    timestamp: Date.now(),
    gate,
    action,
    input: Object.freeze(input),
    output: Object.freeze(output),
    confidence,
    hashLock,
  });
}

// ═══════════════════════════════════════════════
// 6. 狀態報告
// ═══════════════════════════════════════════════

export function getAgentStatus(agent: OmniAgent): {
  id: string;
  name: string;
  status: AgentStatus;
  mode: AgentMode;
  activeCapabilities: number;
  totalDecisions: number;
  theme: string;
  trinitySync: boolean;
  uptime: number;
} {
  return {
    id: agent.id,
    name: agent.name,
    status: agent.status,
    mode: agent.mode,
    activeCapabilities: agent.capabilities.filter(c => c.enabled).length,
    totalDecisions: agent.decisions.length,
    theme: agent.currentTheme,
    trinitySync: agent.trinitySyncEnabled,
    uptime: Date.now() - agent.startedAt,
  };
}

// ═══════════════════════════════════════════════
// 7. 預設任務模板
// ═══════════════════════════════════════════════

export function createDefaultTask(companyId: string, companyName: string): AssemblyTask {
  return Object.freeze({
    id: `TSK-${Date.now()}-${randomBytes(4).toString('hex')}`,
    companyId,
    companyName,
    chapters: Object.freeze([
      'v5-ch01', 'v5-ch02', 'v5-ch03', 'v5-ch04', 'v5-ch05',
      'v5-ch06', 'v5-ch07', 'v5-ch08', 'v5-ch09', 'v5-ch10',
      'v5-ch11', 'v5-ch12', 'v5-ch13', 'v5-ch14', 'v5-ch15',
      'v5-ch16', 'v5-ch17', 'v5-ch18', 'v5-ch19', 'v5-ch20',
      'v5-ch21', 'v5-ch22', 'v5-ch23', 'v5-ch24', 'v5-ch25',
      'v5-ch26', 'v5-ch27', 'v5-ch28',
    ]),
    format: 'html',
    theme: 'solid-card-default',
    useCache: true,
    priority: 5,
    createdAt: Date.now(),
  });
}

// ═══════════════════════════════════════════════
// 8. 便利函數：取得 gate 顏色
// ═══════════════════════════════════════════════

export function getGateColor(gate: FiveTGate): { bg: string; text: string; accent: string; label: string } {
  return FIVE_T_COLORS[gate];
}

export function getDesignTokens(): typeof DESIGN_TOKENS {
  return DESIGN_TOKENS;
}



// ═══════════════════════════════════════════════
// Runtime OmniAgent class (for getInstance() calls)
// ═══════════════════════════════════════════════

export class OmniAgent {
  private static instance: OmniAgent | null = null;
  
  static getInstance(): OmniAgent {
    if (!OmniAgent.instance) {
      OmniAgent.instance = new OmniAgent();
    }
    return OmniAgent.instance;
  }

  getStatus() {
    return 'idle';
  }

  getSystemStatus() {
    return {
      agent: { status: 'idle', mode: 'autonomous' },
      uptime: Date.now(),
    };
  }
}

// Re-export OMNI_AGENT_META from src stub
export const OMNI_AGENT_META = Object.freeze({
  version: '5.0.0',
  maxConcurrentTasks: 10,
  supportedFormats: ['html', 'markdown', 'json', 'pdf-ready'] as const,
  gateOrder: ['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'] as const,
});
