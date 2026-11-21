import { Type as TB, type Static } from "@sinclair/typebox";
import { Type, Schema } from "@google/genai";

// TypeBox Schema for TypeScript type safety
export const ESGCalculationResultSchema = TB.Object({
  target_uuid: TB.String({ description: "被處理的萬能元件心核 UUID" }),
  calculated_value: TB.Number({ description: "依照 ISO-14064-1 計算出的最終碳排量 (噸CO2e)" }),
  formula_used: TB.String({ description: "必須公開透明地列出使用的排碳係數與計算算式 (Transparent)" }),
  source_origin: TB.String({ description: "資料來源的原始憑證或使用者 ID (Traceable)" }),
  confidence_score: TB.Number({ minimum: 0, maximum: 1, description: "AI 對此次提取與計算的信心指數" }),
  is_compliant: TB.Boolean({ description: "是否完整包含強制揭露之必要欄位" })
});

export type ESGCalculationResult = Static<typeof ESGCalculationResultSchema>;

// Gemini API Schema for Structured Output
export const GeminiESGCalculationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    target_uuid: { type: Type.STRING, description: "被處理的萬能元件心核 UUID" },
    calculated_value: { type: Type.NUMBER, description: "依照 ISO-14064-1 計算出的最終碳排量 (噸CO2e)" },
    formula_used: { type: Type.STRING, description: "必須公開透明地列出使用的排碳係數與計算算式 (Transparent)" },
    source_origin: { type: Type.STRING, description: "資料來源的原始憑證或使用者 ID (Traceable)" },
    confidence_score: { type: Type.NUMBER, description: "AI 對此次提取與計算的信心指數 (0.0 到 1.0)" },
    is_compliant: { type: Type.BOOLEAN, description: "是否完整包含強制揭露之必要欄位" }
  },
  required: ["target_uuid", "calculated_value", "formula_used", "source_origin", "confidence_score", "is_compliant"]
};
