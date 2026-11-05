/**
 * 使母代理 (Mother Agent)
 * 負責監控任務隊列、決定觸發子代理、管理資源
 */

import { MotherAgentState, MotherTask } from './shared_types';
import { SubAgent } from './sub_agent';

export class MotherAgent {
  private id: string;
  private name: string;
  private state: MotherAgentState;
  private triggerProbability: number;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.state = {
      id: id,
      name: name,
      status: 'monitoring',
      taskQueue: [],
      subAgentCount: 0,
      totalTriggered: 0,
      lastTriggerTime: 0
    };
    this.triggerProbability = 0.85; // 85% 觸發機率
  }

  /**
   * 進入監控模式
   */
  async monitor() {
    console.log(`[MotherAgent ${this.id}] 開始監控任務隊列...`);
    this.state.status = 'monitoring';

    while (this.state.status === 'monitoring') {
      const task = this.state.taskQueue.find(t => t.status === 'pending');
      
      if (task) {
        // 依隨機機率決定是否觸發
        if (Math.random() < this.triggerProbability) {
          await this.triggerSubAgent(task);
        }
      }
      
      // 每秒檢查一次
      await this.sleep(1000);
    }
  }

  /**
   * 觸發子代理
   */
  private async triggerSubAgent(task: MotherTask) {
    this.state.lastTriggerTime = Date.now();
    this.state.totalTriggered++;
    this.state.subAgentCount++;

    console.log(`[MotherAgent ${this.id}] 觸發子代理: ${task.id} (機率: ${(this.triggerProbability * 100).toFixed(0)}%)`);

    const subAgent = new SubAgent(task.id, task.payload);
    await subAgent.execute();

    // 更新任務狀態
    const taskIndex = this.state.taskQueue.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      this.state.taskQueue[taskIndex].status = 'completed';
    }

    // 移除已完成的任務
    this.state.taskQueue = this.state.taskQueue.filter(t => t.status !== 'completed');
  }

  /**
   * 加入任務
   */
  addTask(task: MotherTask) {
    this.state.taskQueue.push(task);
    console.log(`[MotherAgent ${this.id}] 加入任務: ${task.id} (優先級: ${task.priority})`);
  }

  /**
   * 取得目前狀態
   */
  getState() {
    return {
      ...this.state,
      triggerProbability: this.triggerProbability
    };
  }

  /**
   * 設定觸發機率
   */
  setTriggerProbability(probability: number) {
    this.triggerProbability = Math.min(1.0, Math.max(0.0, probability));
    console.log(`[MotherAgent ${this.id}] 觸發機率調整為: ${(this.triggerProbability * 100).toFixed(0)}%`);
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
