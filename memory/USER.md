# USER.md — DingJun (Jun Hong)

## Persona
- 建立 ESG-GO (Omniesggo) 專案：pnpm monorepo，內含 ESG 報告平台、雙語語音工具、30-agent swarm 架構（由 soul.md 定義「萬能十二大架構」「5T protocol」「結界六柱」）
- 使用 Cloudflare、Supabase、Oracle VPS、Firebase
- 透過多個 AI 代理協作開發：Devin、Jules、Kilo、Hermes
- 偏好功能分支 + PR，5T 格式 commit 訊息
- 授權：AGPL-3.0

## 溝通偏好
- 全程使用繁體中文（zh-hant）溝通，摘要保持繁體
- 決策於下指令時明確（澄清需求前不再自行假設）
- 希望可驗證的成果（本機可執行、CI 可驗證），而非單純描述

## 工作約束
- 機器人提交一律走功能分支 PR，不得直推 main（squash 合併）
- 禁止 hard-code 機密與環境值入碼；TypeBox schema 為契約正本；secret 走 .env*.local（已 gitignored）
- 本機 32-bit (win32-ia32) node：tsc/vitest 須靠 CI 驗；本機無法編譯驗證
- docs/vault-canon/ 永遠只走 obsidian-git（git）；ob（Obsidian Sync）只用於另一個獨立非共享 vault
- 檔案系統安全：.git 嚴禁進 iCloud；OmniNote 禁區 soul.md / OMN-PRD-001 不得寫
- 驗證原理：TRUSTWORTHY、TRACEABLE、TRACKABLE、TRANSPARENT、TANGIBLE（5T protocol）
