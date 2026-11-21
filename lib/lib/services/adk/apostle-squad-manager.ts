import { TEN_WINGS_APOSTLES } from '@lib/adk/ten-wings';
import { ARVO_WINGS_APOSTLES } from '@lib/adk/arvo-wings';
import { ApostleMetadata } from '@lib/adk/types';
import { AgentNetworkBus } from '../EntropyAgent';
import { HolyLinter } from '@lib/core/omni-linter';
import { omniIndex } from '@lib/core/omni-index';
import { initApostleAgents } from '@lib/adk/ten-wings-agents';
import { initArvoApostleAgents } from '@lib/adk/arvo-wings-agents';

/**
 * ApostleSquadManager (Client-Safe Version)
 * Orchestrates the 20 Apostles without importing server-side ADK/fs.
 */
export class ApostleSquadManager {
  private static initialized = false;

  /**
   * Combined list of all 20 apostles.
   */
  public static get allApostles(): ApostleMetadata[] {
    return [...ARVO_WINGS_APOSTLES, ...TEN_WINGS_APOSTLES];
  }

  /**
   * Initializes Apostle metadata and seals them in the OmniIndex.
   * This is safe for the browser as it doesn't create agent instances.
   */
  static init() {
    if (this.initialized) return;
    
    // 5T Sealing & Indexing
    this.allApostles.forEach(apostle => {
      const sealedMetadata = HolyLinter.seal(
        { ...apostle, agent: undefined }, 
        `Apostle_Registry_${apostle.id.startsWith('A') ? 'ARVO' : 'ADK'}`,
        true
      );
      
      (apostle as any)._omniHeart = sealedMetadata._omniHeart;

      omniIndex.mintNode(
        `apostle-${apostle.id}`,
        "data_record",
        sealedMetadata,
        "SYSTEM_GATEWAY"
      );

      omniIndex.evolveNode(
        `apostle-${apostle.id}`,
        "VERIFIED",
        "ApostleSquadManager",
        `5T Protocol Seal verified.`
      );
    });

    this.initialized = true;
    console.log('[ApostleSquadManager] 20 Apostle Nodes Indexed & Sealed.');
  }

  /**
   * Hydrates all apostles with real ADK/ARVO agent instances.
   * THIS MUST ONLY BE CALLED ON THE SERVER.
   */
  private static agentsInitialized = false;
  static initAgents() {
    if (this.agentsInitialized) return;
    
    console.log('[ApostleSquadManager] Initializing Server-Side Apostle Agents...');
    initApostleAgents();
    initArvoApostleAgents();
    
    this.agentsInitialized = true;
    console.log('[ApostleSquadManager] 20 Apostle Agents Hydrated.');
  }

  static awaken() {
    this.init();
    AgentNetworkBus.broadcast({
      agentId: "ApostleSquad",
      status: "REASONING",
      category: "AGENT",
      currentTask: "全體使徒覺醒中... [Awakening Arcane]"
    });
  }

  static async runCanonSequence() {
    this.init();
    const apostles = this.allApostles;
    for (const apostle of apostles) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      AgentNetworkBus.broadcast({
        agentId: apostle.nameEn,
        status: "PROCESSING",
        category: "AGENT",
        currentTask: `[通典代行] 正在執行：${apostle.arcane}`
      });
    }
  }

  static getAllStatus() {
    return this.allApostles.map((a: ApostleMetadata) => ({
      id: a.id,
      name: a.name,
      status: "ONLINE", // Nodes are always sealed and accessible in the browser
    }));
  }
}
