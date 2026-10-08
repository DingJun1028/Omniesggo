# JunAikey NCB 欄位加掛 Checklist

> Project: `54686_junaikey`  (https://nocodebackend.com/)
> 16 個欄位 = 4 table × 各 columns。加完跑 `node vps/junaikey-setup.mjs check` 全綠即可。

---

## ☐ Table 1/4: `junaikey_skills`

> 用途: 永恆技能 (主線 A)

| ☐ | 欄位 | 型別 | Required |
|---|---|---|---|
| ☐ | `name` | VARCHAR(255) | ✓ |
| ☐ | `body` | TEXT | ✓ |
| ☐ | `traits` | JSON | — |
| ☐ | `updatedAt` | DATETIME | ✓ |

---

## ☐ Table 2/4: `junaikey_memory`

> 用途: 共享記憶 (主線 B, append-only)

| ☐ | 欄位 | 型別 | Required |
|---|---|---|---|
| ☐ | `ts` | DATETIME | ✓ |
| ☐ | `event` | VARCHAR(64) | ✓ |
| ☐ | `summary` | TEXT | — |
| ☐ | `grownSkills` | JSON | — |
| ☐ | `tags` | JSON | — |

---

## ☐ Table 3/4: `junaikey_progress`

> 用途: 當前進度 (主線 C, single-doc)

| ☐ | 欄位 | 型別 | Required |
|---|---|---|---|
| ☐ | `active` | TEXT | ✓ |
| ☐ | `notes` | TEXT | — |
| ☐ | `updatedAt` | DATETIME | ✓ |

---

## ☐ Table 4/4: `junaikey_journal`

> 用途: 審計日誌 (best-effort)

| ☐ | 欄位 | 型別 | Required |
|---|---|---|---|
| ☐ | `ts` | DATETIME | ✓ |
| ☐ | `kind` | VARCHAR(32) | ✓ |
| ☐ | `summary` | TEXT | — |
| ☐ | `backend` | VARCHAR(16) | — |

---

## 加完後驗證

```bash
node vps/junaikey-setup.mjs check
```

期望輸出:
```
🎉 All 4 tables + columns ready. junaikey.mjs NCB backend fully operational.
```

然後跑一個端到端冒煙測試:
```bash
node --env-file=.env.local vps/junaikey.mjs awaken     # 應看到 backend: ncb, 0 skills/mems
node --env-file=.env.local vps/junaikey.mjs grow "smoke-test" "NCB 端到端冒煙測試" --traits=永恆
node --env-file=.env.local vps/junaikey.mjs query --limit=1   # 應看到剛才的 awaken + grow event
```

任何一個 `⚠️` 訊息就是某個 column 缺漏,照上面表格對齊補上。

---

## 給 Dashboard 的可能 1-click Prompt（若想用 AI Setup 重生）

若你決定刪掉 4 個空殼 table 改用 AI Setup,可貼這段到 NCB AI prompt:

```
Create 4 tables in this project for a multi-agent growth/observability system:

1. junaikey_skills: name(VARCHAR 255 required), body(TEXT required), traits(JSON), updatedAt(DATETIME required)

2. junaikey_memory: ts(DATETIME required), event(VARCHAR 64 required), summary(TEXT), grownSkills(JSON), tags(JSON)

3. junaikey_progress: active(TEXT required), notes(TEXT), updatedAt(DATETIME required)

4. junaikey_journal: ts(DATETIME required), kind(VARCHAR 32 required), summary(TEXT), backend(VARCHAR 16)

Use MySQL-compatible types. Do not create any id column — system auto-provisions PK.
```
