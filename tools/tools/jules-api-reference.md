# OmniJules REST API 參考（存檔版 · 供 OmniJules 取用）

> 來源：使用者於終端機貼上的 OmniJules REST API Quickstart（alpha 版）。
> 本典立場：依 soul.md §17，不整合 OmniJules 本體（付費 SaaS）；
> 下列端點僅作「能力映射」參考，實作走免費自託管（見 omni-jules-bridge.*）。

## Authentication

- API key 經 `X-Goog-Api-Key` header 傳遞。
- 在 OmniJules web app → Settings 產生（最多 3 把）。
- 金鑰公開暴露會被自動停用。

## 核心資源

- **Source**：輸入源（如 GitHub repo）。須先安裝 OmniJules GitHub App。
- **Session**：連續工作單元（類似 chat session），由 prompt + source 發起。
- **Activity**：Session 內單次工作（生成計畫、訊息、進度更新）。

## Endpoints（v1alpha）

### 1. List sources
```
GET https://jules.googleapis.com/v1alpha/sources
Header: x-goog-api-key: $JULES_API_KEY
```
回應：
```json
{ "sources": [ { "name": "sources/github/bobalover/boba",
                 "id": "github/bobalover/boba",
                 "githubRepo": { "owner": "bobalover", "repo": "boba" } } ],
  "nextPageToken": "github/bobalover/boba-web" }
```

### 2. Create session
```
POST https://jules.googleapis.com/v1alpha/sessions
Header: Content-Type: application/json
        x-goog-api-key: $JULES_API_KEY
Body:
{ "prompt": "Create a boba app!",
  "sourceContext": { "source": "sources/github/bobalover/boba",
                     "githubRepoContext": { "startingBranch": "main" } },
  "automationMode": "AUTO_CREATE_PR",
  "title": "Boba App" }
```
立即回應含 `name: "sessions/31415926535897932384"`。
輪詢 `GetSession`/`ListSessions` 可取 PR（若 `automationMode=AUTO_CREATE_PR`）。
`requirePlanApproval: true` 可改為需顯式批准計畫。

### 3. List sessions
```
GET https://jules.googleapis.com/v1alpha/sessions?pageSize=5
Header: x-goog-api-key: $JULES_API_KEY
```

### 4. Approve plan
```
POST https://jules.googleapis.com/v1alpha/sessions/SESSION_ID:approvePlan
Header: Content-Type: application/json
        x-goog-api-key: $JULES_API_KEY
```

### 5. List activities
```
GET https://jules.googleapis.com/v1alpha/sessions/SESSION_ID/activities?pageSize=30
Header: x-goog-api-key: $JULES_API_KEY
```

### 6. Send message
```
POST https://jules.googleapis.com/v1alpha/sessions/SESSION_ID:sendMessage
Header: Content-Type: application/json
        x-goog-api-key: $JULES_API_KEY
Body: { "prompt": "Can you make the app corgi themed?" }
```
回應為空，agent 回覆會出現於下一筆 activity（再 list activities 取得）。

## 免費自託管等價（OA-Team 30 · OmniJules）

| OmniJules 端點 | OmniJules 免費實作 | 負責靈魂 |
|-----------|-------------------|----------|
| list sources | `gh repo list` / 本組織授權 repo | 萬能外交蜂(23) |
| create session | 觸發 `auto-repair.yml`（OA-TWINS Auto-Repair） | 萬能編碼蜂(07) |
| approve plan | 5T 驗算闡（EntropyForge.applyHashLock）自動準則 | 萬能質控蜂(30) |
| list activities | `gh run list`（GitHub Actions 軌跡） | 萬能追蹤蜂(26) |
| send message | OAB 萬能事件總線 publish（OmniTag: agent:NN） | 萬能運營蜂(20) |

詳見 soul.md §17「萬能外部協力映射」。

## Integrations（OmniJules 整合 · 摘錄）

> 來源：使用者於終端機貼上的 OmniJules Docs → Integrations 頁面（Render / 部署與 CI/CD）。

### 核心概念
OmniJules 透過連接外部工具，取得與你相同的上下文：自主偵測 bug、讀取 build log、理解專案需求，無需人工輸入。

### 部署與 CI/CD
連接部署管線，讓 OmniJules 自動偵測 build 失敗並提出修復。例如 **Render**：
- 自動取得 build log 並修復部署失敗。
- OmniJules 監看失敗的 build、分析 log、直接把修復推進 OmniJules 自己開的 PR。

### 整合運作方式（How Integrations Work）
連接一個整合時，OmniJules 使用 scoped access 與工具互動：
1. **預設唯讀**：除非另有指定，OmniJules 只請求讀取 log / 狀態所需的最小權限。
2. **自主觸發**：整合讓 OmniJules 能因外部事件（如失敗 webhook）自動甦醒，不必等人下 prompt。
3. **安全儲存**：API key 加密保存，絕不顯示於聊天介面或跨 session 共用。

> 對齊點：上述「自主觸發」「加密儲存」「scoped access」與 OA-Team 30 的 OAB 事件總線、
> 5T Trustworthy（Hash Lock + Object.freeze）、以及 §17 外部協力映射完全一致——只是 OmniJules 走 Google 付費 SaaS。

## 免費自託管等價（整合層 · OmniJules）

| OmniJules 整合能力 | OmniJules 免費實作 | 負責靈魂 |
|---------------|-------------------|----------|
| Render build-failure 偵測 | OA-TWINS Auto-Repair 監看 `gh run`（失敗即修） | 萬能維護蜂(28) |
| 自主觸發（webhook 甦醒） | OAB 萬能事件總線（OmniTag 訂閱） | 萬能運營蜂(20) |
| 加密儲存 API key | 本機 `.env`（gitignore）+ 1Password/agentmail | 萬能安全蜂(27) |
| scoped access 最小權限 | 5T 驗算闡門禁（EntropyForge） | 萬能質控蜂(30) |

---

## 待續章節索引（接納框架 · D）

> 使用者陸續貼上的 OmniJules Docs 章節，依序接於此處，保持 §17 對齊。

| 章節 | 狀態 | 對應 OmniJules 落點 |
|------|------|---------------------|
| REST API Quickstart | ✅ 已入庫（本檔上段） | tools/omni-jules-bridge.* |
| Integrations (Render) | ✅ 已入庫 + 腳本 | tools/render-integration.sh · §17.7 |
| Supabase 整合 key | ✅ 已接受（session env 注入） | tools/omni-jules-bridge.py supabase |
| Changelog | 🔄 待貼 | 本檔續章 + bridge 指令擴充 |
| OmniJules Tools (CLI) | 🔄 待貼 | 本檔續章 + bridge 指令擴充 |
| Guides | 🔄 待貼 | 本檔續章 |
| Examples | 🔄 待貼 | 本檔續章 |

**接納規範**：每貼一章，於本索引標 ✅、於本檔補對應章節、必要時擴充 bridge 指令；
始終遵守 §17.0 硬約束（不接付費 OmniJules 本體、等功零金）。
詳見 `omni-jules-bridge.*` 之 `integrations` 指令。
