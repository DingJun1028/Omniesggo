import { defineRune } from '@lib/adk/core';
import { ConsistencyCheckSchema } from '@lib/schemas/navigation-schema';

export const consistencyVerificationRune = defineRune({
  name: "cross_chapter_consistency_check",
  description: "驗證當前章節與其他章節之間的數據與邏輯一致性。",
  schema: ConsistencyCheckSchema,
  execute: async (context: any, input: any) => {
    if (!input.is_consistent) {
      return `【邏輯衝突警告】發現「${input.source_chapter}」與「${input.target_chapter}」之間存在不一致：${input.conflict_details}。建議執行：${input.recommendation}`;
    }
    return `[邏輯檢核通過] 「${input.source_chapter}」與「${input.target_chapter}」數據鏈路吻合。`;
  }
});
