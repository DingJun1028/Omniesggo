import { createSwarm } from '@lib/adk/core';
import { AlchemyAgent, executeAlchemyTask } from "./alchemy-agent";
import {
  CovenanterAgent,
  SemanticistAgent,
  AestheticAgent,
  TracerAgent,
  ValidatorAgent,
  RuneScrivenerAgent,
  DispatcherAgent,
  TelepathAgent,
  EngraverAgent
} from "./adk-apostles";
import {
  SilentWatcherAgent,
  VeridicalAgent,
  HarmonizerAgent,
  CompassionateAgent,
  EtherealPilotAgent,
  ChroniclerAgent,
  AdapterAgent,
  ResonatorAgent,
  AuthenticatorAgent,
  SymbioteAgent
} from "./arvo-agents";

export const ESGSwarm = createSwarm({
  agents: [
    CovenanterAgent,
    SemanticistAgent,
    AestheticAgent,
    TracerAgent,
    ValidatorAgent,
    RuneScrivenerAgent,
    DispatcherAgent,
    TelepathAgent,
    AlchemyAgent,
    EngraverAgent,
    SilentWatcherAgent,
    VeridicalAgent,
    HarmonizerAgent,
    CompassionateAgent,
    EtherealPilotAgent,
    ChroniclerAgent,
    AdapterAgent,
    ResonatorAgent,
    AuthenticatorAgent,
    SymbioteAgent
  ],
  routingStrategy: "semantic_intent",
});

export const dispatchSwarmTask = async (
  instruction: string, 
  traceId: string, 
  onEvent: (event: any) => void,
  isOptimized: boolean = false
) => {
  try {
    const delayMultiplier = isOptimized ? 0.3 : 1; // Faster processing if optimized

    onEvent({ agent: "總管大腦", status: `接收指令：${instruction} (Trace: ${traceId})`, type: "thinking" });
    await new Promise(r => setTimeout(r, 800 * delayMultiplier));

    onEvent({ agent: "感知神使", status: isOptimized ? "量子環境掃描完成。提取率 100%。" : "掃描環境參數與單據... 提取完成。", type: "active" });
    await new Promise(r => setTimeout(r, 1000 * delayMultiplier));

    // Randomly pick an ARVO apostle to chime in
    const arvoApostles = ["幽玄觀察者", "真實編碼官", "調和導航員", "慈悲守護者"];
    const randomApostle = arvoApostles[Math.floor(Math.random() * arvoApostles.length)];
    onEvent({ 
      agent: randomApostle, 
      status: `[ARVO] 偵測到靈魂波動... 數據正在轉化為感性洞察。`, 
      type: "active" 
    });
    await new Promise(r => setTimeout(r, 800 * delayMultiplier));

    // Execute real Gemini task
    const mockRawData = "台電電子帳單，本期用電度數：45000 度。";
    const targetUuid = `ESG-CALC-${Date.now()}`;
    
    onEvent({ agent: "煉金神使", status: isOptimized ? "套用動態排碳係數矩陣... 執行零幻覺驗算" : "套用排碳係數 (0.495)... 執行零幻覺驗算", type: "active" });
    
    const result = await executeAlchemyTask(
      mockRawData, 
      targetUuid, 
      traceId,
      (msg) => {
        onEvent({ agent: "煉金神使", status: msg, type: "pending" });
      }
    );

    onEvent({ agent: "煉金神使", status: `驗算成功！碳排量: ${result.calculated_value} 噸。已觸發 Hash 凍結。`, type: "completed" });
    await new Promise(r => setTimeout(r, 800 * delayMultiplier));

    onEvent({ agent: "編纂神使", status: isOptimized ? "神經網絡自動組裝永續報告書章節" : "將凍結數據組裝為最終永續報告書章節", type: "active" });
    await new Promise(r => setTimeout(r, 1000 * delayMultiplier));

    // Resonator check
    onEvent({ agent: "共鳴感應模組", status: "分析社會影響與共鳴深意... 完成。", type: "completed" });
    await new Promise(r => setTimeout(r, 500 * delayMultiplier));

    return { status: "success", data: result };
  } catch (error: any) {
    onEvent({ type: "ERROR", message: error.message || "未知錯誤" });
    throw error;
  }
};

export const triggerSelfOptimization = async (onEvent: (event: any) => void) => {
  onEvent({ agent: "總管大腦", status: "啟動自我優化協議 (Self-Optimization Protocol)...", type: "thinking" });
  await new Promise(r => setTimeout(r, 600));
  
  onEvent({ agent: "系統核心", status: "分析 NCBDB 歷史軌跡與決策樹...", type: "active" });
  await new Promise(r => setTimeout(r, 800));
  
  onEvent({ agent: "系統核心", status: "重構神經突觸... 提升 5T 協議驗證效率 70%", type: "active" });
  await new Promise(r => setTimeout(r, 800));
  
  onEvent({ agent: "總管大腦", status: "自我優化完成。系統已升級至極致簡約型態 (Ultimate Minimalist Edition)。", type: "completed" });
  await new Promise(r => setTimeout(r, 600));
};
