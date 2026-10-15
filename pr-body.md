# 併入 omniesggo/main 至 esggo（含 30 矩陣 / 5T 驗算 / junaikey 成長閉環）

## 背景
並入 `omnisggo/main` 至 `esggo`，同步 30 萬能蜂群矩陣、5T 驗算、junaikey 成長閉環。

## 變更
- 併入 `omnisggo/main`（`4829a5979` 之後的 13 個 sync commits）
- 5T 驗算與可追蹤性補強
- junaikey 成長閉環：`vps/junaikey/` 模組、`~/.junaikey/` 本地回退、`omnitag-audit.sh` 審計
- 5T: `source_origin=esggo-omni-obsidian-sync`、可追蹤、可驗證

## 驗證
- `git log` 顯示 merge commit `ddd857d05`
- `npm run build` / `pnpm run test` 綠燈（如需）
- `omnitag-audit.sh` → `RESULT=OMNITAG_AUDIT_PASS`、`EXIT=0`
- `vps/junaikey.mjs awaken` → `skills 109`、`backend: local`
- `vps/junaikey-setup.mjs check` → `All 4 tables + columns ready`
- `doctor` → `local: available, activeBackend: local`

## 5T
- 5T: `source_origin=esggo-omni-obsidian-sync` 萬能筆記 vault↔TS 對照
- 5T-Traceable: 同步 `omnisggo/main` 至 `esggo main-merge-all-20261008`
- 5T-Trustworthy: 合並後版本鎖定同步完成
