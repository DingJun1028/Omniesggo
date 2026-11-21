# Capacities API — 整合參考卡

> 來源：Capacities 官方 API 文件（Authentication 章節），2026-08-21 收錄。
> 用途：OA-Team 30 萬能蜂群將 Capacities 作為外部知識源 / 雙蜂隊共享記憶備援層時的認證與呼叫基準。

## 1. 認證概觀

- 全程 HTTPS。Access token 禁止出現在 client-side code 或公開 repo。
- 兩種模式：
  - **Personal API token**（`cap-api-` 前綴）：自用腳本 / 本機自動化 / CLI。綁定單一 space，無 `spaceId` 欄位。
  - **OAuth 2.0 (PKCE)**：給第三方整合，使用者授權後取得 `access_token`，永不經手使用者個人 token。

## 2. Personal Token

```
Authorization: Bearer cap-api-<token>
```

- 取得：Capacities 桌面 App → Settings → Capacities API → Generate new token → 選 space → 選 read-only / write。
- 撤銷：同頁刪除 → 立即 401 (`cap_not_authenticated`)。

## 3. OAuth 2.0 (PKCE) — Authorization Code Flow

### 3.1 Discovery

```
GET https://api.capacities.io/.well-known/oauth-authorization-server
```
回傳 RFC 8414 文件：`authorization_endpoint` / `token_endpoint` / `scopes_supported` / `revocation_endpoint`。

### 3.2 Scopes

| Scope | 允許 |
|---|---|
| `api:read` | 讀取物件 / 頁面 / 屬性 / space 資訊 |
| `api:write` | 建立與修改 space 內容 |
| `offline_access` | 取得 refresh_token 保持連線 |

### 3.3 流程

1. 產 PKCE pair：`code_verifier` (43-128 URL-safe) → `code_challenge = BASE64URL(SHA256(verifier))`
2. 導向授權端點（**resource 參數必須是 `https://api.capacities.io`**）：
```
GET https://api.capacities.io/oauth/authorize
  ?response_type=code
  &client_id=<id>
  &redirect_uri=<uri>
  &scope=api:read%20api:write%20offline_access
  &resource=https://api.capacities.io
  &code_challenge=<S256>
  &code_challenge_method=S256
  &state=<state>
```
3. 交換 token（**public client，無 client_secret，client_id 放 body**）：
```
POST https://api.capacities.io/oauth/token
grant_type=authorization_code&code=<code>&redirect_uri=<uri>&client_id=<id>&code_verifier=<verifier>
```
回應：`{ access_token, token_type: "Bearer", expires_in: 3600, refresh_token, scope }`

### 3.4 Refresh

```
POST https://api.capacities.io/oauth/token
grant_type=refresh_token&refresh_token=<rt>&client_id=<id>
```
- Refresh token **每次使用後輪換**，立即存新值；舊的失效。
- 6 個月無活動或使用者移除連線後過期。

### 3.5 使用 access token

```
Authorization: Bearer <access_token>
```
JWT 短效（1 小時）。

### 3.6 撤銷（RFC 7009）

```
POST https://api.capacities.io/oauth/revoke
Content-Type: application/x-www-form-urlencoded
token=<rt_or_at>&token_type_hint=refresh_token&client_id=<id>
```
永遠回 200 OK（空 body），撤銷整個連線。

## 4. 錯誤碼（RFC 6749 5.2）

| error | 原因 |
|---|---|
| `invalid_request` | 缺參或格式錯（如送了 client_secret） |
| `invalid_client` | client_id 未知 |
| `invalid_grant` | code 已用 / 過期 / verifier 不符 |
| `invalid_scope` | scope 不允許 |
| `invalid_target` | resource 缺或不是 api.capacities.io |
| `unauthorized_client` | redirect_uri 不在允許清單 |

## 5. OA-Team 整合注意

- 社群整合**強制 OAuth**（不能要求使用者貼 personal token）。
- 需先向 Capacities 申請 `client_id`（curated registry，郵件提交）。
- 本機自用小工具可用 personal token（`cap-api-`）。
- 參見 `packages/capacities/src/client.ts` 與 `oa-knowledge-sync.ts`。
