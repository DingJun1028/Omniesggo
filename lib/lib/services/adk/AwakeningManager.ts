import { ApostleSquadManager } from './apostle-squad-manager';
import { AgentNetworkBus } from '../EntropyAgent';
import { omniIndex } from '../../core/omni-index';
import { OmniKernel } from '../../core/omni-kernel';

/**
 * [O-Ring 聖典協議] AwakeningManager (API Route Edition)
 * 負責啟動「覺醒奧義」自主模式，透過 API 與伺服器通訊確保 Client-Safety。
 */
export class AwakeningManager {
  private static isAwakened = false;
  private static autonomousLoop: any = null;
  private static kernel: OmniKernel | null = null;
  private static entropyPurgeCounter = 0;

  /**
   * 啟動覺醒儀式：鑄造萬能心核並呼叫伺服器初始化
   */
  static async initiateAwakening(setAiProxyMode: (en: boolean) => void) {
    if (this.isAwakened) return;
    
    console.log('💎 [Awakening] 刻印萬能心核，呼叫伺服器啟動聖典...');
    
    try {
      // 1. 呼叫伺服器端覺醒儀式 (初始化使徒代理)
      const resp = await fetch('/api/awaken/ritual', { method: 'POST' });
      if (!resp.ok) throw new Error("伺服器儀式啟動失敗");

      this.isAwakened = true;
      setAiProxyMode(true);

      // [1-2-3 動作] 初始化萬能心核 (A+B+C)
      this.kernel = new OmniKernel("InfoOne_Awakening_System", "LingoStep_Awaken_Root");

      // 廣播聖典狀態 [真/通]
      AgentNetworkBus.broadcast({
        agentId: "AwakeningCore_v3.1",
        status: "REASONING",
        category: "AGENT",
        currentTask: "正在依據 JunAiKey 3.0 締結神聖契約，萬能心核與伺服器使徒已同步。"
      });

      this.startAutonomousLoop();
      return true;
    } catch (error) {
      console.error("❌ Awakening failed:", error);
      AgentNetworkBus.broadcast({
        agentId: "AwakeningCore",
        status: "ERROR",
        category: "AGENT",
        currentTask: "覺醒儀式失敗：伺服器連結異常。"
      });
    }
  }

  /**
   * 停止覺醒狀態
   */
  static stopAwakening(setAiProxyMode: (en: boolean) => void) {
    this.isAwakened = false;
    setAiProxyMode(false);
    if (this.autonomousLoop) {
      clearInterval(this.autonomousLoop);
      this.autonomousLoop = null;
    }
    this.kernel = null;
    console.log('🌑 [Awakening] 聖典連結已解除，心核歸位。');
  }

  private static startAutonomousLoop() {
    if (this.autonomousLoop) clearInterval(this.autonomousLoop);

    this.autonomousLoop = setInterval(() => {
      this.executeCanonStep();
      
      this.entropyPurgeCounter++;
      if (this.entropyPurgeCounter >= 10) {
        this.performEntropyPurge();
        this.entropyPurgeCounter = 0;
      }
    }, 15000);

    this.executeCanonStep();
  }

  /**
   * 執行單次通典代行：呼叫伺服器執行真正的使徒奧義
   */
  private static async executeCanonStep() {
    if (!this.kernel) return;

    const allApostles = ApostleSquadManager.allApostles;
    const apostle = allApostles[Math.floor(Math.random() * allApostles.length)];
    
    // [通] 紀錄流轉軌跡
    this.kernel.transfer(`Apostle_${apostle.nameEn}`);

    AgentNetworkBus.broadcast({
      agentId: apostle.nameEn,
      status: "PROCESSING",
      category: "AGENT",
      currentTask: `[信 - Trustworthy] 簽章鎖定奧義執行：${apostle.arcane}`
    });

    try {
      // 呼叫伺服器脈衝 API
      const resp = await fetch('/api/awaken/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: apostle.id, input: `執行您的聖典奧義 [${apostle.arcane}]，代主通典自行。` })
      });
      
      const data = await resp.json();
      
      if (data.success) {
        // [真] 寫入證據庫
        this.kernel.certify("AWAKENING_EXECUTION", `Apostle_${apostle.nameEn}`, "SUCCESS");
        
        if (omniIndex.evolveNode) {
          omniIndex.evolveNode(
            `apostle-${apostle.id}`,
            "INTERACTED",
            "CANON_CORE",
            `[OmniKernel 3.1] 伺服器代行成功：${apostle.mandate}`
          );
        }
      }
    } catch (error) {
      console.error("❌ Autonomous Pulse Error:", error);
    }
  }

  /**
   * [動作 2] 熵減代理人 (每周獻祭/自動進化)
   */
  private static performEntropyPurge() {
    console.log('⚡ [Awakening] 執行熵減代理：獻祭冗餘路徑...');
    AgentNetworkBus.broadcast({
      agentId: "EntropyGuard",
      status: "SYNCING",
      category: "AGENT",
      currentTask: "正在執行 10% 技術債清理，提升系統流動效率..."
    });

    const nodes = omniIndex.search("apostle");
    nodes.forEach(node => {
      if (node.lifecycleHooks.length > 20) {
        console.log(`🧹 正在清理節點 [${node.nodeId}] 之冗餘標記...`);
      }
    });

    AgentNetworkBus.broadcast({
      agentId: "EntropyGuard",
      status: "COMPLETED",
      category: "KNOWLEDGE",
      currentTask: "其心核已淨化，秩序度提升。"
    });
  }
}
