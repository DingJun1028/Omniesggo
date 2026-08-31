---
source_origin: vault/Agents/context/00-Index.md
co_authors: []
created: 2026-08-13
modified: 2026-08-13
sync: up
lifecycle: active
access: public-research
---

# SyncUp 測試（回流證明）

> 此筆記標 `sync: up`，證明 vault→canonical 雙向回流機制。

## 提議新增型別
```ts
export interface ISecondBrainNote {
  id: string;
  title: string;
  tags: string[];
  source_origin: string;
  sync: 'mirror' | 'up';
}
```

跑 `npx tsx scripts/sync-vault-types.ts --apply` → 此 interface 附加到 `shared/types.ts` 末端 → 重跑 `sync-types-to-vault.ts` → TypeMatrix.md 出現 [[ISecondBrainNote]]。
