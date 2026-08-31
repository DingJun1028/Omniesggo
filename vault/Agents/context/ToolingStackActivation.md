---
source_origin: .devin/scripts/*.ts + apps/universal-translator/server.mjs
created: 2026-08-13
modified: 2026-08-13
sync: mirror
co_authors: [Devin]
lifecycle: active
tags: [devin, tooling, activation, mcp, deerflow]
access: public-research
---

# 工具/技能/MCP 疊加態勢（全量推進實證）

> 2026-08-13 全量推進三線（Devin 活化 / stash 清理 / DeerFlow 實跑 / MCP 盤點）的資產化記錄。

## A. Devin .devin 工具活化（✅ 全活化）
- `test-coverage-monitor.ts`：跑通 vitest+coverage，產 `.devin/coverage-report.json`（EXIT=1=未達標告警，預期）
- `any-type-eliminator.ts`：掃出 18 處 `any` 使用（真實診斷）
- `doc-code-sync.ts`：修 Python 三引號污染（line 237/363）→ 活化，掃 JSDoc 缺口
- 補 `@vitest/coverage-v8` 依賴缺口（package.json）
- commit: `86359c81e`

## B. Stash 清理（✅ 無遺失）
- `stash@{0}`(pre-ff 雜項) + `stash@{1}`(universal-translator feat, commit 已進 main) 全 drop
- 工作區僅剩 `.Jules/palette.md` 非本輪髒檔

## C. DeerFlow 實跑（⚠️ 受阻・安全正確）
- VPS 容器全 Up + `/api/health` 回 `not_authenticated`
- Better Auth + CSRF + 內網隔離（gateway:8001 不對 host 開放）
- `DEER_FLOW_INTERNAL_AUTH_TOKEN` 不適用 user endpoint
- **受阻原因**：admin 密碼未知，無憑證無法實跑研究任務（安全設計正確，非缺陷）
- 解鎖途徑：①提供 admin 密碼 login 拿 session ②VPS `docker exec` 進 gateway 內部呼叫 ③重置 admin 密碼

## D. MCP 疊加態勢（📋 可疊加但未接）
- 技能層可疊加：`claude-to-deerflow` + `oa-*`(蜂群) + `oa-dual-agent-obsidian`(第二大腦) + `esggo-*`
- MCP 層：用戶級 `~/.hermes/mcp.json` 不存在，專案無 mcp 配置 → **尚無 MCP server 註冊**
- 疊加路徑：DeerFlow gateway 可包 MCP server；OA 蜂群可經 MCP 暴露；Devin 工具的 `execSync` 可封 MCP tool

## 5T 對映
- Traceable: 每工具產 report.json (source_origin)
- Trustworthy: DeerFlow auth 邊界守護正確
- 廣通: 技能疊加架構已具備，MCP 層待接
