import { defineRune } from '@lib/adk/core';
import { DebateInputSchema, GeminiDebateResultSchema } from '@lib/schemas/navigation-schema';
import { GoogleGenAI } from "@google/genai";

export const debateRune = defineRune({
  name: "agent_debate_resolver",
  description: "當多個神使在戰略、合規或證據核實上產生分歧時，啟動辯論機制並由總管最終定奪。",
  schema: DebateInputSchema,
  execute: async (context: any, input: any) => {
    const { conflict_point, arguments: args } = input;
    
    console.log(`[辯論啟動] 衝突點：${conflict_point}`);
    args.forEach((a: any) => {
      console.log(`  - ${a.agent_name}: (${a.stance}) ${a.reasoning}`);
    });

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Missing Gemini API Key in debateRune, falling back to heuristic.");
      return `[辯論裁決] (Fallback) 基於數據優先原則，採納防禦立場。 (信心指數: 80%)`;
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const debatePrompt = `
      你是「導航總管」(The Orchestrator)，負責裁決永續報告神使之間的衝突。
      
      衝突點：${conflict_point}
      
      各方論點：
      ${args.map((a: any) => `- ${a.agent_name}: (${a.stance}) ${a.reasoning}`).join("\n")}
      
      請根據 5T 協議 (Truth 真實, Thankful 善良, Tasteful 美感, Trust 信任, Transcend 通透) 進行裁決。
      注意：證據的真實性 (Truth) 與不可篡改性 (Trust) 優先於純粹的合規揭露。如果證據不足，應建議暫緩揭露或補充證據。
      
      請以 JSON 格式輸出：包含原有的 conflict_point 與 arguments，並加上 \`orchestrator_verdict\` (總管最終裁決評論，解釋你的決定) 與 \`confidence_score\` (裁決信心指數 0-100的數字)。
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: debatePrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: GeminiDebateResultSchema,
          temperature: 0.2, // 低隨機性確保裁決的一致性
        }
      });

      const result = JSON.parse(response.text || "{}");
      return `[總管裁決] ${result.orchestrator_verdict} (信心指數: ${result.confidence_score}%)`;
    } catch (e) {
      console.error("Debate resolution failed:", e);
      return `[總管裁決] (Error) 系統干擾，採取預設保守核實。(信心指數: 50%)`;
    }
  }
});
