# esggo AGENTS.md — 自動修復協議

## 自動修復機制

本專案啟用了 **自動修復 + 萬能分身追蹤** 機制，位於 `.hermes/auto-repair/`。

### 機制架構

```
.hermes/auto-repair/
├── error-patterns.yaml   # 錯誤模式匹配規則
├── fix-actions.yaml      # 修復動作映射
├── repair-engine.py      # 核心修復引擎
├── clone-tracker.py      # 萬能分身追蹤器
├── auto-fix.sh           # 入口腳本
├── repair-log.jsonl      # 修復日誌
└── tracker-log.jsonl     # 追蹤日誌
```

### 使用方式

```bash
# 根據錯誤訊息自動修復
./auto-fix.sh "Permission denied (publickey)"

# 從檔案讀取錯誤並修復
./auto-fix.sh --file /tmp/error.log

# 監控模式：自動檢查並修復
./auto-fix.sh --monitor

# 查看追蹤器狀態
./auto-fix.sh --status

# 顯示幫助
./auto-fix.sh --help
```

### 自動修復範圍

| 錯誤類型 | 自動修復動作 |
|---|---|
| Dependabot 漏洞 | 自動生成 per-package PR |
| SSH Permission denied | 自動 chmod 600 + 重連 |
| pnpm audit 漏洞 | 自動添加 override 到 pnpm-workspace.yaml |
| 建構失敗 (Prisma) | 自動 prisma generate + rebuild |
| .env.example 衝突 | 自動去重合併 |
| Python 截斷 | 自動寫檔後執行 |
| VPS PM2 reload | 自動 SSH + pm2 reload ecosystem.config.js |

### 萬能分身追蹤

- 每個修復任務分配唯一 `task_id`
- 分身會追蹤每一步進度並記錄日誌
- 失敗時自動升級（最多 3 次重試）
- 升級後通知用戶手動介入

### 配置

錯誤模式定義於 `.hermes/auto-repair/error-patterns.yaml`，修復動作定義於 `.hermes/auto-repair/fix-actions.yaml`。

### 日誌

- 修復日誌：`.hermes/auto-repair/repair-log.jsonl`
- 追蹤日誌：`.hermes/auto-repair/tracker-log.jsonl`
- 狀態檔：`.hermes/auto-repair/tracker-state.json`

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->


## 資料庫遷移說明（2026-10-27：Supabase 全面取代 Prisma）

- Prisma（`@prisma/client`、`prisma`、`@prisma/adapter-pg`、`postinstall: prisma generate`）已自依賴與管線移除；`prisma/` 目錄與相關鏡像腳本已刪除。
- 資料層改為 `src/lib/db/prisma-compat.ts`：Supabase 支援的 Prismo 相容層，保留 `prisma.<model>.<method>()` 呼叫形狀，既有呼叫端僅改 import 路徑。
- 環境變數：主連線 `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`（或 anon key 後備）；次要連線 `SUPABASE_OMNI_URL` + `SUPABASE_OMNI_SERVICE_ROLE_KEY`；Raw SQL 走 `pg`，使用 `DATABASE_URL`。表名預設為 Prisma Model 名，可用 `SUPABASE_TABLE_MAP` (JSON) 覆寫。
- 已知限制：`$transaction` 為循序執行、非原子；Raw SQL 僅限 Node 環境；營運腳本（omni-snapshot/omni-healthcheck/seed-5t-demo/omni-dreams/create_omni_memory）已改為 `pg` 直連 SQL。
- CI/CD 已移除所有 `prisma generate` / `prisma migrate` 步驟。合併前需在本地執行一次 `pnpm install` 以更新 `pnpm-lock.yaml`（frozen-lockfile 工作流程相依）。
