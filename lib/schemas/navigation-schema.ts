import { Type as TB, type Static } from "@sinclair/typebox";
import { Type, Schema } from "@google/genai";

export const StrategicMappingSchema = TB.Object({
  chapter_id: TB.String({ description: "正在處理的報告章節 ID" }),
  mapped_standards: TB.Array(TB.String(), { description: "對應的國際準則代碼 (如 GRI 305-1, SASB EM-EP-110a.1)" }),
  compliance_status: TB.Union([TB.Literal("full"), TB.Literal("partial"), TB.Literal("gap")], { description: "目前內容的合規狀態" }),
  gap_analysis: TB.String({ description: "精確點出缺少的數據、政策或管理描述。" }),
  best_practice_benchmark: TB.String({ description: "同業標竿在該章節的最佳揭露實踐案例。" }),
  action_plan: TB.Array(TB.String(), { description: "具體的下一步改善建議步驟。" })
});

export type StrategicMapping = Static<typeof StrategicMappingSchema>;

export const GeminiStrategicMappingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    chapter_id: { type: Type.STRING, description: "正在處理的報告章節 ID" },
    mapped_standards: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "對應的國際準則代碼 (如 GRI 305-1, SASB EM-EP-110a.1)" 
    },
    compliance_status: { 
      type: Type.STRING, 
      enum: ["full", "partial", "gap"],
      description: "目前內容的合規狀態" 
    },
    gap_analysis: { type: Type.STRING, description: "精確點出缺少的數據、政策或管理描述。" },
    best_practice_benchmark: { type: Type.STRING, description: "同業標竿在該章節的最佳揭露實踐案例。" },
    action_plan: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "具體的下一步改善建議步驟。" 
    }
  },
  required: ["chapter_id", "mapped_standards", "compliance_status", "gap_analysis", "best_practice_benchmark", "action_plan"]
};

export const ConsistencyCheckSchema = TB.Object({
  source_chapter: TB.String({ description: "發起檢查的章節" }),
  target_chapter: TB.String({ description: "被比對的目標章節" }),
  is_consistent: TB.Boolean({ description: "兩者數據或描述是否一致" }),
  conflict_details: TB.Optional(TB.String({ description: "若不一致，請點出衝突的數據點或邏輯斷層。" })),
  recommendation: TB.String({ description: "建議的修正方向。" })
});

export type ConsistencyCheck = Static<typeof ConsistencyCheckSchema>;

export const GeminiConsistencyCheckSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    source_chapter: { type: Type.STRING },
    target_chapter: { type: Type.STRING },
    is_consistent: { type: Type.BOOLEAN },
    conflict_details: { type: Type.STRING },
    recommendation: { type: Type.STRING }
  },
  required: ["source_chapter", "target_chapter", "is_consistent", "recommendation"]
};

export const EvidenceVerificationSchema = TB.Object({
  claim_text: TB.String({ description: "正在驗證的原文敘述內容。" }),
  linked_evidence_id: TB.Optional(TB.String({ description: "關聯的證據 ID (如 TRC-XXX)。" })),
  verification_status: TB.Union([TB.Literal("verified"), TB.Literal("unverified"), TB.Literal("discrepancy")], { description: "驗證狀態。" }),
  verified_value: TB.Optional(TB.Number({ description: "從資料庫中查得的真實數值。" })),
  audit_hash: TB.Optional(TB.String({ description: "該證據的 SHA-256 數位簽章。" })),
  remark: TB.String({ description: "驗證意見或需要補充的說明。" })
});

export type NavigationEvidenceVerification = Static<typeof EvidenceVerificationSchema>;
// ts-matrix: 對外相容別名 (API 不變)
export type { NavigationEvidenceVerification as EvidenceVerification };

export const GeminiEvidenceVerificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    claim_text: { type: Type.STRING },
    linked_evidence_id: { type: Type.STRING },
    verification_status: { type: Type.STRING, enum: ["verified", "unverified", "discrepancy"] },
    verified_value: { type: Type.NUMBER },
    audit_hash: { type: Type.STRING },
    remark: { type: Type.STRING }
  },
  required: ["claim_text", "verification_status", "remark"]
};

