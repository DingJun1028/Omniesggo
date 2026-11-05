/**
 * 系統 (Swarm Controller)
 * 管理母代理、子代理、狀態
 */

import { MotherAgent } from './mother_agent';
import { SubAgent } from './sub_agent';
import { SwarmControllerConfig, SwarmTask, SwarmState, MotherAgentState } from './shared_types';

export class SwarmController {
  private motherAgent: MotherAgent;
  private subAgents: Map<string, any> = new Map();
  private swarmState: 'idle' | 'running' | 'paused' = 'idle';
  private taskQueue: SwarmTask[] = [];

  constructor() {
    this.motherAgent = new MotherAgent('mother-00', '母代理');
  }

  /**
   * 初始化
   */
  async init() {
    console.log('[SwarmController] 初始化 AUTO SWARM 系統...');
    this.swarmState = 'running';
  }

  /**
   * 啟動自動群體狀態
   */
  async start() {
    console.log('[SwarmController] 開始 AUTO SWARM 狀態...');
    this.swarmState = 'running';
    
    while (this.swarmState === 'running') {
      await this.motherAgent.monitor();
      await this.sleep(1000);
    }
  }

  /**
   * 停止
   */
  stop() {
    this.swarmState = 'idle';
    console.log('[SwarmController] 已停止 AUTO SWARM');
  }

  /**
   * 加入任務
   */
  addTask(task: SwarmTask) {
    this.taskQueue.push(task);
    this.motherAgent.addTask(task);
  }

  /**
   * 取得狀態
   */
  getState() {
    return {
      motherAgent: this.motherAgent.getState(),
      subAgents: Array.from(this.subAgents.values()),
      swarmState: this.swarmState,
      taskQueue: this.taskQueue
    };
  }

  /**
   * 更新觸發機率
   */
  setTriggerProbability(probability: number) {
    this.motherAgent.setTriggerProbability(probability);
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
