# OpenCode Console API 整合指南（Service Account / 裝置流程 / 工作區設定）

> **Doc ID / 文件代號** OC-CONSOLE-API-001 · **Version / 版本** v1.0 · **Status / 狀態** 參考資料 (Reference)
> **Written / 撰寫日期** 2026-10-07 · **Scope / 適用範圍** OpenCode Console API 整合（CI / 自動化服務帳戶）
> **Purpose / 文件目的** 收錄 OpenCode Console API 的端點、金鑰權限、裝置授權流程與錯誤碼，供整合端（CI Pipeline 等非人類帳戶）作為單一參考
>
> **Convention / 落檔規範** 英標繁博 (English Standard, Traditional Chinese Broad) · 5T Protocol
> **Source / 資料來源** 使用者提供之 OpenCode Console API Overview 文件（原樣整理，未增補未提供之內容）

---

## 1. 概覽 Overview

Console API 讓整合端讀取工作區設定（workspace configuration）並管理預算（budgets）。所有路徑皆相對於 Console base URL。

```bash
export CONSOLE_URL="https://opencode.ai/console"
export SERVICE_API_KEY="oc_sk_..."

curl --fail-with-body "${CONSOLE_URL}/api/v2/config" \
  --header "Authorization: Bearer ${SERVICE_API_KEY}"
```

### 端點一覽 Endpoints

| API | 位址 / Path |
|-----|-------------|
| Inference | `https://opencode.ai/inference/...` |
| Providers | `https://opencode.ai/inference/custom/...` |
| Budgets | `/api/v1/budgets/members` |
| Config | `GET /api/v2/config` |

---

## 2. 服務帳戶 Service accounts

整合端以**服務帳戶**（service account）認證：隸屬工作區的非人類成員，有自己的 API 金鑰、用量與預算。Owner 與 Admin 在 **Keys** 中管理。

**建立步驟 Setup**：

1. 開啟 **Keys** → **Add Service Account**，命名（例如 `CI Pipeline`）。
2. 對該服務帳戶點 **Add API Key**。
3. 選擇 **Key name**、**Permissions** 與（可選的）**Expiry date** → **Create key**。
4. 複製金鑰——**只顯示一次**：

```
oc_sk_1a2b3c4d5e6f_...
```

以 Bearer 方式傳送；金鑰綁定單一工作區，**不需要**工作區標頭（workspace header）。

```bash
Authorization: Bearer oc_sk_...
```

### 權限 Permissions

| Permission | 允許範圍 Allows |
|------------|----------------|
| **Inference only** | 僅 Inference 與 Providers 請求，以及 `GET /api/v2/config`。 |
| **All** | 上述全部，加上具管理員存取的 Console API（**不含**管理模型）。 |

即使持有 **All** 部分操作仍必須由真人登入 Console 執行：
邀請成員、變更角色、移除成員、建立或撤銷金鑰。

### 撤銷金鑰 Revoke keys

- 開啟 **Keys** → 對該金鑰 **revoke**；移除服務帳戶會撤銷其全部金鑰。
- 被撤銷或過期的金鑰，自動化請求會**立即**收到 HTTP 401。

---

## 3. 使用者代幣 User tokens

使用者代幣（user token）的作用等同「已登入的真人」，以其工作區角色運作。傳送時需帶 `x-org-id` 標頭指定工作區：

```bash
curl --fail-with-body "${CONSOLE_URL}/api/v2/config" \
  --header "Authorization: Bearer ${USER_TOKEN}" \
  --header "x-org-id: org_..."
```

- 由裝置流程（device flow）取得的代幣已綁定登入時選擇的工作區，**不需**該標頭。
- 指定不同的 `x-org-id` 會回 **403**。

---

## 4. 裝置流程 Device flow

OpenCode 使用 OAuth **裝置授權碼流程**（RFC 8628）登入；其他 CLI 可使用相同流程。