export const VerificationCertificateSchema = TB.Object({
  certificate_id: TB.String({ description: "數位證書唯一識別碼 (V-SHA256)" }),
  issued_at: TB.String({ description: "簽發時間" }),
  subject: TB.String({ description: "驗證標的 (章節名稱)" }),
  verification_summary: TB.String({ description: "驗證結論總結" }),
  score_5t: TB.Object({
    truthful: TB.Number({ minimum: 0, maximum: 100, description: "【真】Traceable: 鏈式溯源與來源追蹤" }),
    transferful: TB.Number({ minimum: 0, maximum: 100, description: "【通】Trackable: 數據流轉與傳遞路徑" }),
    thankful: TB.Number({ minimum: 0, maximum: 100, description: "【善】Transparent: 白盒算法與演算透明度" }),
    tasteful: TB.Number({ minimum: 0, maximum: 100, description: "【美】Tangible: UI 物理感知與液態渲染" }),
    trustful: TB.Number({ minimum: 0, maximum: 100, description: "【信】Trustworthy: Hash Lock 數位簽章防篡改" })
  }),
  digital_signature: TB.String({ description: "由神使集體刻印的數位簽章 (Hash)" }),
  status: TB.Union([TB.Literal("certified"), TB.Literal("pending_vouchers"), TB.Literal("rejected")])
});

export type VerificationCertificate = Static<typeof VerificationCertificateSchema>;

export const RegulationUpdateSchema = TB.Object({
  standard_name: TB.String({ description: "準則名稱 (如 GRI, CSRD)" }),
  latest_version: TB.String({ description: "最新版本號" }),
  update_summary: TB.String({ description: "重大更新摘要" }),
  impact_on_reporting: TB.String({ description: "對當前報告撰寫的潛在影響描述" }),
  reference_link: TB.String({ description: "原始公告連結" })
});

export type RegulationUpdate = Static<typeof RegulationUpdateSchema>;

export const GeminiRegulationUpdateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    standard_name: { type: Type.STRING },
    latest_version: { type: Type.STRING },
    update_summary: { type: Type.STRING },
    impact_on_reporting: { type: Type.STRING },
    reference_link: { type: Type.STRING }
  },
  required: ["standard_name", "latest_version", "update_summary", "impact_on_reporting", "reference_link"]
};

export const MarketAdaptationSchema = TB.Object({
  target_market: TB.String({ description: "目標市場 (如 歐盟, 美國, 台灣)" }),
  adaptation_strategy: TB.String({ description: "適配策略說明" }),
  rewritten_content: TB.String({ description: "針對該市場優化後的文案內容" }),
  cultural_nuance: TB.String({ description: "文化或語境上的細微調整建議" })
});

export type MarketAdaptation = Static<typeof MarketAdaptationSchema>;

export const GeminiMarketAdaptationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    target_market: { type: Type.STRING },
    adaptation_strategy: { type: Type.STRING },
    rewritten_content: { type: Type.STRING },
    cultural_nuance: { type: Type.STRING }
  },
  required: ["target_market", "adaptation_strategy", "rewritten_content", "cultural_nuance"]
};

export const DebateInputSchema = TB.Object({
  conflict_point: TB.String(),
  arguments: TB.Array(TB.Object({
    agent_name: TB.String(),
    stance: TB.String(),
    reasoning: TB.String()
  }))
});

export const DebateResultSchema = TB.Intersect([
  DebateInputSchema,
  TB.Object({
    orchestrator_verdict: TB.String({ description: "總管最終裁決" }),
    confidence_score: TB.Number({ minimum: 0, maximum: 100, description: "裁決信心指數" })
  })
]);

export type DebateResult = Static<typeof DebateResultSchema>;

export const GeminiDebateResultSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    conflict_point: { type: Type.STRING },
    arguments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          agent_name: { type: Type.STRING },
          stance: { type: Type.STRING },
          reasoning: { type: Type.STRING }
        }
      }
    },
    orchestrator_verdict: { type: Type.STRING },
    confidence_score: { type: Type.NUMBER }
  },
  required: ["conflict_point", "arguments", "orchestrator_verdict", "confidence_score"]
};
