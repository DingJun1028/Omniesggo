/**
 * 使母代理 (Mother Agent)
 * 負責監控任務隊列、決定觸發子代理、管理資源
 */

import type { MotherAgentState, MotherTask } from './shared_types';
import { SubAgent } from './sub_agent';

export class MotherAgent {
  private readonly id: string;
  private readonly name: string;
  private state: MotherAgentState;
  private triggerProbability: number;
  private monitorTimer?: ReturnType<typeof setTimeout>;
  private finishMonitoring?: () => void;

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

    await new Promise<void>((resolve) => {
      this.finishMonitoring = resolve;
      const checkQueue = async () => {
        if (this.state.status !== 'monitoring') {
          this.finishMonitoring = undefined;
          resolve();
          return;
        }

        const task = this.state.taskQueue.find(t => t.status === 'pending');
        if (task && Math.random() < this.triggerProbability) {
          try {
            await this.triggerSubAgent(task);
          } catch (error) {
            console.error(`[MotherAgent ${this.id}] 任務失敗:`, error);
          }
        }

        if (this.state.status !== 'monitoring') {
          this.finishMonitoring = undefined;
          resolve();
          return;
        }
        this.monitorTimer = setTimeout(() => { void checkQueue(); }, 1000);
      };

      void checkQueue();
    });
  }

  /** 停止佇列監控；正在執行的子代理完成後會退出迴圈。 */
  stopMonitoring(): void {
    this.state.status = 'idle';
    if (this.monitorTimer) {
      clearTimeout(this.monitorTimer);
      this.monitorTimer = undefined;
      this.finishMonitoring?.();
      this.finishMonitoring = undefined;
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

}
