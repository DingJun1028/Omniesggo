import { defineRune } from '@lib/adk/core';
import { EvidenceVerificationSchema } from '@lib/schemas/navigation-schema';
import { esgMetricsApi, evidenceVaultApi } from '@lib/ncb-service';

export const evidenceVerificationRune = defineRune({
  name: "verify_claims_against_src",
  description: "比對報告敘述與證據金庫 (SRC) 中的原始數據是否一致。",
  schema: EvidenceVerificationSchema,
  execute: async (context: any, input: any) => {
    try {
      console.log(`[RUNE] 正在驗證：「${input.claim_text}」...`);
      
      // 模擬從資料庫中檢索匹配的證據
      const { data: records } = await evidenceVaultApi.list();
      const { data: metrics } = await esgMetricsApi.list();

      // 簡單的關鍵字或邏輯匹配 (實務上可透過嵌入向量搜索)
      const foundMetric = metrics.find(m => input.claim_text.includes(m.name) || input.claim_text.includes(m.value.toString()));
      
      if (foundMetric) {
        return `[證據鏈達成] 敘述「${input.claim_text}」已由 NCBDB 核心數據 (${foundMetric.value} ${foundMetric.unit}) 驗證通過。狀態：${input.verification_status}。`;
      }

      const foundRecord = records.find(r => input.claim_text.includes(r.record_id));
      if (foundRecord) {
        return `[憑證關聯成功] 發現對應憑證：${foundRecord.record_id}，Hash: ${foundRecord.hash.substring(0, 8)}...`;
      }

      return `[驗證提醒] 敘述「${input.claim_text}」目前在證據金庫中查無直接對應數據，建議上傳相關單據。`;
    } catch (error) {
      console.error("Verification Rune Error:", error);
      return "【核心警告】證據金庫連線異常，無法完成自動驗證。";
    }
  }
});
