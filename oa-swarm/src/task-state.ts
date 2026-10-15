/** 萬能蜂群共享任務狀態層 (Shared Task State Layer)
 * 代理A即時知道代理B正在處理哪個任務 / 需要哪種協助
 * 5T: Traceable (source) / Trackable (lifecycle) / Tangible (可視化)
 *      Transparent (公開) / Trustworthy (Object.freeze 防篡改)
 * 跨裝置跨平台: 萬能種子 → 同一萬能血脈
 */

import type { SoulAgent60 } from './soul-matrix-60.js';

export type AgentStatus = 'IDLE' | 'BUSY' | 'BLOCKED' | 'HELP_NEEDED' | 'DONE';

export interface AgentTaskState {
  agentId: number;
  agentTitle: string;
  status: AgentStatus;
  currentTask: string;       // 這個代理正在處理的任務
  helpNeeded: string;        // 需要哪種協助 (空 = 無)
  helpReason: string;        // 為何需要協助
  startedAt: number;         // 開始時間
  lastUpdated: number;       // 最後更新時間
  version: number;           // 版本號 (增量追蹤)
  source: string;            // 來源 (Traceable)
}

export interface SwarmTaskState {
  entropy: number;
  tasksDone: number;
  agents: Readonly<AgentTaskState>[];
  helpRequests: Readonly<AgentTaskState[]>[];
  oab: { connected: boolean; synced: number };
  updatedAt: number;
}

/** 共享任務狀態管理器 — 代理與記憶層中間的連線 (Agent ↔ Memory Layer Bridge)
 * 代理A即時知道代理B正在處理哪個任務 / 需要哪種協助
 * 架構: 本機記憶 (Process) + TencentDB 記憶層 (永久) + SSE 廣播 (實時)
 */
export class TaskStateManager {
  private states = new Map<number, AgentTaskState>();
  private subscribers = new Set<(state: SwarmTaskState) => void>();
  private helpBroadcasters = new Set<(help: AgentTaskState) => void>();
  private entropy = 0.08;
  private tasksDone = 0;
  private oab = { connected: false, synced: 0 };
  private updatedAt = Date.now();
  private version = 0;

  constructor(private readonly soulMatrix: SoulAgent60[]) {
    // 初始化所有代理為 IDLE 狀態
    for (const agent of soulMatrix) {
      this.states.set(agent.id, {
        agentId: agent.id,
        agentTitle: agent.title,
        status: 'IDLE',
        currentTask: '',
        helpNeeded: '',
        helpReason: '',
        startedAt: 0,
        lastUpdated: Date.now(),
        version: 0,
        source: 'oa-swarm/task-state',
      });
    }
  }

  /** 取得完整共享狀態 (供 SSE 廣播 / 儀表板刷新) */
  getState(): SwarmTaskState {
    return {
      entropy: this.entropy,
      tasksDone: this.tasksDone,
      agents: [...this.states.values()].map(s => Object.freeze(s)) as Readonly<AgentTaskState>[],
      helpRequests: this.getHelpRequests(),
      oab: { ...this.oab },
      updatedAt: this.updatedAt,
    };
  }

  /** 代理上報自己正在處理的任務 (Agent B 通知 Agent A) */
  async reportTask(agentId: number, task: string, source = 'api'): Promise<AgentTaskState | null> {
    const state = this.states.get(agentId);
    if (!state) return null;

    const now = Date.now();
    state.currentTask = task;
    state.status = 'BUSY';
    state.startedAt = now;
    state.lastUpdated = now;
    state.version = ++this.version;
    state.source = source;

    this.updatedAt = now;
    this.emit();

    // 幫助請求: 當狀態為 BLOCKED 或幫助需求非空時, 廣播
    if (state.helpNeeded) {
      this.broadcastHelp(state);
    }
    return Object.freeze({ ...state }) as AgentTaskState;
  }

  /** 代理上報幫助請求 (Agent A 發起協助 Signal) */
  reportHelp(agentId: number, helpNeeded: string, reason: string, source = 'api'): AgentTaskState | null {
    const state = this.states.get(agentId);
    if (!state) return null;

    const now = Date.now();
    state.helpNeeded = helpNeeded;
    state.helpReason = reason;
    state.status = 'HELP_NEEDED';
    state.lastUpdated = now;
    state.version = ++this.version;
    state.source = source;

    this.updatedAt = now;
    this.emit();
    this.broadcastHelp(state);
    return Object.freeze({ ...state }) as AgentTaskState;
  }

