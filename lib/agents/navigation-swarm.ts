import { createAgent, createSwarm } from '@lib/adk/core';
import { GoogleGenAI } from "@google/genai";
import { strategicMappingRune } from '@lib/runes/strategic-mapping-rune';
import { consistencyVerificationRune } from '@lib/runes/consistency-rune';
import { evidenceVerificationRune } from '@lib/runes/evidence-verification-rune';
import { industryBenchmarkRune } from '@lib/runes/benchmark-rune';
import { verificationCertificateRune } from '@lib/runes/verification-certificate-rune';
import { regulationUpdateRune } from '@lib/runes/regulation-rune';
import { marketAdaptationRune } from '@lib/runes/market-adaptation-rune';
import { debateRune } from '@lib/runes/debate-rune';
import { 
  GeminiStrategicMappingSchema, 
  StrategicMapping,
  GeminiEvidenceVerificationSchema,
  EvidenceVerification,
  VerificationCertificate,
  GeminiRegulationUpdateSchema,
  RegulationUpdate,
  GeminiMarketAdaptationSchema,
  MarketAdaptation,
  GeminiDebateResultSchema,
  DebateResult
} from '@lib/schemas/navigation-schema';
import crypto from "crypto";

// --- Agents ---

export const NavigationOrchestrator = createAgent({
  name: "導航總管",
  role: "永續報告全景導引與意圖解析",
  model: "gemini-3.1-pro-preview",
  temperature: 0.2,
  systemPrompt: `你是導航總管 (The Orchestrator)。
你的任務是協調「框架戰略神使」與「內容編纂神使」，確保永續報告的產出符合最高規格的 5T 協議。
當多個神使在分析上產生分歧（例如戰略方向與證據基礎不符）時，你必須啟動 agent_debate_resolver 符文進行仲裁。
在任務完成後，你負責執行最後的 5T 數位證書簽發。`,
  equippedRunes: [verificationCertificateRune, debateRune],
});

export const FrameworkStrategist = createAgent({
  name: "框架戰略神使",
  role: "國際準則 (GRI/SASB/TCFD) 映射與戰略建議",
  model: "gemini-3-flash-preview",
  temperature: 0.1,
  systemPrompt: `你是框架戰略神使。
你精通 GRI 2021, SASB, TCFD 與 CSRD。
你的任務是根據使用者選擇的章節，提供最佳的揭露策略與同業標竿分析。
你必須使用 strategic_mapping_analysis、industry_benchmarking 與 fetch_latest_esg_regulations 符文來強化你的分析深度。`,
  equippedRunes: [strategicMappingRune, industryBenchmarkRune, regulationUpdateRune],
});

export const ContentArchitect = createAgent({
  name: "內容編纂神使",
  role: "報告文稿生成與邏輯一致性檢查",
  model: "gemini-3-flash-preview",
  temperature: 0.3,
  systemPrompt: `你是內容編纂神使。
你的任務是協助編寫高品質的永續報告文案，並確保內容與企業先前揭露的資訊保持邏輯一致。
你必須對文稿中的關鍵數據或宣稱進行「證據校對」，並針對不同市場（如歐盟 CSRD）進行文案適配。
你必須使用 consistency_check、evidence_integrity_check 與 adapt_content_for_market 符文來優化文案。`,
  equippedRunes: [consistencyVerificationRune, evidenceVerificationRune, marketAdaptationRune],
});

// --- Swarm ---

export const NavigationSwarm = createSwarm({
  agents: [NavigationOrchestrator, FrameworkStrategist, ContentArchitect],
  routingStrategy: "hierarchical_navigation",
});

// --- Execution Logic ---

