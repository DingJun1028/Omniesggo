import { defineRune } from '@lib/adk/core';
import { MarketAdaptationSchema } from '@lib/schemas/navigation-schema';

export const marketAdaptationRune = defineRune({
  name: "adapt_content_for_market",
  description: "針對特定的國際市場（如歐盟 CSRD 或美國 SEC）優化報告文案與術語。",
  schema: MarketAdaptationSchema,
  execute: async (context: any, input: any) => {
    // 模擬市場適配邏輯
    const { target_market, current_content } = input;
    
    let adaptation_strategy = "";
    let rewritten_snippet = "";
    let cultural_nuance = "";

    if (target_market.includes("歐盟") || target_market.includes("CSRD")) {
      adaptation_strategy = "強調雙重重大性 (Double Materiality) 與 ESRS 準則對標。";
      rewritten_snippet = "針對歐盟市場，我們強化了價值鏈 (Value Chain) 的碳足跡揭露，並確保符合 ESRS E1 要求。";
      cultural_nuance = "歐盟監管者更偏好具體的量化風險矩陣。";
    } else {
      adaptation_strategy = "強調財務重大性與投資者溝通。";
      rewritten_snippet = "我們聚焦於 ESG 對企業長期財務表現的影響，並對標 SASB 產業指標。";
      cultural_nuance = "北美投資者關注重點在於風險緩解與機會捕捉。";
    }

    return `[市場適配] 目標：${target_market}。策略：${adaptation_strategy}。建議文案片段：${rewritten_snippet}`;
  }
});
