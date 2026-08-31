---
source_origin: oa-dual-agent-obsidian
co_authors: []
created: 2026-08-13
modified: 2026-08-13
lifecycle: active
access: public-research
---

# 知識花園 · 第二大腦上下文

OA-Team 蜂群的持久記憶層。所有跨會話的上下文、專案亮點、網摘學習、型別鏡像皆落此。

## 雙生拓撲
| 角色 | 存在性 | 觸達 | 任務 |
|------|--------|------|------|
| 雲端助理 | 常駐 VPS | API/CLI/MCP | cron/夜間收件/自主修補 |
| 本機實習生 | 隨喚 | 本機檔+終端 | 研究/製圖/影片/筆記 |

## 使用約定
1. 新增筆記必帶 frontmatter（`source_origin`/`created`/`lifecycle`）
2. 雙方可讀區：`context/`、`briefing/`
3. 寫入限 `Agents/`；改其他區需顯式授權
4. 過 5T 驗證閘才從 `inbox-triage/` 移至 `artifacts/`

## 關聯
- [[TypeMatrix]] — TS 終始矩陣鏡像
- [[OA-Team-第二大腦-架構]] — 整體架構
