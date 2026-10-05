## Goal
- 完全代主自行「每樣都是」①②③④ 全併 main；依平臺不變量「全域・全端・全量・RWD・雙向同步・TypeScript」完成深貫廣通 / 承上啟下。
- 所有 WIP 清理完畢、全量日誌持久化驗證、監控消費者、RWD UI 完善。

## Constraints & Preferences
- 【平臺不變量】全域・全端・全量・RWD・雙向同步・TypeScript。
- 不污染 main；合併/PR 嚴守 G1(保護舞步)/G4(草稿不進 PR)。
- 使用繁體中文回應。

## Progress
### Done
- **734 passed / 0 failed** (vitest 實跑，非舊 summary 聲稱之 369) | model-router.ts 通過 tsconfig.verify.json 靜態檢查（9 個 pre-existing 錯誤非本次引入）| branch HEAD = 7596f6a29
- ①②③④ + #3收尾 + 平臺不變量對齊 全數合併 main。
- PR #248~#273 全數合併（G1 舞步：DELETE → admin merge → PUT 重建；本代理程式碼編輯由平行自動化管線自動 branch + PR + 合併，無須手動）。
- AuditLogger configurable maxEntries（#271）：0=不限 / >0=環形緩衝截斷。
- DelegationEventStream RWD mobile layout（#269）：事件色彩、可展開 payload、Lucide icons。
- Health checker（#269）：journal + metrics + event flow + alerts 四項健康檢查。
- Journal persistence E2E test（#269）：5 筆全量日誌驗證。
- 告警外部通知 + SSE 即時可見（#270）：觀測器產生告警時呼叫外部通知器（webhook）+ 發布 delegation.alert.raised 事件至同一 bus（SSE 即時可見）；ingest 對該類型提早 return（no self-loop）；閉環 / 失敗容錯。
- Unified publishBusEvent（#272, chore #lib）：SHA-256 hashLock + enhancedOmniBus 單一發布路徑；omni-gateway.secureForward 委託之。
- 告警郵件通知 + 複合扇出（#273）：createEmailNotifier（經郵件閘道 webhook，免 SMTP 相依）+ createCompositeNotifier 扇出至多 sink；getDefaultAlertNotifier 依環境組出 webhook+郵件。
- Gemma 本地模型整合（feat/gemma-local-free-vps）：新增 local_gemma provider（Ollama VPS，100% 免費）+ callLocalOllama + 路由表本地為主；FREE_PROVIDER_POOL 自動派生 + isModelUp/markModelDown 降級 + 雲端池兜底；模型清單檔（models.txt / hermes-free-models.json）對齊 gemma3:4b / gemma3:12b / llama3.1:8b；修 tsconfig.verify.json 排除 __tests__（避免 vitest globals 型別缺口誤報）。free-provider.test.ts 14 passed。
- 本地 Gemma 3 整合（feat/gemma-local-free-vps）：model-router 新增 `local_gemma` provider + `callLocalOllama`（Ollama /api/chat）；路由表全數改走本地 `gemma3:4b` / `gemma3:12b` / `llama3.1:8b`（100% 免費、私有、零算力）；`hermes-free-models.json` / `models.txt` 預設改為 `gemma3:4b`。修復兩個致命 bug：①`callFreeProvider` 因本地模型 `apiKeyEnv` 為空被誤判「無 Key」而全部跳過 → 改為空 Key 視為「免 Key」不跳過；②`VPS_OLLAMA_URL` 未被傳入呼叫端點 → 改由 `cfg.apiUrl`（PROVIDER_ENDPOINTS）傳入 `callLocalOllama`。新增 2 項測試（本地模型可選用 + 端點尊重 VPS_OLLAMA_URL）。
- 萬能標籤配對合成層（#280 `49efcbd2`，feat/universal-tag）：`prisma/schema.prisma` 新增 `UniversalTag` + `TagPair`；`src/core/tags/universal-tag-service.ts`（syncEsgTags / createOmniTagPair / autoPair 走本地 Gemma 4 / getEntityTags，含 `stripGemma4Thinking` 清理思考頻道）；`app/api/tags/pair/route.ts` + `app/api/tags/universal/route.ts`；`tests/universal-tag-service.test.ts` 4 項全過。migration 另以 #281 `c3b9f89b`「加入 universal_tags migration 至 git 追蹤」補入 `prisma/migrations/20260712165810_universal_tags/migration.sql`。
- VPS 部署交付物（feat/universal-tag-deploy，已自動併 main）：`vps-deploy-280.sh`（reset --hard origin/main + migrate deploy + generate + pm2 restart gateway）、`vps-push-280.sh`（複製 dev.db 至 gateway + db push 保留舊資料）、`vps-verify-280.sh`（pm2 status + 三道 curl 驗證）、`vps-diag*.sh`、`protection_body.json`（G1 PUT body）。⚠️ 注意：`vps-deploy/push/verify-280.sh` 指向錯誤的 pm2 程序（`omniagent-gateway` / `apps/gateway`），實際服務 `/api/tags/*` 的是 **`esggo-core`**（Next.js, PORT 3000, cwd `/var/www/esggo`）；腳本須修正指向 esggo-core + root `.env` + `prisma/dev.db` 方能套用。
- ✅ **#280 Universal Tag 已於 VPS 實際部署並端到端驗證成功（2026-07-12，經 SSH `esggo-vps` 授權執行）**：根因為 VPS 工作樹落後 `origin/main`（`HEAD` 停在缺 `app/api/tags/*` 路由的舊 commit `8756fa67`），舊 source 的 `next build` 會使 `.next` 遺漏 routes 導致 404。修復流程 = `git fetch origin && git reset --hard origin/main`（→#282 `c1cd86cd`）→ `pnpm prisma generate` → `pnpm build` → `pm2 restart esggo-core`。驗證：`omni` 模式回 `pairId/anchorId`、`auto` 模式（本地 Gemma 4 `hf.co/unsloth/gemma-4-E2B-it-GGUF:Q4_0`）回 `paired:true` 配對 2 個標籤、`sync-esg` 回 `synced:0`（無誤）、list 回傳 UniversalTag 資料；`esggo-core` pm2 狀態 online。
- 生產 Ollama 端點已改為 Nginx Basic Auth 代理 `https://omniagent.esggo.co/ollama/api/chat`（需 `VPS_OLLAMA_USER`/`VPS_OLLAMA_PASS`）；Gemma 4 本地模型 `hf.co/unsloth/gemma-4-E2B-it-GGUF:Q4_0`（#279 將 vision 拆給 gemma3、text 給 Gemma4；#278 strip Gemma4 思考頻道；#277 修生產端點連線 + Basic Auth + 雲端兜底）。

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- AuditLogger：maxEntries 預設 0（全量留存），僅在明確設定時才截斷。
- 健康檢查器整合 metrics + journal + 事件流活性 + 告警存在性四項。
- publishBusEvent 統一發布原語：所有子系統（委派/閘道器）走同一條帶 hashLock 的路徑。
- 本地模型設計：`local_gemma` 的 `apiKeyEnv` 為空 → 視為「免 Key」，`callFreeProvider` 不跳過；端點統一由 `PROVIDER_ENDPOINTS.local_gemma.apiUrl` 提供（尊重 `VPS_OLLAMA_URL` 環境變數），`callLocalOllama` 經 `cfg.apiUrl` 接收，單一來源避免散落硬編碼 IP。

