# @esggo/omninote-unified

OmniNote: Unified — 全生命週期流式筆記核心庫。融合 Omni-Notes（毫秒級捕獲）、Obsidian（本地雙鏈純文字）、Capacities（強型別物件）三重哲學於單一 TypeBox 契約之下。

## 架構總覽

| 模組 | 職責 |
| --- | --- |
| \`src/core-types.ts\` | TypeBox 契約單一真理來源：UUIDv4 / SHA-256 / SemVer / EvidenceEntry / MatrixPhase / CRDTBlock / UnifiedNode / SyncDeltaPacket（編譯期 \`Static<T>\` 推導 + 執行期 \`Value.Check\` 斷言） |
| \`src/matrix-engine.ts\` | 終始矩陣引擎：ALPHA → SIGMA → OMEGA 三態躍遷、逆向投影、Block-Level LWW CRDT 合併、SyncDelta 封包、熵減自癒、\`computeNodeLockHash\` 唯一真理鎖公式 |
| \`src/perf.ts\` | 效能工程：\`sealWithStructuralSharing\`（結構共享深凍結，WeakSet 登記制快捷共享）與 \`Float32ArrayPool\`（向量記憶體池化） |
| \`src/codec.ts\` | Markdown 同態編解碼器：UnifiedNode ↔ YAML Frontmatter + 正文 + \`.svg\` 附件，區塊權威清單（\`blocks_meta\`）保證零資訊損失，含竄改偵測（\`tampered\`） |
| \`src/vector-store.ts\` | 語意向量儲存：L2 歸一化 Float32Array × 純 CPU 點積 Top-K 檢索（Ollama 零算力端點解耦） |
| \`src/ollama-embedder.ts\` | 零算力邊緣嵌入：本機 Ollama（127.0.0.1:11434 / nomic-embed-text）端點，回環限定（零外流承諾）、3.5s AbortController 道閘、Graceful Fallback（raw 保留、不註冊向量） |
| \`src/api-server.ts\` | 本機回環 REST API（零依賴 node:http）：捕獲、讀取、追加區塊、語意搜尋、刪除、匯入匯出、草稿自動存 — CLI 工具、機器人與小工具之標準接入口 |
| \`bin/omninote-server.ts\` | API 伺服器 CLI 入口（OMNINOTE_HOME / PORT / TOKEN / EMBED 環境變數） |
| \`src/import-export.ts\` | OmniNote Archive 匯入匯出：匯出逐節點 lock_hash 驗算（零竄改外流）、解析雙重驗證、匯入衝突策略（skip / overwrite）與逐項計數報告 |
| \`src/draft-store.ts\` | 隨時進度草稿自動儲存：冪等 upsert（revision 遞增）、防抖自動存（DraftAutoSaver）、晉升（promote）轉正式 ALPHA 節點 |
| \`src/storage-adapter.ts\` | \`IStorageDriver\` 抽象：Node \`node:fs\` 真實磁碟雙寫（.md + attachments/*.svg）與瀏覽器 IndexedDB 雙軌 |
| \`src/audit-exporter.ts\` | 5T 稽核憑證匯出：\`PASSED\` / \`COMPROMISED\` 終局驗算清單 |

## 三態模型與 5T 治理

- \`ALPHA_ORIGIN_CAPTURE\`（始態）：毫秒速記、手繪向量、語音轉譯。
- \`SIGMA_GRAPH_SYNTHESIS\`（轉態）：雙鏈熔煉、Wikilink 拓撲、純文字同態落盤。
- \`OMEGA_OBJECT_CRYSTAL\`（終態）：強型別屬性注入、實體結晶化。
- 逆向投影 \`projectReverseToCapture\` 保留降維回草稿能力，杜絕剛性死鎖。
- 每次躍遷強制推入 \`EvidenceEntry\`（Traceable / Trackable / Transparent / Trustworthy / Timely）。
- \`lock_hash\` 由 \`computeNodeLockHash\`（SHA-256 × canonical JSON）單一公式計算，引擎封印與稽核驗算共用，杜絕公式漂移。

## 測試與基準

\`\`\`bash
pnpm typecheck   # tsc --noEmit（CI 為權威）
pnpm test        # node --experimental-transform-types --test test/
pnpm bench       # node --experimental-transform-types bench/bench.ts
\`\`\`

已驗證（核心 17/17 通過；API 層 6 項、匯入匯出層 8 項與草稿層 7 項測試待 CI 首跑驗證）：

1. ALPHA → SIGMA → OMEGA → REVERSE 全鏈躍遷與深層凍結不可變性。
2. Block-Level LWW：Lamport 優先、同值比 \`peer_id\` 字典序、\`deleted\` 過濾。
3. \`SyncDeltaPacket\` 零幻覺契約道閘（非法相位即刻拒絕）。
4. 熵減自癒：懸空死鏈標註與 \`entropy_score\` 計算。
5. Codec Round-Trip：序列化 → 反序列化雜湊一致、零資訊損失、無竄改誤報。
6. 竄改偵測：磁碟 frontmatter \`lock_hash\` 遭改動 → \`tampered = true\`。
7. \`NodeFileSystemDriver\` 真實磁碟雙寫與讀回。
8. 語意向量 Top-K 檢索與門檻過濾。
9. \`Float32ArrayPool\` 租借歸還復用統計。
10. 5T 稽核：完整鏈 \`PASSED\`、屬性竄改 \`COMPROMISED\`。
11. 結構共享封印：未變動子樹引用相等（零拷貝）。
12. 外部淺凍結物件仍深層封印（WeakSet 登記制不破壞 API 契約）。
13. 零外流承諾：非回環端點建構即刻拒絕。
14. Ollama 端點不可達 → Graceful Fallback 回 null（不拋出、計入降級）。
15. 3.5s 道閘超時 → 計入 \`timedOut\` 並降級（AbortController 實測生效）。
16. 嵌入成功路徑註冊入向量儲存；畸形回應與 HTTP 500 降級。
17. \`registerNodeBlocks\`：成功區塊註冊、\`sketch_vector\` 略過、端點降級時 raw 保留且儲存不受污染。

API 契約測試（\`test/api.test.ts\`，6 項）：健康檢查與非回環位址建構即拒絕、捕獲正規管道落地讀回、追加區塊證據鏈延伸與 lock_hash 重算、Token 道閘 401、刪除後 404、嵌入不可用時搜尋降級零結果。匯入匯出測試（\`test/import-export.test.ts\`，8 項）：匯出解析 Round-Trip、匯出竄改拒絕、空庫匯入、skip / overwrite 衝突策略、匯入竄改計數、解析道閘、API 匯出匯入復原。草稿測試（\`test/draft-store.test.ts\`，7 項）：冪等 upsert 與 revision 遞增、draft_id 道閘、刪除、晉升正規管道與草稿移除、晉升不存在草稿、防抖自動存與 flush、API 草稿端點全流程。此 21 項因開發環境不具原生執行能力，以 CI 首跑為權威驗證。

實測基準（開發機環境，相對比較用途；正式數據以 CI runner 為準）：

- 封印效能（200 區塊已凍結大節點 × 2000 次後繼封印）：naive 全量深凍結 115.3 ms vs \`sealWithStructuralSharing\` 4.0 ms — 加速比約 28.9 倍。
- Float32Array 配置（768 維 × 20000 次租借）：未池化 52.3 ms vs 池化承租-歸還 22.9 ms，穩態零新增配置。

## Ollama 零算力端點（已接線）

\`ZeroComputeEmbedder\` 已完成端點接線：\`embed(text)\` 呼叫本機 \`/api/embeddings\`，僅接受回環端點（\`127.0.0.1\` / \`localhost\` / \`[::1]\`，建構即驗證，零外流承諾）；3.5 秒 \`AbortController\` 道閘；任何失敗（超時、連線拒絕、HTTP 錯誤、回應畸形）一律回 \`null\` — 呼叫端保留 raw_note 原樣、跳過向量註冊（Graceful Fallback，零幻覺）。\`registerNodeBlocks(store, node)\` 提供 \`SemanticVectorStore\` 之整合入口（\`sketch_vector\` 區塊不做語意嵌入）。

## 本機 REST API（CLI / 機器人 / 小工具接入口）

\`OmniNoteLocalApiServer\`：零依賴（node:http）之本機回環 API。僅綁定 \`127.0.0.1\` / \`localhost\` / \`::1\`，違者建構即拒絕（零外流承諾）。所有寫入一律走 UnifiedMatrixEngine → \`computeNodeLockHash\` → 同態 Codec → OmniStorageAdapter 正規管道，與桌面端共用同一套契約與稽核鏈；API 追加區塊亦推入 \`EvidenceEntry（ON_API_APPEND）\`。

### 啟動

\`\`\`bash
OMNINOTE_HOME=/path/to/notes OMNINOTE_PORT=52710 OMNINOTE_TOKEN=my-secret \\
  pnpm serve
# 或
node --experimental-transform-types bin/omninote-server.ts /path/to/notes
\`\`\`

設定 \`OMNINOTE_EMBED=1\` 時啟用 \`ZeroComputeEmbedder\`：捕獲與追加區塊自動註冊語意向量（本機 Ollama，3.5s 道閘，失敗一律 Graceful Fallback）。

### 端點

| 方法 | 路徑 | 說明 |
| --- | --- | --- |
| GET | /health | 健康檢查（節點數、向量數、草稿數）；無須 Token |
| POST | /api/notes | 捕獲筆記：\`{ text, origin_tag?, tags? }\` → 201 + 完整節點 |
| GET | /api/notes | 列出所有節點 UUID |
| GET | /api/notes/:uuid | 讀取單一節點（404 若不存在） |
| POST | /api/notes/:uuid/blocks | 追加區塊：\`{ type, content }\`（type 為六種 CRDT 區塊型別之一；422 若非法） |
| PATCH | /api/notes/:uuid/blocks/:blockId | 區塊編輯：\`{ content }\`（LWW 就地更新、Lamport 遞增、outlinks 熔合重建；404 若節點/區塊不存在或區塊已墓碑化） |
| DELETE | /api/notes/:uuid/blocks/:blockId | 區塊軟刪除（CRDT tombstone：\`deleted=true\` 保留原文與 block_id；outlinks 熔合重建排除墓碑貢獻；重刪 404 \`BLOCK_TOMBSTONED\`） |
| POST | /api/notes/:uuid/sigma | ALPHA → SIGMA 躍遷：非墓碑區塊內容熔合為單一長文、outlinks 熔合重建（ON_SIGMA_SYNTHESIS 證據入鏈；422 若無活躍區塊） |
| POST | /api/notes/:uuid/crystallize | SIGMA → OMEGA 躍遷：`{ entity_type, properties? }` 強型別結晶（ON_OMEGA_CRYSTALLIZE 證據入鏈；422 若缺 entity_type） |
| POST | /api/notes/:uuid/reverse | OMEGA → ALPHA 逆向投影（ON_REVERSE_PROJECT 證據入鏈） |
| POST | /api/notes/:uuid/rebase | LATERAL_REBASE 同態分支：生成同相位 SyncDeltaPacket（`{ to_phase?, clock_vector?, patch: [{op, path, value?}] }`；唯讀，不落地、不寫證據鏈、不變更 lock_hash；422 若跨相位、缺 patch 或 op 非法） |
| POST | /api/notes/:uuid/apply | SyncDeltaPacket 對端套用（body 為完整封包）：JSON Patch 子集生效（add/remove/replace/move；move 之 value 為來源路徑字串）、版本 patch 遞增、outlinks 熔合重建、ON_SYNC_DELTA_APPLY 證據入鏈；409 若 state_signature 分歧（重放即拒）；422 若封包形狀、uuid 不符、跨相位或路徑不可達 |
| POST | /api/notes/:uuid/purify | 熵減自癒：對現存宇宙重標註死鏈（resolved=false）並計算 entropy_score（ON_ENTROPY_PURIFICATION 證據入鏈） |
| DELETE | /api/notes/:uuid | 刪除節點 |
| POST | /api/search | 語意搜尋：\`{ query, top_k?, threshold? }\`；嵌入不可用時 \`degraded: true\` 且零結果（503 若未啟用嵌入器） |
| POST | /api/drafts | 隨時進度草稿存檔：\`{ draft_id, content, origin_tag?, tags? }\` 冪等 upsert（重複呼叫覆寫且 revision 遞增） |
| GET | /api/drafts | 列出全部草稿 |
| GET | /api/drafts/:id | 讀取單一草稿（404 若不存在） |
| DELETE | /api/drafts/:id | 刪除草稿 |
| POST | /api/drafts/:id/promote | 晉升草稿為正式 ALPHA 節點（201 + 節點；草稿隨即移除） |
| GET | /api/export | 全量匯出歸檔（attachment：omninote-export.json）；儲存庫含竄改節點時回 409 |
| POST | /api/import?conflict=overwrite | 匯入歸檔（主體為歸檔 JSON；預設 conflict=skip）；回傳計數報告 |

### CLI 範例（一行存入筆記）

\`\`\`bash
curl -s -X POST http://127.0.0.1:52710/api/notes \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer my-secret" \\
  -d '{"text":"靈感：週末試做 Ollama 嵌入","origin_tag":"cli.capture","tags":["#inbox"]}' \\
  | jq -r '.node.uuid'
\`\`\`

機器人與小工具只需對 \`http://127.0.0.1:52710\` 發 HTTP 請求即可將筆記寫入 OmniNote 同態 Markdown 儲存庫（Obsidian / Git 原生相容）。

## 隨時進度草稿自動儲存

\`src/draft-store.ts\`：草稿為正式捕獲前之暫存進度（不進 UnifiedNode 契約），持久化於 \`rootDir/omni-drafts/<draft_id>.json\`。

- \`DraftStore.save(draftId, { content, origin_tag?, tags? })\`：冪等 upsert，同一 draft_id 重複呼叫即覆寫、revision 遞增、created_at 保留 — CLI 與機器人隨時重複呼叫即為進度存檔。
- \`DraftAutoSaver\`：防抖自動存（預設 800ms）— 高頻 touch 僅於閒置後落盤一次，\`flush()\` 立即全量落盤（關閉前、晉升前呼叫）；供 UI 打字場景接線。
- \`DraftStore.promote(draftId, storage, embedder?, vectorStore?)\`：晉升走引擎正規管道（spawnAlphaOrigin → computeNodeLockHash → 結構共享封印 → 落地 → 向量註冊），成功後刪除草稿。
- draft_id 道閘：僅接受 1-64 字元英數、底線與連字號（杜絕路徑竄改）。

\`\`\`bash
# 隨時存進度（重複呼叫僅覆寫）
curl -s -X POST http://127.0.0.1:52710/api/drafts \\
  -H "Content-Type: application/json" -H "Authorization: Bearer my-secret" \\
  -d '{"draft_id":"bot-progress","content":"寫到一半的長文…"}'
# 晉升為正式筆記
curl -s -X POST http://127.0.0.1:52710/api/drafts/bot-progress/promote \\
  -H "Authorization: Bearer my-secret"
\`\`\`

## 匯入匯出（OmniNote Archive）

\`src/import-export.ts\` 提供歸檔級雙向無損遷移：

- \`exportNotesArchive(nodes)\`：全量封存為單一 JSON 歸檔（format: omninote-archive / format_version: 1.0.0）；匯出前逐節點以 \`computeNodeLockHash\` 重算驗證，任何竄改即刻拒絕（零竄改外流承諾）。
- \`parseArchive(json)\`：格式標頭與逐節點 TypeBox 契約驗證，畸形即刻拋出。
- \`importNotesArchive(storage, archive, { conflict })\`：匯入前逐節點完整性稽核；lock_hash 相同則跳過；相異時依衝突策略 skip（保留既有）或 overwrite（覆寫為歸檔版本）；竄改節點計入 tampered 且不落地，全程零例外中斷，回傳逐項計數報告。

備份與復原範例：

\`\`\`bash
curl -s http://127.0.0.1:52710/api/export -H "Authorization: Bearer my-secret" > backup.json
curl -s -X POST "http://127.0.0.1:52710/api/import?conflict=overwrite" \\
  -H "Authorization: Bearer my-secret" -H "Content-Type: application/json" --data-binary @backup.json
\`\`\`

## 型別檢查與 CI

本庫以 \`tsc --noEmit\` 為權威型別檢查（CI 執行）；測試以 \`node --experimental-transform-types --test test/\` 直跑。併入 workspace 後，lockfile 同步（\`pnpm install\`）為必要前置步驟。

## 拓撲權威與別名解析

- 拓撲權威：topology.outlinks 由引擎於每次寫入時熔合重建；codec 將 outlinks manifest 隨 frontmatter 落地，反序列化以 manifest 為權威（正文 [[雙鏈]] 為顯示投影；外部匯入 .md 無 manifest 時降級為正文推導）。
- 別名解析：[[文字標的]] 以各節點第一個非墓碑文字區塊之完整內容為標題別名（同題先建者優先），解析為真實 uuid 後入拓撲；無法解析者不入拓撲。
