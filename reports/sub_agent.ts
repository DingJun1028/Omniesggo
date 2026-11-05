/**
 * 子代理 (Sub Agent)
 * 負責執行具體任務、回報結果
 */

import { SubAgentState } from './shared_types';

export class SubAgent {
  private id: string;
  private name: string;
  private state: SubAgentState;

  constructor(id: string, payload: any) {
    this.id = id;
    this.name = `sub-${id}`;
    this.state = {
      id: this.name,
      name: `sub-${id}`,
      status: 'running',
      parentId: id,
      payload: payload,
      executedAt: Date.now(),
      duration: 0
    };
  }

  /**
   * 執行任務
   */
  async execute() {
    console.log(`[SubAgent ${this.id}] 開始執行任務...`);
    this.state.status = 'running';

    const startTime = Date.now();

    try {
      // 模擬任務執行（真實專案中會呼叫具體功能）
      await this.doWork();
      
      this.state.status = 'completed';
      this.state.duration = Date.now() - startTime;
      this.state.result = { success: true, duration: this.state.duration };

      console.log(`[SubAgent ${this.id}] 完成任務，耗時: ${this.state.duration}ms`);
    } catch (error) {
      this.state.status = 'failed';
      this.state.error = error instanceof Error ? error.message : String(error);
      console.error(`[SubAgent ${this.id}] 失敗: ${this.state.error}`);
    }
  }

  /**
   * 具體工作邏輯
   */
  private async doWork() {
    // 取得任務載荷
    const payload = this.state.payload;
    
    // 執行具體邏輯
    // 這裡是示意，真實專案中會呼叫具體功能
    await this.simulateWork(payload);
  }

  /**
   * 模擬工作
   */
  private async simulateWork(payload: any) {
    const delay = Math.random() * 5000 + 2000;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, delay);
    });
  }

  /**
   * 取得結果
   */
  getResult() {
    return {
      id: this.id,
      name: this.name,
      status: this.state.status,
      result: this.state.result,
      error: this.state.error,
      duration: this.state.duration
    };
  }
}
