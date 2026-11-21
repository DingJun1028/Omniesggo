/**
 * 【通】 代理網絡：熵增監控引擎 (Entropy Monitor)
 */
export class EntropyMonitor {
  /**
   * 計算組件熵值 (Entropy Score)
   * 依據：流轉路徑長度、數據體積、冗餘深度
   */
  public static calculateEntropy(target: any): number {
    const heart = target._omniHeart;
    if (!heart) return 0;

    const pathLength = heart.transferful ? heart.transferful.length : 0;
    const metadataSize = JSON.stringify(target).length;
    
    // 熵值公式：(路徑長度 * 0.05) + (數據體積係數 / 5000)
    const entropyScore = (pathLength * 0.05) + (metadataSize / 10000);
    
    return entropyScore;
  }

  public static shouldSacrifice(score: number): boolean {
    return score > 0.1; // 超過 0.1 視為秩序混亂，需執行獻祭
  }
}

/**
 * 代理人狀態廣播 (Agent Status Broadcast)
 */
export interface AgentStatus {
  agentId: string;
  status: "IDLE" | "PROCESSING" | "SYNCING" | "COMPLETED" | "REASONING" | "ERROR";
  category?: "AGENT" | "DATA" | "KNOWLEDGE";
  currentTask?: string;
  citingNodeId?: string;
  adkEvent?: any; // To store ADK Event objects for tracing
}

type StatusListener = (status: AgentStatus) => void;
const listeners = new Set<StatusListener>();

export const AgentNetworkBus = {
  subscribe: (fn: StatusListener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  broadcast: (status: AgentStatus) => {
    listeners.forEach(fn => fn(status));
  }
};

import { omniIndex } from '../core/omni-index';

export class EntropyAgent {
  private static readonly SACRIFICE_RATIO = 0.1;

  /**
   * 執行聖典獻祭 (Sacred Sacrifice)
   */
  public static async performSacrifice(target: any): Promise<any> {
    const entropy = EntropyMonitor.calculateEntropy(target);
    
    if (!EntropyMonitor.shouldSacrifice(entropy)) {
      return target;
    }

    AgentNetworkBus.broadcast({ 
      agentId: "EntropyGuard", 
      status: "PROCESSING", 
      category: "AGENT",
      currentTask: `獻祭高熵物件 (Entropy: ${entropy.toFixed(3)})` 
    });

    const heart = target._omniHeart;
    if (heart && Array.isArray(heart.transferful)) {
      // Knowledge Sync: 尋找相關的優化案例
      AgentNetworkBus.broadcast({ agentId: "EntropyGuard", status: "SYNCING", category: "AGENT", currentTask: "檢索智庫優化路徑..." });
      const relatedNodes = omniIndex.search("optimization");
      const bestPractice = relatedNodes[0];

      const originalLength = heart.transferful.length;
      const purgeCount = Math.floor(originalLength * this.SACRIFICE_RATIO);
      
      const simplifiedTransfer = [
        heart.transferful[0],
        ...heart.transferful.slice(-(originalLength - purgeCount - 1))
      ].filter(Boolean);

      const result = {
        ...target,
        _omniHeart: {
          ...heart,
          agent_signature: "EntropyGuard_v3.1",
          transferful: simplifiedTransfer,
          thankful: {
            ...heart.thankful,
            zero_hallucination: true,
            cited_node: bestPractice?.nodeId
          }
        }
      };

      AgentNetworkBus.broadcast({ 
        agentId: "EntropyGuard", 
        status: "COMPLETED", 
        category: "AGENT",
        citingNodeId: bestPractice?.nodeId 
      });

      return result;
    }
    
    AgentNetworkBus.broadcast({ agentId: "EntropyGuard", status: "IDLE", category: "AGENT" });
    return target;
  }
}
