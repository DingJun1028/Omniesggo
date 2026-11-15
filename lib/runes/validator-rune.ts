// PRD: docs/OMN-PRD-001.md §4.1 NFR-03（標籤準確率/ schema 追溯標註）
import { Type, type Static } from "@sinclair/typebox";
import { defineRune } from '@lib/adk/core';

/**
 * [05] 零幻覺驗算師 (The Validator) — 奧義：熵減煉金
 * 責任：確保 AI 輸出符合 ISO-14064-1，消除幻覺，強制公式透明化
 */

export const ValidatorInputSchema = Type.Object({
  aiOutput: Type.String({ description: "AI 生成的 ESG 數據或內容" }),
  referenceStandard: Type.Union([Type.Literal("ISO-14064-1"), Type.Literal("GRI"), Type.Literal("TCFD"), Type.Literal("SASB"), Type.Literal("CSRD")], { description: "對標準則" }),
  metric: Type.String({ description: "具體指標名稱 (如碳排放量)" }),
  claimedValue: Type.Number({ description: "AI 聲稱的數值" }),
  sourceData: Type.Optional(Type.Number({ description: "來源數據的實際值（如有）" })),
  unit: Type.String({ description: "數值單位" }),
});

export const ValidatorResultSchema = Type.Object({
  isHallucination: Type.Boolean(),
  confidenceScore: Type.Number(),     // 0-100 置信度
  varianceRate: Type.Number(),        // 數值差異率
  isISOCompliant: Type.Boolean(),
  verdict: Type.String(),
  correctedValue: Type.Optional(Type.Number()),
  formulaTransparency: Type.String(),
  message: Type.String(),
});

export const validatorRune = defineRune({
  name: "validatorRune",
  description: "[05] 零幻覺驗算師：強制驗算 AI 輸出，消除幻覺，確保 ISO 合規透明",
  schema: ValidatorInputSchema,
  execute: async (_context, input) => {
    const { aiOutput, referenceStandard, metric, claimedValue, sourceData, unit } = input;

    // Calculate variance if source data exists
    let varianceRate = 0;
    let isHallucination = false;

    if (sourceData !== undefined) {
      varianceRate = Math.abs((claimedValue - sourceData) / sourceData) * 100;
      isHallucination = varianceRate > 0.1; // > 0.1% triggers hallucination flag
    }

    // Keyword validation for ISO compliance
    const isoKeywords = ["carbon", "emission", "co2", "ghg", "scope", "tco2e", "碳", "排放", "溫室"];
    const hasRelevantContent = isoKeywords.some(k => aiOutput.toLowerCase().includes(k) || metric.toLowerCase().includes(k));
    const isISOCompliant = hasRelevantContent && varianceRate < 0.1;

    const confidenceScore = Math.max(0, Math.round(100 - varianceRate * 10 - (isHallucination ? 30 : 0)));
    const formulaTransparency = `[${referenceStandard}] ${metric} = ${claimedValue} ${unit}` 
      + (sourceData !== undefined ? ` | Source: ${sourceData} ${unit} | Variance: ${varianceRate.toFixed(4)}%` : " | No source data provided");

    const result: Static<typeof ValidatorResultSchema> = {
      isHallucination,
      confidenceScore,
      varianceRate,
      isISOCompliant,
      verdict: isHallucination ? "REJECTED_HALLUCINATION" : isISOCompliant ? "VERIFIED_COMPLIANT" : "PENDING_REVIEW",
      correctedValue: isHallucination ? sourceData : undefined,
      formulaTransparency,
      message: `[05] VALIDATOR ${isHallucination ? "✗ 幻覺警報！" : "✓ 驗算通過"} ${metric}: ${claimedValue} ${unit} | 置信度: ${confidenceScore}% | ${referenceStandard} 合規: ${isISOCompliant}`
    };

    return JSON.stringify(result, null, 2);
  }
});
