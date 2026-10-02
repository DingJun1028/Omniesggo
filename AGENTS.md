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

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
