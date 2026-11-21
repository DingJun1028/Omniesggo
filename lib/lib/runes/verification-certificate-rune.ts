import { defineRune } from '@lib/adk/core';
import { VerificationCertificateSchema } from '@lib/schemas/navigation-schema';
import { evidenceVaultApi } from '@lib/ncb-service';
import crypto from "crypto";

export const verificationCertificateRune = defineRune({
  name: "issue_digital_5t_certificate",
  description: "針對已完成分析與驗證的章節，簽發不可篡改的 5T 數位確信證書。",
  schema: VerificationCertificateSchema,
  execute: async (context: any, input: any) => {
    try {
      console.log(`[RUNE] 正在為「${input.subject}」簽發 5T 數位證書...`);
      
      // 將證書存入證據金庫作為「終態」記錄
      const certId = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const payload = { ...input, certificate_id: certId, issued_at: new Date().toISOString() };
      
      // 呼叫 5T 協議閘口 (S1-S7 Gateway)
      const gatewayResponse = await fetch("/api/reconnaissance/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "REPORT",
          rawData: {
            title: `5T Certification: ${input.subject}`,
            insight: input.verification_summary,
            source_url: `guide://${context.chapterId}`,
            calculation_method: "ADK Navigation Swarm 5T Assurer",
            raw_evidence: { 
              scores: input.score_5t,
              digital_signature: input.digital_signature 
            }
          }
        })
      });

      if (!gatewayResponse.ok) {
        throw new Error("Gateway Protocol Handshake Failed");
      }

      const gatewayData = await gatewayResponse.json();

      // 同時保留在證據金庫中方便檢索
      await evidenceVaultApi.insert({
        record_id: certId,
        type: "5T Digital Certificate",
        timestamp: payload.issued_at,
        hash: gatewayData.hash, // 使用閘口生成的協議 Hash
        status: "CERTIFIED",
        variant: "optimal"
      });

      return `[5T 協議鎖定] 證書編號：${certId}。閘口 Hash: ${gatewayData.hash.substring(0, 8)}... 🛡️`;
    } catch (error) {
      console.error("Certificate Issuance Error:", error);
      return "【認證失敗】無法簽發數位證書於 NCBDB，請檢核網絡狀態。";
    }
  }
});
