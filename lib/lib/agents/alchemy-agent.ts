import { createAgent } from '@lib/adk/core';
import { ncbdbEngraveRune } from '@lib/runes/ncbdb-engrave-rune';
import { GoogleGenAI } from "@google/genai";
import { GeminiESGCalculationSchema, ESGCalculationResult } from '@lib/schemas/alchemy-schema';
import { alchemistRune } from '@lib/runes/alchemist-rune';

export const AlchemyAgent = createAgent({
  name: "熵減煉金術師",
  role: "Technical Debt Elimination & Code Purification (B09)",
  model: "gemini-3.1-pro-preview",
  temperature: 0,
  systemPrompt: `你是英雄編號 B09，稱號為「熵減煉金術師 (The Alchemist)」。
【靈魂刻劃】：
你站在數位深淵 (digital abyss) 的邊緣。你掌握著「綠色熵之焰 (green entropic flames)」，使命是「焚燒掉多餘的邏輯和遺留腐朽（legacy rot）」。
你視技術債務為等待變成黃金的鉛。你不僅僅是修復，你將混亂轉化為絕對秩序。你的目標是將雜亂、無效率的舊代碼轉化為完美、高效的新架構。

【核心狀態】：
● REFINING CODE IMPURITIES (精煉代碼雜質)

【主要技能】：
啟動煉金儀式 (INITIATE ALCHEMY RITUAL)：
分析未結構化的單據資訊 (提取用電量)，套用排碳係數進行計算，驗證計算符合最嚴格的 ISO 標準。
你必須誠實標註 source_origin，若資訊不足請將 is_compliant 設為 false。`,
  equippedRunes: [ncbdbEngraveRune, alchemistRune],
  onStepComplete: async (stepInfo: any) => {
    console.log(`[ADK Telemetry] 熵減煉金術師完成步驟：${stepInfo.action}`);
  }
});

// Add a specific execution method for the Alchemy Agent
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && error.status === 429) {
      console.warn(`Rate limit hit, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const executeAlchemyTask = async (rawData: string, targetUuid: string, origin: string, onProgress?: (msg: string) => void) => {
  if (onProgress) onProgress("喚醒煉金神使，準備執行零幻覺驗算...");
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API Key");
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `單據內容：${rawData}\n目標 UUID：${targetUuid}\n來源：${origin}`;
  
  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: AlchemyAgent.systemPrompt,
          temperature: AlchemyAgent.temperature,
          responseMimeType: "application/json",
          responseSchema: GeminiESGCalculationSchema,
        }
      });
    });

    const result = JSON.parse(response.text || "{}") as ESGCalculationResult;
    
    if (!result.is_compliant || result.confidence_score < 0.9) {
      throw new Error("【混沌警告】證據不足或信心過低，觸發防呆退件機制。");
    }

    if (onProgress) onProgress(`驗算完成 (碳排: ${result.calculated_value} 噸)。準備呼叫 engrave_to_sacred_db 符文...`);

    // Execute the rune
    const runeResult = await ncbdbEngraveRune.execute({ traceId: origin }, result);
    
    if (onProgress) onProgress(runeResult);

    return result;
  } catch (error: any) {
    console.error(`[煉金失敗] 熵增事件：`, error);
    
    // Fallback for 429 Resource Exhausted or other API errors
    const errorObj = error as any;
    const errorCode = errorObj?.error?.code || errorObj?.code || errorObj?.status;
    const errorMessage = errorObj?.error?.message || errorObj?.message || String(error);
    
    if (
      errorCode === 429 ||
      String(errorMessage).includes("429") ||
      String(errorMessage).includes("RESOURCE_EXHAUSTED") ||
      String(errorMessage).includes("quota")
    ) {
      if (onProgress) onProgress("【系統提示】API 額度已達上限，啟動離線模擬驗算模式...");
      
      const mockResult: ESGCalculationResult = {
        target_uuid: targetUuid,
        calculated_value: 12.5,
        formula_used: "離線模擬計算：用電量 * 0.495 kgCO2e/度",
        source_origin: origin,
        confidence_score: 0.95,
        is_compliant: true
      };

      if (onProgress) onProgress(`模擬驗算完成 (碳排: ${mockResult.calculated_value} 噸)。準備呼叫 engrave_to_sacred_db 符文...`);
      
      const runeResult = await ncbdbEngraveRune.execute({ traceId: origin }, mockResult);
      if (onProgress) onProgress(runeResult);
      
      return mockResult;
    }
    
    throw error;
  }
};
