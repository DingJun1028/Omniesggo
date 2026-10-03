---
name: mcp-guide
description: OmniAgent MCP 配置與故障排查指南。當需要新增、修改或診斷 MCP 伺服器設定時使用。
version: 1.0.0
metadata:
  omni-agent:
    tags: [mcp, configuration, security, tools]
    category: infrastructure
---

# MCP 伺服器操作指南

## 何時載入此技能

- 新增或修改 `.agents/omni-agent/config.yaml` 中的 MCP 伺服器
- 診斷工具未顯示、連線失敗、採樣逾時問題
- 設定 OAuth 認證的遠端 MCP 伺服器
- 評估某個工具是否應該並行執行

---

## 1. 兩種伺服器類型

### stdio（本地子進程）
```yaml
mcp_servers:
  my_tool:
    command: "npx"
    args: ["-y", "@org/server-name"]
    env:
      API_TOKEN: "${MY_TOKEN}"   # 從環境變數注入，不寫明文
    timeout: 60
    connect_timeout: 15
```
使用時機：伺服器安裝在本地、需要低延遲、文件顯示 `command`/`args`/`env` 欄位。

### HTTP（遠端端點）
```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer ${TOKEN}"
    timeout: 30
    connect_timeout: 10
```
使用時機：伺服器託管在遠端、不想在本地啟動子進程。

### OAuth HTTP（託管服務）
```yaml
mcp_servers:
  linear:
    url: "https://mcp.linear.app/mcp"
    auth: oauth
```
首次連線觸發瀏覽器 OAuth 流程，Token 快取於 `~/.omniagent/mcp-tokens/<server>.json`。

---

## 2. 安全過濾原則

### 優先使用白名單（include）
```yaml
tools:
  include: [list_issues, create_issue, search_code]
  resources: false
  prompts: false
```
適用：財務、客戶資料、破壞性操作的伺服器。

### 黑名單（exclude）僅用於低風險情境
```yaml
tools:
  exclude: [delete_customer, drop_table]
```
⚠️ 優先規則：`include` 存在時，`exclude` 對相同工具無效（include 優先）。

### 完全停用（不建立連線）
```yaml
enabled: false   # 保留配置，下次需要時改回 true
```

---

## 3. 並行執行決策

| 情境 | 設定 |
|------|------|
| 唯讀查詢、獨立 API 呼叫 | `supports_parallel_tool_calls: true` |
| 有狀態操作（Genkit Flow、DB 寫入）| `supports_parallel_tool_calls: false` |
| 修改共用檔案或資料庫 | `false`（避免競態條件） |
| 設計工具（Stitch，唯讀）| `true` |

---

## 4. 採樣控制（Sampling）

MCP 伺服器可透過 `sampling/createMessage` 協定向 OmniAgent 請求 LLM 推理。

```yaml
sampling:
  enabled: true
  model: "gemini-2.0-flash"   # 採樣使用的模型
  max_tokens_cap: 8192
  timeout: 60                  # 單次請求逾時（秒）
  max_rpm: 20                  # 每分鐘最大請求數
  max_tool_rounds: 10          # 採樣中最大工具呼叫輪次
  allowed_models: []           # 空 = 任意；限制如 ["gemini-2.0-flash"]
  log_level: "info"            # debug | info | warning
```

停用採樣（不信任的伺服器）：
```yaml
sampling:
  enabled: false
```

---

## 5. 配置變更後的操作流程

```
配置變更 → 儲存 config.yaml → omni-agent /reload-mcp
                                      ↓
                          自動重載（30 秒逾時）
                          OAuth 流程需改用：
                          omni-agent mcp login <server>
```

⚠️ **陷阱**：在運行中的 session 編輯 config.yaml 時，自動重載只等 30 秒。
OAuth 互動式流程（5 分鐘）必須從新終端執行 `mcp login`。

---

## 6. 故障排查症狀表

| 症狀 | 可能原因 | 解法 |
|------|----------|------|
| 伺服器未連接 | 缺少 runtime（npx/node）| 確認 `npx --version` 可用 |
| 工具未顯示 | `include` 過濾、`enabled: false` | 檢查 tools.include 白名單 |
| 資源/提示包裝器不出現 | 伺服器不支援該功能 | 正常行為，無需處理 |
| OAuth 失敗（無頭主機）| 回環無法到達 | 用 SSH 埠轉送或貼上重定向 URL |
| 工具比預期少 | tools.exclude / include 生效 | 屬預期行為 |
| Genkit 工具衝突 | 並行呼叫有狀態 flow | 確認 `supports_parallel_tool_calls: false` |

---

## 7. ESG GO 伺服器速查

| 伺服器 | 類型 | 並行 | 採樣 | 白/黑名單 |
|--------|------|------|------|----------|
| StitchMCP | HTTP | ✅ true | ❌ | include（10 個工具）|
| nocodebackend | stdio | ❌ | ❌ | exclude: delete_database |
| firebase-mcp-server | stdio | ❌ | ❌ | exclude（4 個危險操作）|
| genkit-mcp-server | stdio | ❌ | ✅ | 無過濾 |
| cloudrun | stdio | — | — | enabled: false |
| google-cloud-firestore | HTTP | — | — | enabled: false |

---

## 參考文件

如需查閱完整配置欄位說明，載入：
`skill_view("mcp-guide", "references/config-fields.md")`
