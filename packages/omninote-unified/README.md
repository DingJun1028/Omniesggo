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
| `src/ollama-embedder.ts` | 零算力邊緣嵌入：本機 Ollama（127.0.0.1:11434 / nomic-embed-text）端點，回環限定（零外流承諾）、3.5s AbortController 道閘、Graceful Fallback（raw 保留、不註冊向量） |
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

已驗證（17/17 通過）：

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
13. 零外流承諾：非回環端點建構即刻拒絕。
14. Ollama 端點不可達 → Graceful Fallback 回 null（不拋出、計入降級）。
15. 3.5s 道閘超時 → 計入 `timedOut` 並降級（AbortController 實測生效）。
16. 嵌入成功路徑註冊入向量儲存；畸形回應與 HTTP 500 降級。
17. `registerNodeBlocks`：成功區塊註冊、`sketch_vector` 略過、端點降級時 raw 保留且儲存不受污染。

實測基準（開發機環境，相對比較用途；正式數據以 CI runner 為準）：

- 封印效能（200 區塊已凍結大節點 × 2000 次後繼封印）：naive 全量深凍結 115.3 ms vs `sealWithStructuralSharing` 4.0 ms — 加速比約 28.9 倍。
- Float32Array 配置（768 維 × 20000 次租借）：未池化 52.3 ms vs 池化承租-歸還 22.9 ms，穩態零新增配置。

## Ollama 零算力端點（已接線）

`ZeroComputeEmbedder` 已完成端點接線：`embed(text)` 呼叫本機 `/api/embeddings`，僅接受回環端點（`127.0.0.1` / `localhost` / `[::1]`，建構即驗證，零外流承諾）；3.5 秒 `AbortController` 道閘；任何失敗（超時、連線拒絕、HTTP 錯誤、回應畸形）一律回 `null` — 呼叫端保留 raw_note 原樣、跳過向量註冊（Graceful Fallback，零幻覺）。`registerNodeBlocks(store, node)` 提供 `SemanticVectorStore` 之整合入口（`sketch_vector` 區塊不做語意嵌入）。

## 型別檢查與 CI

本庫以 `tsc --noEmit` 為權威型別檢查（CI 執行）；測試以 `node --experimental-transform-types --test test/` 直跑。併入 workspace 後，lockfile 同步（`pnpm install`）為必要前置步驟。