## Next Steps
- ✅ 郵件通知已完成（#273）。可延伸：monorepo 其他子系統（如 twelve-omni）套用統一發布模式（twelve-omni 自身 secureForward 僅 hashLock+凍結、不發布至共享總線，為已知分歧，待評估併入）。
- 可評估 E2E 整合測試（health + metrics + alerts + SSE 一體化驗證）。
- ⚠️ 系統層級 UTF-8 字碼頁（OEMCP/ACP=65001）可根除顯示層亂碼，但需重啟且影響全機，待使用者明示同意（未執行）。
- ✅ `vps-fix-280.sh`（feat/vps-fix-280，已自動併 main）：#280 上線後的 VPS 執行期補釘 — 實際經 `esggo-vps` 執行。關鍵發現：一般 `prisma generate` + restart 不足，因 Prisma client 被 bundle 進 `.next`（非 externalized），schema 變更須整輪 `next build`。且 VPS 須先 `git reset --hard origin/main` 才 build，否則從落後的舊 source build 會漏掉 routes。實際部署已成功（見上 Done 條目）。

## Critical Context
- ⚠️ G1 PUT 保護 body 必須用乾淨 body（無 url 包裹層）。
- main 保護已重建（required_approving_review_count:1 / dismiss_stale_reviews:true）。
- 倉內文字檔全為合法 UTF-8，亂碼純為 PowerShell 顯示層問題。
- 🔧 **VPS 部署標準流程（esggo-core）**：`git fetch origin && git reset --hard origin/main` → `pnpm prisma generate` → `pnpm build` → `pm2 restart esggo-core`。Prisma 被 bundile 進 `.next`，故 schema 變更後必須 `next build`（不只 generate+restart）。VPS 經 SSH `esggo-vps`（161.118.248.180:22, root, `~/.ssh/vps_key`）直連；vps/comms relay 僅 localhost:9999，沙箱不可達。
- ⚠️ **PowerShell `curl -d '{\"k\":\"v\"}'` 轉義陷阱**：`\"` 在 PowerShell 雙引號字串中會被保留為字面反斜線引號 → 送出 `{\"k\":\"v\"}` → 對端 `JSON.parse` 報錯或假 500。正解：本機寫乾淨 JSON 檔 → `scp` 至 VPS → `curl -d @/tmp/x.json`（omni/auto/sync-esg 三道驗證皆以此方式成功）。

## Relevant Files
- src/lib/bus.ts：統一發布原語 publishBusEvent。
- src/agents/complete-delegation/health.ts：系統健康檢查器。
- src/agents/complete-delegation/metrics.ts：指標觀測器 + 告警評估。
- src/agents/complete-delegation/autonomous-decision-engine.ts：AuditLogger（configurable maxEntries）。
- src/components/delegation/DelegationEventStream.tsx：RWD 事件流面板。
- src/app/api/delegation/health/route.ts：健康檢查 API。
- src/app/api/healthz/route.ts：整合委派健康檢查。
- tests/journal-persistence.test.ts：全量日誌 E2E 測試（5 筆）。
- tests/audit-logger.test.ts：AuditLogger 全量留存測試（3 筆）。
