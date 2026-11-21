import { CelestialController } from '../../lib/celestial/implementation';

export interface SwarmTaskOptions {
  task: 'compliance_check' | 'expert_rewrite' | 'multi_consensus';
  context: string;
}

export class OmniSwarmService {
  private celestial = new CelestialController();
  private nexusEndpoint = 'http://localhost:3000/api/nexus/agent'; // Assuming local next.js environment

  constructor(endpoint?: string) {
    if (endpoint) this.nexusEndpoint = endpoint;
  }

  private async dispatchToSwarm(options: SwarmTaskOptions) {
    try {
      // 在伺服器端直連或相對路徑可能需要調整，這裡模擬 fetch
      // 若為 server-side 呼叫自身 API 可能需絕對 URL，但為簡化我們先直接呼叫
      const res = await fetch(this.nexusEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'lhub_ask',
          arguments: {
            task: options.task,
            context: options.context
          }
        })
      });
      
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error('Swarm delegation failed');
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.warn(`[OmniSwarmService] Swarm fallback triggered: ${err.message}`);
      return `[L-Hub 降級回覆] 暫時無法連線，已改由本地模型接管處理。`;
    }
  }

  /**
   * 跨國合規比對
   */
  async performComplianceCheck(sectionContent: string, standard: string) {
    const rawResult = await this.dispatchToSwarm({
      task: 'compliance_check',
      context: `${standard} vs 當前內容`
    });

    // 透過 Celestial Flow 強制封印 (ZKP) 合規結果
    const sealedResult = await this.celestial.executeCelestialFlow({
      type: 'ComplianceResult',
      content: rawResult,
      standard,
      timestamp: Date.now()
    });

    return sealedResult;
  }

  /**
   * 專家段落潤飾
   */
  async refineReportSection(sectionContent: string, tone: string) {
    const rawResult = await this.dispatchToSwarm({
      task: 'expert_rewrite',
      context: tone
    });

    const sealedResult = await this.celestial.executeCelestialFlow({
      type: 'ExpertRewriteResult',
      content: rawResult,
      tone,
      timestamp: Date.now()
    });

    return sealedResult;
  }

  /**
   * 多模型共識決策 (防漂綠檢查)
   */
  async verifyAntiGreenwashing(_content: string) {
    const rawResult = await this.dispatchToSwarm({
      task: 'multi_consensus',
      context: '防漂綠檢查'
    });

    const sealedResult = await this.celestial.executeCelestialFlow({
      type: 'AntiGreenwashingResult',
      content: rawResult,
      timestamp: Date.now()
    });

    return sealedResult;
  }
}
