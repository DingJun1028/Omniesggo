---
source_origin: app/api/agentic-twin/route.ts + app/api/evidence-upload/route.ts
co_authors: []
created: 2026-08-13
modified: 2026-08-13
sync: mirror
lifecycle: active
tags: [b-d, ollama, minio, free-tier]
access: public-research
---

# B/D 進階項目（Agentic Twin + Evidence Vault）

> 免費算立（自託）實證。已納入 esggo hub（main）。

## B · Agentic Twin 真 LLM（Ollama）
- 實體：`app/api/agentic-twin/route.ts` 讀 `AGENTIC_TWIN_OLLAMA_URL`
- VPS Ollama `qwen2.5:3b` 實證 `llmEnhanced:true`（原創中文洞察）
- 降級：Ollama 不可用/15s 超時 → 保留啟發式

## D · Evidence Vault 真 MinIO
- 實體：`app/api/evidence-upload/route.ts` 手寫 AWS SigV4（零依賴）
- VPS MinIO `:19001` 桶 `evidence-vault` 實證 `PUT 200`
- `EvidenceUploader.tsx` 接真上傳取代 mock

## 對映 5T
- Traceable：env 驅動降級（來源可溯）
- Trustworthy：SigV4 手寫不依賴未審核 SDK

## 相關
- [[05TProtocol]] · [[SecondBrain]] · [[BilingualSubtitlePlayer]]
- 主典：[[esggo-omni-center]] §24.1
