import { WithOmniHeart, OmniHeart } from "./omni-linter";
import { AgentNetworkBus } from "../services/EntropyAgent";

export interface OmniNode {
  nodeId: string;
  nodeType: "component" | "data_record" | "user_interaction";
  
  // 核心 5T 能量源
  heart: OmniHeart;
  
  // Hash Lock，即為此 Node 的唯一識別與不可篡改證明
  signature: string;
  
  // 生命週期掛載點紀錄
  lifecycleHooks: OmniLifecycleHook[];
  
  // 創建與演化時間戳記
  createdAt: number;
  lastEvolvedAt: number;
}

export interface OmniLifecycleHook {
  event: "CREATED" | "MAPPED" | "VERIFIED" | "TRANSFERRED" | "RENDERED" | "INTERACTED" | "UNMOUNTED";
  timestamp: number;
  actor: string; // ex: SYSTEM_GATEWAY, USER_X, ORCHESTRATOR
  details: string; // 具體的演化細節
}

/**
 * Omni Index Store
 * 管理並封印所有 Omni Node，確保 Truth 與 Trust在系統內永不流失。
 */
export class OmniIndexKeeper {
  private static instance: OmniIndexKeeper;
  private vault = new Map<string, Readonly<OmniNode>>();
  private listeners: (() => void)[] = [];


  private constructor() {}

  public static getInstance(): OmniIndexKeeper {
    if (!OmniIndexKeeper.instance) {
      OmniIndexKeeper.instance = new OmniIndexKeeper();
    }
    return OmniIndexKeeper.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners = [...this.listeners, listener];
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }


  /**
   * 鑄造新節點並封存入庫
   */
  public mintNode<T>(
    nodeId: string,
    nodeType: OmniNode["nodeType"],
    sealedData: WithOmniHeart<T>,
    initialActor: string
  ): Readonly<OmniNode> {
    
    if (!sealedData._omniHeart) {
       throw new Error("Cannot mint node: Data lacks an OmniHeart (must be sealed by HolyLinter first).");
    }

    const node: OmniNode = {
      nodeId,
      nodeType,
      heart: sealedData._omniHeart,
      signature: sealedData._omniHeart.trustful, // 取自 5T 的 [信]
      lifecycleHooks: [
        {
          event: "CREATED",
          timestamp: Date.now(),
          actor: initialActor,
          details: `Node initialized via origin: ${sealedData._omniHeart.truthful}`
        }
      ],
      createdAt: Date.now(),
      lastEvolvedAt: Date.now()
    };

    const sealedNode = Object.freeze(node);
    this.vault.set(node.nodeId, sealedNode);
    this.notify();


    AgentNetworkBus.broadcast({ 
      agentId: "OmniIndexKeeper", 
      status: "COMPLETED", 
      category: "KNOWLEDGE",
      currentTask: `Minted node: ${nodeId}` 
    });

    return sealedNode;
  }

  /**
   * 紀錄演化事件 (生命週期轉移)
   */
  public evolveNode(
    nodeId: string, 
    hookEvent: OmniLifecycleHook["event"], 
    actor: string, 
    details: string
  ): Readonly<OmniNode> | null {
    
    AgentNetworkBus.broadcast({ 
      agentId: "OmniIndexKeeper", 
      status: "PROCESSING", 
      category: "KNOWLEDGE",
      currentTask: `Evolving node: ${nodeId} (${hookEvent})` 
    });

    const existingNode = this.vault.get(nodeId);
    if (!existingNode) return null;

    // 由於節點本身是 Object.freeze 的，我們需要建立新的不可篡改副本來追加歷史紀錄，
    // 以符合 5T 的 [信] 與 [通]。
    const clone = { ...existingNode };
    
    // 更新 Hook 歷史
    const newHooks = [...clone.lifecycleHooks, {
      event: hookEvent,
      timestamp: Date.now(),
      actor,
      details
    }];
    
    const evolvedNode: OmniNode = {
      ...clone,
      lifecycleHooks: newHooks,
      lastEvolvedAt: Date.now()
    };

    const finalNode = Object.freeze(evolvedNode);
    this.vault.set(nodeId, finalNode); // 覆寫指向新的不可篡改副本
    this.notify();

    
    AgentNetworkBus.broadcast({ 
      agentId: "OmniIndexKeeper", 
      status: "COMPLETED", 
      category: "KNOWLEDGE"
    });

    return finalNode;
  }

  /**
   * 獲取單一節點 (Readonly)
   */
  public getNode(nodeId: string): Readonly<OmniNode> | undefined {
    return this.vault.get(nodeId);
  }

  /**
   * 搜尋節點 (用於 Agent 檢索)
   */
  public search(query: string): Readonly<OmniNode>[] {
    const q = query.toLowerCase();
    return this.getAllNodes().filter(node => 
      node.nodeId.toLowerCase().includes(q) || 
      node.heart.truthful.toLowerCase().includes(q)
    );
  }

  /**
   * 查詢所有節點 (用於智庫視覺化)
   */
  public getAllNodes(): Readonly<OmniNode>[] {
    return Array.from(this.vault.values());
  }
}

export const omniIndex = OmniIndexKeeper.getInstance();
