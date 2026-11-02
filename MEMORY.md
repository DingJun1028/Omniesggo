# Memory Directory

This directory stores durable facts about the user, environment, and project.
Each file is a self-contained markdown note.

## How to Use

- `user.md`: Who the user is — persona, preferences, communication style
- `memory.md`: Environment facts — paths, tools, project conventions, config gotchas
- `skills/`: Procedural knowledge for recurring task types

## Rules

- One topic = one file
- Keep entries compact and high-signal
- Skip trivial/obvious info, session history, and completed work logs
- When full, replace or consolidate stale entries rather than skipping saves

## Index

- [user.md](user.md) — User persona & preferences
- [memory.md](memory.md) — Environment & project state
- [skills/](skills/) — Task-type procedures

## 環境事實（2026-11-03 更新）
- **專案位置**：`C:\Users\Administrator\Documents\Project\Omniesggo`
- **分支**：`main`（6581 追蹤檔案，工作樹乾淨）
- **pnpm**：需 64-bit node；`typescript@7.0.2` 32-bit 無原生二進位
- **node**：64-bit 在 `C:\Users\Administrator\AppData\Local\hermes\tools\node-26.12.1-win32-x64\node.exe`
- **GH CLI**：已安裝於 `/c/Program Files/GitHub CLI`，需加入 PATH
- **browser_vault**：查詢返回「可用機密：0 個」（`items: []`）
- **Tesseract OCR**：`TESSDATA_PREFIX` 需指向 `tessdata` 資料夾上層目錄；空格路徑需雙引號
- **工具名**：`gh.exe` 在 `/c/Program Files/GitHub CLI/`；Git Bash 中 `which gh` 找不到，需用 `cmd //c where gh.exe`
- **tesseract/PDFTotext**：可無法提取密鑰值，`ENV20230818.pdf` 61.7 KB 無法解析
- **OneTimeSecret**：兩個連結均未成功揭露，`OTS_API_TOKEN` 未取得
- **Dependabot**：9 個已修復警報，0 個 open
- **技術債**：`oa-sw-arm` 32-bit build 問題已解決（64-bit node + `@typescript/typescript-win32-x64`）
- **架構整合**：`docs/soul.md` 已整合 15 章架構星圖
- **TypeBox 終始矩陣**：`tools/ts-matrix/terminator/terminator-schema.md` 已建立
- **OmniBitwarden 技能 v2.0.0**：`.agents/skills/omni-bitwarden/SKILL.md`
- **Web Design 技能**：`.agents/skills/web-design/SKILL.md`
- **解說聖典**：`docs/vault-canon/Omniesggo 解說聖典.md`（20 個名詞 × 8 項）
