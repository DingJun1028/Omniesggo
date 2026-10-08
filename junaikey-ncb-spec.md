# JunAikey 萬能元鑰 — NCB Dashboard 設定指南

> Project: `54686_junaikey`
> Base: `https://api.nocodebackend.com`

請在 NCB Dashboard 對上述 project 建立以下 4 個 tables:

## junaikey_skills

**永恆習得的技能 (主線 A)**

| Column | Type | Required | 說明 |
|---|---|---|---|
| `name` | VARCHAR(255) | ✅ | 技能名稱 (唯一識別) |
| `body` | TEXT | ✅ | 技能本體 (markdown) |
| `traits` | JSON | — | 標籤陣列,如 ["永恆","被動"] |
| `updatedAt` | DATETIME | ✅ | 最後更新時間 (ISO 8601) |

## junaikey_memory

**共享記憶 (主線 B, append-only)**

| Column | Type | Required | 說明 |
|---|---|---|---|
| `ts` | DATETIME | ✅ | 事件時間 (ISO 8601) |
| `event` | VARCHAR(64) | ✅ | 事件名稱 (awaken/reflect/remember) |
| `summary` | TEXT | — | 事件摘要 |
| `grownSkills` | JSON | — | 本次 reflect grow 的 skills |
| `tags` | JSON | — | 標籤陣列,用於 query --tag= |

## junaikey_progress

**當前進度 (主線 C, single-doc 取代式)**

| Column | Type | Required | 說明 |
|---|---|---|---|
| `active` | TEXT | ✅ | 當前進行中的任務 |
| `notes` | TEXT | — | 補充註記 |
| `updatedAt` | DATETIME | ✅ | 最後更新時間 |

## junaikey_journal

**審計日誌 (best-effort, awakened/reflect 觸發記錄)**

| Column | Type | Required | 說明 |
|---|---|---|---|
| `ts` | DATETIME | ✅ | 事件時間 |
| `kind` | VARCHAR(32) | ✅ | awaken / reflect / grow |
| `summary` | TEXT | — | 事件摘要 |
| `backend` | VARCHAR(16) | — | ncb / local |

---

建好後執行: `node vps/junaikey-setup.mjs check` 確認所有 tables 存在。
