import { Type } from "@sinclair/typebox";
import { defineRune } from '@lib/adk/core';

/**
 * [A4] 創意共鳴隊 (Creative Resonator) — 奧義：聖典共鳴
 * 責任：產出具備感召力的 ESG 故事與品牌文案
 */

export const CreativeResonatorInputSchema = Type.Object({
  topic: Type.String({ description: "故事主題 (如 環境保護, 員工福祉)" }),
  targetAudience: Type.String({ description: "目標受眾" }),
  tone: Type.Union([Type.Literal("INSPIRING"), Type.Literal("PROFESSIONAL"), Type.Literal("EMOTIONAL")], { description: "語調" }),
});

export const creativeResonatorRune = defineRune({
  name: "creativeResonatorRune",
  description: "[A4] 創意共鳴隊：生成 ESG 敘事故事與情緒品牌文案",
  schema: CreativeResonatorInputSchema,
  execute: async (_context, input) => {
    const { topic, tone } = input;
    
    return JSON.stringify({
      status: "RESONATING",
      content: `A beautifully crafted ${tone} story about ${topic}.`,
      sentimentScore: 0.95,
      message: `[A4] CREATIVE_RESONATOR has manifested a narrative for ${topic}. Hearts aligned.`
    }, null, 2);
  }
});
