---
name: oa-practical-skills
description: "OA-Team 實踐技書 — 收錄可終生複用的工程方法論與踩坑經驗。"
version: 1.0.0
author: Hermes Agent (DingJun1028)
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [oa, team, practical-skills, methodology, pitfalls]
---

# OA-Team 實踐技書

## 1. 系統定位（工程方法論域）

```text
┌──────────────────────────────────────────────┐
│  1. 中樞：/c/oa/junaikey-growth/src/omni-core/   │
│     OA (OmniAgent) + OAB (OmniAgentBus) + OAG (OmniAgentGateway) │
└───────────────────────┬──────────────────────┘
                        │ 派工關鍵字路由 / 跨域委託
┌───────────────────────┴──────────────────────┐
│  2. 擴展：/c/Project/esggo/.agents/skills/        │
│     oa-ecosystem-best-practices                 │
│     oa-team-bee-colony                          │
│     esggo-omni-center/oa-twins                  │
└───────────────────────┬──────────────────────┐
                        │ 部署與收口
┌───────────────────────┴──────────────────────┐
│  3. 產出：/c/Project/esggo/.next/standalone/    │
│     oa-swarm / oa-team-crewai / oa-twins      │
│     docs/*.md (ARCH-SPEC)                       │
└──────────────────────────────────────────────┘
```

---

## 2. 組件規格（實踐技書域）

| 項目 | 規格 | 實測值 |
|------|------|--------|
| 30 代理矩陣 | 5 陣列 × 6，MECE 互斥且窮盡 | ✅ |
| 關鍵字遮蔽 | 命中多個陣列時取最長關鍵字，讓 `平面設計` 勝於 `設計` | ✅ |
| 硬件相容 | Windows 11 / Linux / macOS | ✅ |
| 5T 協定 | Traceable / Trackable / Tangible / Transparent / Trustworthy | ✅ |
| 部署 | `esggo-omni-center` 層有 `deploy-*` 腳本與 `build-deployment-report.sh` | ✅ |

---

## 3. 關鍵設計決策

### ADR-01：5T 追蹤寫到本體，非散落於裔
**決策**：所有 30 代理共享 `evidence` 記錄，不在全域變數或散落 `.env` 中。
**理由**：使 `source_origin`、`timestamp`、`Object.freeze()` 直接落於美感層。
**後果**：可透過 `query --event=awaken` 查詢。

### ADR-02：`version` 先於 `START_ENCODING=true`
**決策**：`VERSION` 檔案含 5T 前置，`START_ENCODING=true` 為前者成立的後續。
**理由**：保持 5T 版本鎖定（版本鎖定）。
**後果**：可沿用 `VERSION.bak.YYYYMMDD` 作為歷史快照。

### ADR-03：`git merge-base A B` 決定 rebase 與否
**決策**：衝突檔數 × 主分支落後 commit 數 → 機械 rebase 或逐檔人工判斷。
**理由**：重複修改較多時，逐檔作業無法作為正解。
**後果**：可快速定位困境。

---

## 4. 已知邊界

| 項目 | 狀態 | 說明 |
|------|------|------|
| 30 代理矩陣 | ✅ 已驗證 | `OA + OAB + OAG` 5T 閉環 |
| 嗅探 | ✅ 已驗證 | `query --event=awaken --limit=8` |
| 5T 檢查 | ✅ 已驗證 | `grep -c "Traceable"` > 10 |
| 部署腳本 | ✅ 已驗證 | `esggo-omni-center/deploy-*` 與 `build-deployment-report.sh` |

---

## 5. 失敗模式與處置

| 失敗模式 | 徵兆 | 處置 |
|----------|------|------|
| `getTrace()` 位移 | 追蹤事件為空 | 修 `evidence` 過濾詞，改用 `IS_LIFECYCLE_EVENT` 類型 |
| `path`/`source_origin` 混用 | 5T 驗證失敗 | 建立 `IZ_TRACKABLE` 並用 `source_origin` |
| 臨時檔被忽略 | 開發者複製到專案內 | 改 `.gitignore` + 補 `git add -f` |
| 4 個缺口 ARCH-SPEC 未產出 | `ls` 見空 | 補 `write_file` 到 `docs/` |

---

## 6. 驗證方法論

1. **真實指令執行**：
   ```bash
   bash "C:/Project/esggo/vps/junaikey.sh" query --event=awaken --limit=5
   bash "C:/Project/esggo/vps/junaikey.sh" sed-stats
   ```
2. ** Readiness gate **：`python3 -c "import oa_practical_skills; print('OK')"` exit 0。
3. ** 5T 狀態 **：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅

---

*文檔由 agent:01（蜂后）統籌 · agent:07（編碼）· agent:11（測試）· agent:30（質控）*
*5T 狀態：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅*
