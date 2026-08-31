# §20 OmniTag 契約自動化 — 詳細版（備份落點）

> 對齊主典 `esggo-omni-center/soul.md` 第二十章。
> 本章將 §5 Trustworthy「寫入即凍結」與 §18 Hash Lock 落地為可執行的雙軌代碼體系。

**落點路徑**：
- 主典：`esggo-omni-center/soul.md` §20（第二十章）
- 代碼：`src/lib/five-t-protocol.ts`（FiveTOmniTagGate）+ `cli/oa-cli/src/omnitag.ts`（OmniTagRegistry）
- 檔案後端：`src/lib/omnitag-registry-file.ts`（FileArtifactStore）

**5 大核心**：
1. 代碼即契約 — 過閘即合規，不釋出不合規產物
2. 雙軌同構 — src/lib 跨環境 + cli/oa-cli 自包含，算法一致
3. 寫入即凍結 — ArtifactStore 抽象 + Hash Lock 不可篡改
4. 凍結不可改 — H4 frozen+restricted 拒絕覆寫
5. 篡改即現形 — verifyPersisted 重算 Hash Lock 比對

---

## §20.1 六大維度型別定義

```typescript
// src/lib/omnitag-contract.ts (同構於 cli/oa-cli/src/omnitag.ts)
export type OmnitagSecurity = 'public' | 'internal' | 'confidential' | 'restricted';
export type OmnitagLifecycle = 'draft' | 'active' | 'frozen' | 'archived';
export type OmnitagPriority = 'p0' | 'p1' | 'p2' | 'p3';
export type OmnitagPlatform = 'esggo' | 'omni' | 'vps' | 'firebase';

export interface OmniTagSet {
  agent?: string;      // agent:01~agent:30
  squad?: string;      // 智庫聖所/符文契約/光之羽翼/煉金熵減/5T驗算
  security?: OmnitagSecurity;
  lifecycle?: OmnitagLifecycle;
  priority?: OmnitagPriority;
  platform?: OmnitagPlatform;
  bestPractice?: 'awakened' | '结界';
}
```

## §20.2 契約五規則實作

| 規則 | 函數 | 行為 |
|---|---|---|
| 1 必備三枚 | `validateRequiredTriad` | 缺 `agent`+`lifecycle`+`p*` 任一即違約 |
| 2 凍結不可改 | `enforceFrozenLock` | `frozen`+`restricted` 實體禁止 mutation |
| 3 結界自動繼承 | `isBarrierInherited` | `best-practice:结界` 觸發全體繼承 |
| 4 熵減連動 | `validateEntropyReduction` | p0 完成後熵值必降（< 0.1） |
| 5 稽核抽驗 | `auditContractRate` | 批次契約率目標 100% |

## §20.3 持久化層（寫入即凍結）

```typescript
// src/lib/five-t-protocol.ts
export interface ArtifactStore {
  write(record: PersistedArtifact): void;
  read(entityId: string): PersistedArtifact | null;
  list(): PersistedArtifact[];
}

export class MemoryArtifactStore implements ArtifactStore {
  private _map = new Map<string, PersistedArtifact>();
  write(r: PersistedArtifact) { this._map.set(r.entityId, r); }
  read(id: string) { return this._map.get(id) ?? null; }
  list() { return [...this._map.values()]; }
}

// Node 後端：src/lib/omnitag-registry-file.ts
// FileArtifactStore 用 node:fs append-only JSONL，靜態 import 僅 Node 端匯入
// FiveTOmniTagGate.setStore(new FileArtifactStore()) 注入

static persistArtifact(params): PersistedArtifact {
  this.emitArtifact(params); // 過閘
  const existing = this._store.read(params.entityId);
  if (existing?.tag.lifecycle === 'frozen' && existing?.tag.security === 'restricted') {
    throw new Error(`H4 frozen: entity ${params.entityId} is sealed — immutable`);
  }
  const sealedAt = Date.now();
  const hashLock = FiveTHashLock.generate(
    params.tag.agent ?? 'unknown',
    params.content ?? JSON.stringify(params.tag),
    sealedAt,
  );
  const record = { entityId, tag, content, hashLock, sealedAt, sourceOrigin };
  this._store.write(record);
  return record;
}
```

## §20.4 5T 驗證段（誠實診斷）

- ✅ **已具備**：§20.2/§20.4/§20.5/§20.6 雙軌代碼落地
  - `src/lib` 58 passed（含 5 §20.6 用例）+ `TSC_EXIT=0`
  - `cli/oa-cli` 13 passed（含 5 §20.6 用例）+ `TSC_EXIT=0`
  - 跨語言 Hash Lock 同構（`sha256(source|content|ts)`）
- ⚠️ **缺口**：
  - Python 端 `verification.py` 未對接 `ArtifactStore`（跨語言持久化斷鏈）
  - `FileArtifactStore` 未接 `FiveTTrackable` 全鏈路（僅 Memory 預設測試）
  - `.oa/omnitag-registry.jsonl` 無定期完整性掃描 cron
- 🔧 **改進清單**：
  - P0：Python `verification.py` 對接 `FileArtifactStore`（跨語言同構閉環）
  - P1：`FileArtifactStore` 寫入同步 `FiveTTrackable.recordEvent`
  - P2：GitHub Action 定期 `verifyPersisted` 掃描（篡改即告警）

## §20.5 喚醒令

```
# 喚醒 OmniTag 契約閘（產物誕生即過閘 + 寫入即凍結）
npx tsx cli/oa-cli/src/index.ts tag \
  --agent agent:25 \
  --lifecycle active \
  --p p2 \
  --squad 5T驗算 \
  --content '{"op":"seal"}' \
  --json
```

> 蜂群共鑒：代碼即契約，過閘即合規；寫入即凍結，篡改即現形。

— ESG-GO v0.7 · OmniTag Covenant v1.0 · AGPL-3.0 —
