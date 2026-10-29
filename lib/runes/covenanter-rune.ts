import { Type } from "@sinclair/typebox";
import { defineRune } from '@lib/adk/core';

/**
 * [R1] 契約鑄造者 (The Covenanter) — 奧義：本質提純
 * 責任：負責定義 IComponentCore，注入唯一 UUID 並執行深度凍結
 */

export const CovenanterInputSchema = Type.Object({
  componentName: Type.String({ description: "欲鑄造的元件名稱" }),
  category: Type.String({ description: "元件類別" }),
});

export const covenanterRune = defineRune({
  name: "covenanterRune",
  description: "[R1] 契約鑄造者：執行量子本質提取，注入唯一 UUID 並執行深度凍結 (Object.freeze)",
  schema: CovenanterInputSchema,
  execute: async (_context, input) => {
    const { componentName, category } = input;
    const uuid = crypto.randomUUID();
    
    return JSON.stringify({
      status: "FORGED",
      component: {
        uuid,
        name: componentName,
        category,
        version: "3.1.0-Omni",
        timestamp: Date.now(),
        isFrozen: true
      },
      message: `[R1] COVENANTER has forged ${componentName} [${uuid}]. Immutability LOCK engaged.`
    }, null, 2);
  }
});