**① 申請裝置碼 Request a device code**
（傳送 `supports_org_scope=true` 可將代幣綁定工作區）

```bash
curl --fail-with-body "${CONSOLE_URL}/auth/device/code" \
  --data "client_id=my-cli" \
  --data "supports_org_scope=true"
```

回應包含 `device_code`、`user_code`、`verification_uri_complete`、`expires_in`（**600 秒**）與 `interval`（**5 秒**）。

**② 瀏覽器核准 Approve**

開啟 `verification_uri_complete`（為 `/console/device?user_code=...` 形式，相對於 `https://opencode.ai`）。
該真人登入、選擇工作區並核准。

**③ 輪詢代幣 Poll for the token**
以相同 `client_id`、依 `interval` 秒數輪詢：

```bash
curl --fail-with-body "${CONSOLE_URL}/auth/device/token" \
  --data "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
  --data "device_code=..." \
  --data "client_id=my-cli"
```

| 階段 | 回應 |
|------|------|
| 尚未核准 | HTTP **400**，`authorization_pending` |
| 成功 | `access_token`、`refresh_token`、`expires_in`、`org_id` |

**④ 重新整理 Refresh**
在 access token 到期前重新整理；工作區綁定會保留。

```bash
curl --fail-with-body "${CONSOLE_URL}/auth/device/token" \
  --data "grant_type=refresh_token" \
  --data "refresh_token=..." \
  --data "client_id=my-cli"
```

> ⚠️ **每個 refresh token 只能使用一次**；重用舊的 refresh token 會**撤銷整個 session**。

---

## 5. 工作區設定 Workspace config

`GET /api/v2/config` 回傳該工作區可用的 providers 與 models（OpenCode V2 config 格式）。OpenCode 在 `/connect` 之後載入它。

```bash
curl --fail-with-body "${CONSOLE_URL}/api/v2/config" \
  --header "Authorization: Bearer ${SERVICE_API_KEY}"
```

```json
{
  "providers": {
    "opencode": {
      "name": "OpenCode",
      "env": ["OPENCODE_CONSOLE_TOKEN"],
      "package": "aisdk:@ai-sdk/openai-compatible",
      "settings": {
        "baseURL": "https://opencode.ai/inference/openai/v1",
        "apiKey": "{env:OPENCODE_CONSOLE_TOKEN}"
      },
      "headers": { "x-opencode-org-id": "org_..." },
      "models": {
        "kimi-k2.6": { "name": "Kimi K2.6" }
      }
    }
  }
}
```

### 欄位說明 Fields

| Field | Description |
|-------|-------------|
| `providers` | Console、Go 與已連接的 providers，各含其 gateway 設定與模型。 |
| `websearch` | 托管網頁搜尋（hosted web search），啟用時供成員使用。 |
| `mcp` | Console MCP server，供成員使用。 |
| `experimental.policies` | 工作區政策陳述（workspace policy statements）。 |

> 任何金鑰權限等級與成員角色皆可讀取此 config。

---

## 6. 錯誤 Errors

錯誤回傳 JSON，含 `_tag` 標示錯誤類別：

```json
{ "_tag": "Forbidden" }
```

| Status | Meaning |
|--------|---------|
| **400** | `OrgRequired`：傳送了使用者代幣但缺少 `x-org-id`。 |
| **401** | 認證缺失、無效、過期或已撤銷（Missing, invalid, expired, or revoked credential）。 |
| **403** | 工作區不符、權限不足，或以 *Inference only* 金鑰存取 Console 端點。 |
| **404** | 工作區不存在或已刪除（The workspace does not exist or was deleted）。 |

---

*5T: Traceable(this file path) / Trackable(Doc ID OC-CONSOLE-API-001 v1.0) /
Tangible(reference usable for integration) / Transparent(all endpoints & error codes tabulated) /
Trustworthy(faithful transcription of the provided source, no invented fields)*
