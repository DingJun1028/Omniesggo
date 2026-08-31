# 實踐技書 (Practical Skills Handbook)

> 將 Hermes Agent 實戰經驗與專案知識沉澱為可重用的方法論章節。

## 章節索引

| 章 | 主題 | 狀態 |
|---|------|------|
| Ch.01 | 5T 協議實作 | ✅ |
| Ch.02 | VPS 部署與 pm2 管理 | ✅ |
| Ch.03 | Webhook HMAC 守門 | ✅ |
| Ch.04 | Zenrows 資料擷取整合 | ✅ |
| Ch.05 | Next.js Health + Metrics | ✅ |
| Ch.06 | n8n 自動化排程 | ✅ |
| Ch.07 | OmniTag 標籤契約 | ✅ |
| Ch.08 | 熵減煉金與重構 | ✅ |
| Ch.09 | Kill Switch 與治理 | ✅ |
| Ch.10 | 結界誓約 | ✅ |

## 品質門檻與 CI 守則 (OmniTag 合約率 100%)

本專案所有 `.ts` 產物必須攜帶合規 OmniTag 標頭（見 Ch.07）。合約率由 CI 強制把關：

- **驗證入口**：`pnpm oa:audit`
  掃描 `src/lib` + `cli/oa-cli/src`，輸出帶標籤數 / 合約數 / 合約率；違規即非零退出。
- **CI 閘**：`.github/workflows/ci.yml` 的 `omnitag-audit` job 強制合約率 **100%**（`agent` + `lifecycle` + `p` 三枚必備且值合法），未達標 PR 不予合併。
- **自動補標**：`npx tsx cli/oa-cli/src/index.ts tag --init --write --dir <dirs>`
  為無標頭 `.ts` 依路徑推測陣列並自動補合規標頭（§6.2 預設即合規）。
- **跨語言一致性**：Python 端 `src/core/verification.py` 與 TS 端 `src/lib/five-t-protocol.ts` 共用同構 Hash Lock 算法，位元級吻合（見 Ch.01）。

> 任何並發 session / PR 都應先跑 `pnpm oa:audit` 確認 100% 再推送，避免 CI 紅。

## 導覽

- `INDEX.md` — 依任務 / 工具 / 組合流程查章節
- `MECE.md` — 支柱地圖 + 生命週期缺口分析
- `chapters/` — 章節原文
- `references/` — 校正後知識庫
- `templates/` — 章節模板
