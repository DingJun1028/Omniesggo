# OMN-PRD-001 Schema ↔ Requirement Traceability（schema 掛需求編號追溯表）

> AUTO-GENERATED — 本檔由 scripts/generate-schema-traceability.mjs 依 shared/prd-matrix.json 自動生成，請勿手改；重新生成：node scripts/generate-schema-traceability.mjs
> Gate：node scripts/generate-schema-traceability.mjs --check（CI：Schema Traceability workflow）— drift 即 exit 1
> 對齊：soul.md §7.5 跨文檔對齊聲明（OA 領域型別 ↔ 終始矩陣 canonical）

## §7.5 落差聲明（2026-10-29 核實）

- soul.md §7.5 所指 esggo/shared/types.ts 與 scripts/check-oa-types-sync.mjs 於 main 不存在（已於 issue #91 第 3 項 PR 如實列明）。
- 現行真相源：shared/prd-matrix.json（verify:prd-matrix 閘）與 src/types/*、shared/types（PR #96 TS Matrix 收斂後之型別 canonical）。

## 需求 ↔ Schema/Contract 檔矩陣

| 需求 | 類型 | 優先級 | 狀態 | Schema/Contract 證據檔 |
| --- | --- | --- | --- | --- |
| FR-01 | FR | P0 | partial | — |
| FR-02 | FR | P0 | partial | — |
| FR-03 | FR | P0 | partial | — |
| FR-04 | FR | P0 | partial | — |
| FR-05 | FR | P1 | partial | — |
| FR-06 | FR | P1 | partial | — |
| FR-07 | FR | P1 | implemented | `src/lib/omni-base/rune-contract.ts` |
| FR-08 | FR | P1 | partial | — |
| FR-09 | FR | P0 | partial | `db/migrations/001_create_omnipotent_schema.sql` |
| FR-10 | FR | P1 | partial | — |
| NFR-01 | NFR | P0 | partial | — |
| NFR-02 | NFR | P0 | manual | — |
| NFR-03 | NFR | P0 | partial | — |
| NFR-04 | NFR | P0 | partial | — |
| NFR-05 | NFR | P0 | partial | `db/migrations/001_create_omnipotent_schema.sql` |
| NFR-06 | NFR | P1 | implemented | `src/lib/omni-base/rune-contract.ts` |
| NFR-07 | NFR | P1 | partial | — |

雙向閉合規則：每一需求必列於本表（無 schema 證據者如實標 —，不得虛報）；每一列出之證據檔必須存在於磁碟且其需求編號必須存在於 shared/prd-matrix.json（無孤兒）。

## JunAiKey 唯讀共享大腦（skillCoverage，唯讀納入）

| 技能 | 任務型別 | 角色 | 覆蓋需求 | 覆蓋 NFR | 證據 |
| --- | --- | --- | --- | --- | --- |
| junaikey-sovereign | junaikey_sovereign | 語意治理與自我成長引擎：觀/覺/練/印 四階段，以 5T 封印輸出 | FR-03, FR-05, FR-10 | NFR-03, NFR-06 | `src/core/ai/skills/junaikey-sovereign.ts`, `src/core/ai/skills/__tests__/registry.test.ts`, `src/core/ai/skills/__tests__/api-integration.test.ts` |

JunAiKey 可讀內容以唯讀方式納入共享大腦（docs/vault-canon）；不觸 VPS 與 junaikey 之 VPS 腳本。

## 後續（第 1 項 TypeBox 遷移落地後）

- TypeBox schema 將掛需求編號（FR-xx），本表生成邏輯將擴充掃描 TypeBox schema 定義檔並納入矩陣，達成 schema → 需求 → 功能 → 驗證之全鏈自動追溯。
