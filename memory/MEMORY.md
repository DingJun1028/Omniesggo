# MEMORY.md — Environment facts & project conventions

## 工作目錄
- 專案根：`C:\Users\Administrator\Documents\Project\Omniesggo`
- 開發流程：功能分支 PR，5T 格式 commit，gear/soul.md 為正典

## Node/Javascript 環境（重要）
- PATH 中的 node 為 **32-bit (win32-ia32)**，`tsc`/`vitest`/`pnpm` 無法編譯驗證
- 64-bit node 安裝於：`C:\Users\Administrator\AppData\Local\hermes\tools\node-26.12.1-win32-x64\node.exe`
- pnpm 全域 prefix：`C:\Program Files (x86)\nodejs`
- 本機 python 3.14.9，`pip` 未在 PATH，須用 `python -m pip`

## 終端工具
- Terminal 走 MSYS/git-bash，PowerShell 指令無效（如 `$env:FOO`）
- MSYS /tmp 路徑不被 native Windows Python 認識（用 `C:/tmp/...`）
- PowerShell 腳本需透過 `Start-Process` 非互動式模式執行
- 背景程序（background=true）需要 PTY 才能正常輸入

## 資料庫與檔案
- UpNote SQLite: `C:\Users\Administrator\AppData\Roaming\UpNote\upnote.sqlite3`
- Mistral workflows: `C:\Users\Administrator\Documents\Project\mistral-workflows\.venv\Scripts\python.exe`
- Agent-Reach: `C:\Users\Administrator\Documents\Project\Agent-Reach`

## 部署與認證
- Mistral API key：存於 `mistral-workflows/.env`（已 [REDACTED]）
- Mistral Workflow cloud：`wf-scheduler.mistral.ai`，deployment `esg-swarm`
- CI/CT：gh CLI 未安裝，PR 需手動建立

## 架構文件
- soul.md canon：`docs/soul.md`
- 12 大萬能分層：`packages/omni-arch/src/arch.ts`
- OmniAgent: `agents/skills/smart-ai-router/OMNiAgent.ts`
- 共享記憶層: `agents/skills/smart-ai-router/shared-memory.ts`
- OmniNote: `apps/omni-note/`
- Obsidian CLI: `agents/skills/obsidian-cli/SKILL.md`
- CI 檢查: `.github/workflows/ci-check.yml`
- 驗證腳本: `tools/capability-explorer/verification.py`
- 21 packages / 34 apps / 47 skills / 30 agents / 15 arch / 2 workflows

## 同步邊界（sync-backend）
- `docs/vault-canon/` 永遠只走 obsidian-git（git）
- `ob`（Obsidian Sync）只用於另一個獨立非共享 vault，禁止寫入 vault-canon
- 兩套同步底層不可對同一個 vault 並行啟用

## 常見陷阱
- git credential push 需要 PTY mode（background=true, pty=true）
- `hermes profile create -d` 錯誤，應用 `--description`
- `npm i -g pm2 pnpm` 失敗：node 為 ia32，pnpm 無預編譯二進位
- `gh` CLI 未安裝，PR 一鍵
