# @esggo/omninote-unified

OmniNote: Unified — 全生命週期流式筆記核心庫。融合 Omni-Notes（毫秒級捕獲）、Obsidian（本地雙鏈純文字）、Capacities（強型別物件）三重哲學於單一 TypeBox 契約之下。

## 架構總覽

| 模組 | 職責 |
| --- | --- |
| `src/core-types.ts` | TypeBox 契約單一真理來源：UUIDv4 / SHA-256 / SemVer / EvidenceEntry / MatrixPhase / CRDTBlock / UnifiedNode / SyncDeltaPacket（編譯期 `Static<T>` 推導 + 執行期 `Value.Check` 斷言） |
| `src/matrix-engine.ts` | 終始矩陣引擎：ALPHA → SIGMA → OMEGA 三態躍遷、逆向投影、Block-Level LWW CRDT 合併、SyncDelta 封包、熵減自癒、`computeNodeLockHash` 唯一真理鎖公式 |
| `src/perf.ts` | 效能工程：`sealWithStructuralSharing`（結構共享深凍結，WeakSet 登記制快捷共享）與 `Float32ArrayPool`（向量記憶體池化） |
| `src/codec.ts` | Markdown 同態編解碼器：UnifiedNode ↔ YAML Frontmatter + 正文 + `.svg` 附件，區塊權威清單（`blocks_meta`）保證零資訊損失，含竄改偵測（`tampered`） |
| `src/vector-store.ts` | 語意向量儲存：L2 歸一化 Float32Array × 純 CPU 點積 Top-K 檢索（Ollama 零算力端點解耦） |
| `src/storage-adapter.ts` | `IStorageDriver` 抽象：Node `node:fs` 真實磁碟雙寫（.md + attachments/*.svg）與瀏覽器 IndexedDB 雙軌 |
| `src/audit-exporter.ts` | 5T 稽核憑證匯出：`PASSED` / `COMPROMISED` 終局驗算清單 |

## 三態模型與 5T 治理

- `ALPHA_ORIGIN_CAPTURE`（始態）：毫秒速記、手繪向量、語音轉譯。
- `SIGMA_GRAPH_SYNTHESIS`（轉態）：雙鏈熔煉、Wikilink 拓撲、純文字同態落盤。
- `OMEGA_OBJECT_CRYSTAL`（終態）：強型別屬性注入、實體結晶化。
- 逆向投影 `projectReverseToCapture` 保留降維回草稿能力，杜絕剛性死鎖。
- 每次躍遷強制推入 `EvidenceEntry`（Traceable / Trackable / Transparent / Trustworthy / Timely）。
- `lock_hash` 由 `computeNodeLockHash`（SHA-256 × canonical JSON）單一公式計算，引擎封印與稽核驗算共用，杜絕公式漂移。

## 測試與基準

```bash
pnpm typecheck   # tsc --noEmit（CI 為權威）
pnpm test        # node --experimental-transform-types --test test/
pnpm bench       # node --experimental-transform-types bench/bench.ts
```

已驗證（12/12 通過）：

1. ALPHA → SIGMA → OMEGA → REVERSE 全鏈躍遷與深層凍結不可變性。
2. Block-Level LWW：Lamport 優先、同值比 `peer_id` 字典序、`deleted` 過濾。
3. `SyncDeltaPacket` 零幻覺契約道閘（非法相位即刻拒絕）。
4. 熵減自癒：懸空死鏈標註與 `entropy_score` 計算。
5. Codec Round-Trip：序列化 → 反序列化雜湊一致、零資訊損失、無竄改誤報。
6. 竄改偵測：磁碟 frontmatter `lock_hash` 遭改動 → `tampered = true`。
7. `NodeFileSystemDriver` 真實磁碟雙寫與讀回。
8. 語意向量 Top-K 檢索與門檻過濾。
9. `Float32ArrayPool` 租借歸還復用統計。
10. 5T 稽核：完整鏈 `PASSED`、屬性竄改 `COMPROMISED`。
11. 結構共享封印：未變動子樹引用相等（零拷貝）。
12. 外部淺凍結物件仍深層封印（WeakSet 登記制不破壞 API 契約）。

實測基準（開發機環境，相對比較用途；正式數據以 CI runner 為準）：

- 封印效能（200 區塊已凍結大節點 × 2000 次後繼封印）：naive 全量深凍結 115.3 ms vs `sealWithStructuralSharing` 4.0 ms — 加速比約 28.9 倍。
- Float32Array 配置（768 維 × 20000 次租借）：未池化 52.3 ms vs 池化承租-歸還 22.9 ms，穩態零新增配置。

## 型別檢查與 CI

本庫以 `tsc --noEmit` 為權威型別檢查（CI 執行）；測試以 `node --experimental-transform-types --test test/` 直跑。併入 workspace 後，lockfile 同步（`pnpm install`）為必要前置步驟。
