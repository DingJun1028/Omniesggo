/**
 * ESG GO Data Orchestrator (Client Proxy)
 * 負責將前端請求轉發至伺服器端執行器，確保 Client-Safety
 */
export class DataOrchestrator {
  
  /**
   * 執行全量 ESG 評估流程 (GO)
   */
  static async executeGoSequence(metrics: any[]) {
    const response = await fetch('/api/esg/go', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics })
    });

    if (!response.ok) {
      throw new Error(`Execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 針對單一指標進行「奧義驗證」
   */
  static async verifyMetricSingle(metric: any) {
    const response = await fetch('/api/esg/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric })
    });

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 生成全量策略報告
   */
  static async generateReport(metrics: any[]) {
    const response = await fetch('/api/esg/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics })
    });

    if (!response.ok) {
      throw new Error(`Report generation failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