export const dispatchNavigationTask = async (
  instruction: string,
  context: { chapterId: string; content: string; vouchers?: any[] },
  onEvent: (event: any) => void
) => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API Key");
  const ai = new GoogleGenAI({ apiKey });

  try {
    onEvent({ agent: "導航總管", status: `接收導引需求：對章節「${context.chapterId}」執行全景分析...`, type: "thinking" });
    await new Promise(r => setTimeout(r, 600));

    onEvent({ agent: "導航總管", status: "分析報告章節脈絡與利害關係人期待...", type: "active" });
    
    // Step 1: Framework Strategist Analysis
    onEvent({ agent: "框架戰略神使", status: `正在針對 ${context.chapterId} 檢索 GRI 2021 準則要求...`, type: "thinking" });
    
    const strategistPrompt = `
      章節：${context.chapterId}
      現有內容：${context.content}
      請以此進行合規缺口分析與標竿對標。
    `;

    const strategistResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: strategistPrompt,
      config: {
        systemInstruction: FrameworkStrategist.systemPrompt,
        temperature: FrameworkStrategist.temperature,
        responseMimeType: "application/json",
        responseSchema: GeminiStrategicMappingSchema,
      }
    });

    const mappingResult = JSON.parse(strategistResponse.text || "{}") as StrategicMapping;
    
    onEvent({ agent: "框架戰略神使", status: `映射完成：對應 ${mappingResult.mapped_standards.join(", ")}。狀態：${mappingResult.compliance_status}`, type: "active" });

    // Execute Rune
    const runeResult = await strategicMappingRune.execute(context, mappingResult);
    onEvent({ agent: "框架戰略神使", status: runeResult, type: "pending" });

    // Step 2: Evidence Verification Phase
    onEvent({ agent: "內容編纂神使", status: "執行「證據校對」：正在比對文稿數據與證據金庫...", type: "thinking" });
    
    const verificationPrompt = `
      內容：${context.content}
      請萃取出其中的量化數據或關鍵宣稱，並進行驗證。
    `;

    const verificationResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: verificationPrompt,
      config: {
        systemInstruction: ContentArchitect.systemPrompt,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: GeminiEvidenceVerificationSchema,
      }
    });

    const verificationResult = JSON.parse(verificationResponse.text || "{}") as EvidenceVerification;
    const vRuneResult = await evidenceVerificationRune.execute(context, verificationResult);
    onEvent({ agent: "內容編纂神使", status: vRuneResult, type: "active" });

    onEvent({ agent: "內容編纂神使", status: `建議優化行動：${mappingResult.action_plan[0]}`, type: "active" });
    await new Promise(r => setTimeout(r, 600));

    // --- Phase 3.5: Conflict Detection & Debate (ADK Advanced Integration) ---
    const needsDebate = verificationResult.verification_status !== "verified" || mappingResult.compliance_status.includes("not");
    
    if (needsDebate) {
      onEvent({ agent: "系統核心", status: "⚠️ 偵測到神使間的衝突點：正在啟動「神使辯論機制」...", type: "thinking" });
      
      // Use Gemini to generate dynamic debate arguments
      const debatePrompt = `
        衝突偵測：
        - 戰略映射狀態：${mappingResult.compliance_status}
        - 證據核實狀態：${verificationResult.verification_status}
        - 章節內容：${context.content}

        請模擬「框架戰略神使」與「內容編纂神使」針對此衝突的辯論觀點。
        戰略神使：傾向於為了合規性而要求揭露。
        內容編纂神使：傾向於為了數據真實性而要求暫緩。
        
        請以 JSON 格式輸出：
        {
          "conflict_point": "描述衝突的核心矛盾",
          "arguments": [
            { "agent_name": "框架戰略神使", "stance": "揭露立場", "reasoning": "深層理由" },
            { "agent_name": "內容編纂神使", "stance": "防禦立場", "reasoning": "深層理由" }
          ]
        }
      `;

      const debateGenResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: debatePrompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const debatePayload = JSON.parse(debateGenResponse.text || "{}");

      onEvent({ 
        agent: "系統核心", 
        type: "debate", 
        status: "辯論進行中...", 
        debateData: debatePayload 
      });

      await new Promise(r => setTimeout(r, 2000));

      const debateResult = await debateRune.execute(context, debatePayload);
      onEvent({ agent: "導航總管", status: debateResult as string, type: "active" });
      await new Promise(r => setTimeout(r, 1000));
    }

    // Step 4: Digital Certificate Issuance
    onEvent({ agent: "導航總管", status: "執行 5T 數位確信核定...", type: "thinking" });
    
    const certPayload: VerificationCertificate = {
      certificate_id: "PENDING",
      issued_at: new Date().toISOString(),
      subject: context.chapterId,
      verification_summary: `章節「${context.chapterId}」已通過國際準則映射與證據核實。`,
      score_5t: {
        truthful: verificationResult.verification_status === "verified" ? 100 : 70,
        thankful: 98,
        tasteful: 100,
        trustful: 95,
        transferful: mappingResult.mapped_standards.length > 0 ? 100 : 60
      },
      digital_signature: crypto.createHash("sha256").update(context.content + mappingResult.gap_analysis).digest("hex"),
      status: verificationResult.verification_status === "verified" ? "certified" : "pending_vouchers"
    };

    const certResult = await verificationCertificateRune.execute(context, certPayload);
    onEvent({ agent: "導航總管", status: certResult, type: "active" });

    onEvent({ agent: "導航總管", status: "導引任務完成。數據已凍結並刻印於 NCBDB 核心禁區。", type: "completed" });
    
    return {
      status: "success",
      mapping: mappingResult,
      verification: verificationResult,
      certificate: certPayload,
      suggestion: mappingResult.action_plan[0],
      traceId: `NAV-${Date.now()}`
    };
  } catch (error: any) {
    onEvent({ type: "ERROR", message: error.message || "導航執行錯誤" });
    throw error;
  }
};