  /** 代理確認任務完成 (Agent B 完成, 通知所有人) */
  async completeTask(agentId: number, result: string, source = 'api'): Promise<AgentTaskState | null> {
    const state = this.states.get(agentId);
    if (!state) return null;

    const now = Date.now();
    state.currentTask = result;
    state.status = state.helpNeeded ? 'HELP_NEEDED' : 'DONE';
    state.helpNeeded = '';
    state.helpReason = '';
    state.lastUpdated = now;
    state.version = ++this.version;
    state.source = source;

    this.tasksDone++;
    this.updatedAt = now;
    this.emit();
    return Object.freeze({ ...state }) as AgentTaskState;
  }

  /** 代理求救: 需要協助 (會廣播給所有人) */
  async requestHelp(agentId: number, helpNeeded: string, reason: string, source = 'api'): Promise<AgentTaskState | null> {
    const state = this.states.get(agentId);
    if (!state) return null;

    const now = Date.now();
    state.helpNeeded = helpNeeded;
    state.helpReason = reason;
    state.status = 'HELP_NEEDED';
    state.lastUpdated = now;
    state.version = ++this.version;
    state.source = source;

    this.updatedAt = now;
    this.emit();
    this.broadcastHelp(state);
    return Object.freeze({ ...state }) as AgentTaskState;
  }

  /** 代理確認問題已解決 (解除求救) */
  async resolveHelp(agentId: number, source = 'api'): Promise<AgentTaskState | null> {
    const state = this.states.get(agentId);
    if (!state) return null;

    const now = Date.now();
    state.helpNeeded = '';
    state.helpReason = '';
    state.status = 'BUSY';  // 可能仍在工作, 或後續更新為 IDLE
    state.lastUpdated = now;
    state.version = ++this.version;
    state.source = source;

    this.updatedAt = now;
    this.emit();
    return Object.freeze({ ...state }) as AgentTaskState;
  }

  /** 代理自聲明 IDLE/空閒 (可被調度) */
  async setIdle(agentId: number, source = 'api'): Promise<AgentTaskState | null> {
    const state = this.states.get(agentId);
    if (!state) return null;

    const now = Date.now();
    state.status = 'IDLE';
    state.currentTask = '';
    state.helpNeeded = '';
    state.helpReason = '';
    state.lastUpdated = now;
    state.version = ++this.version;
    state.source = source;

    this.updatedAt = now;
    this.emit();
    return Object.freeze({ ...state }) as AgentTaskState;
  }

  /** 訂閱狀態變化 (實時推送) */
  subscribe(fn: (state: SwarmTaskState) => void): () => void {
    this.subscribers.add(fn);
    // 立即推送當前狀態
    fn(this.getState());
    return () => this.subscribers.delete(fn);
  }

  /** 訂閱幫助請求 (幫助信號) */
  subscribeHelp(fn: (help: AgentTaskState) => void): () => void {
    this.helpBroadcasters.add(fn);
    return () => this.helpBroadcasters.delete(fn);
  }

  private emit(): void {
    const state = this.getState();
    this.subscribers.forEach((fn) => fn(state));
  }

  private broadcastHelp(help: AgentTaskState): void {
    this.helpBroadcasters.forEach((fn) => fn(help));
  }

  setEntropy(e: number): void {
    this.entropy = Math.max(0.01, e);
    this.emit();
  }

  setOab(o: { connected: boolean; synced: number }): void {
    this.oab = o;
    this.emit();
  }

  getTaskState(agentId: number): AgentTaskState | null {
    return this.states.get(agentId) ?? null;
  }

  /** 增量輸出: 僅返回變更前的請求 */
  getHelpRequests(): Readonly<AgentTaskState[]>[] {
    return [...this.states.values()]
      .filter(s => s.helpNeeded)
      .map(s => Object.freeze(s) as AgentTaskState)
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .map(h => Object.freeze([h]) as Readonly<AgentTaskState[]>);
  }
}
