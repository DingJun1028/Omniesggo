# esggo × Cloudflare 整合規劃（帳戶 API 令牌為主軸）

> 文件來源：Cloudflare「Account API tokens」官方文件
> https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/
> 全產品索引：https://developers.cloudflare.com/llms.txt

## 1. 帳戶 API 令牌是什麼（決定用不用它的關鍵）

| 類型 | 前綴 | 適用場景 | 持久性 |
| --- | --- | --- | --- |
| 帳戶 API 令牌 | `cfat_` | CI/CD、SIEM、外部整合（服務主體） | 長期，不因使用者離職失效 |
| 使用者令牌 | — | 臨時腳本、以使用者身分操作 | 隨使用者失效 |
| R2 API token | Access Key ID / Secret | R2 物件讀寫 | 長期，獨立於帳戶令牌 |
| Turnstile secret | — | 驗證 token | 長期，zone 層級 |

建立帳戶令牌需「帳戶超級管理員」：Dashboard → Manage Account → Account API Tokens → Create Token。
或用 API：`POST /accounts/{account_id}/tokens`（需 `Account API Tokens Write` 權限）。

## 2. 相容性矩陣（直接影響 esggo 選型）

✅ 可用帳戶令牌：Workers AI、R2（管理層）、Tunnels、Workers、Workers KV、Vectorize、DNS、Access、D1、Durable Objects、Stream、Pages、Waiting Room、Zaraz…（幾乎全產品）

❌ **不能用帳戶令牌**，須改用 zone / 其他體系：
- **Turnstile** → zone 層級 scoped token 或 Global API Key
- Super Bot Fight Mode → 控制台設定
- Registrar → 僅控制台
- Page Rules → 舊體系（建議轉 Rulesets）
- Intel Data Platform → 不支援
- Zero Trust Client Platform → 走 Zero Trust 體系

## 3. esggo 四個落點與令牌/密鑰對應

| 落點 | 檔案 | 所需憑證 | 相容 | 備註 |
| --- | --- | --- | --- | --- |
| A. Workers AI 備援推理 | `src/lib/cloudflare/workers-ai.ts` | `CLOUDFLARE_ACCOUNT_TOKEN` (cfat_) + `CLOUDFLARE_ACCOUNT_ID` | ✅ | 作為 @google/genai 主力的降級端 |
| B. R2 學員資源儲存 | `src/lib/cloudflare/r2.ts` | `CLOUDFLARE_R2_ACCESS_KEY_ID` + `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | ✅(管理) | **實際讀寫用 R2 API token，非 cfat_** |
| C. Cloudflared Tunnel | `vps/cloudflared/` | 帳戶令牌(Tunnels:Edit) 或 login 憑證 | ✅ | 免公網 IP 暴露 VPS |
| D. Turnstile 防機器人 | `src/lib/cloudflare/turnstile.ts` | `TURNSTILE_SECRET_KEY` (zone) + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ❌ | **不能用 cfat_**，用 zone token |

## 4. 安全規範（esggo 一貫要求）

1. 最小權限：每個令牌只給需要的 product + 操作（Read > Edit 優先）。
2. 設過期日（`expires_on`），不用永久令牌。
3. 儲存位置：
   - CI：GitHub repo secret（命名 `CLOUDFLARE_ACCOUNT_TOKEN` / `CLOUDFLARE_R2_*`）。
   - VPS：環境變數 / `.env`（不進 git）；cloudflared cert.pem 權限 600。
4. `cfat_` 前綴可被憑證掃描器偵測外洩；CI secret-scan 已加入 `cfat_` 形狀（見下方）。
5. 前端只敢用 `NEXT_PUBLIC_*` 的「公開」值（site key）；secret/token 一律僅後端。
6. 任何密鑰缺失時 fail-fast（模組會丟錯而非回傳假資料）。

## 5. 前端 Turnstile widget 接法（D 的前半）

在表單頁（如學員中心作業提交 / 預約諮詢）注入：

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<div class="cf-turnstile" data-sitekey="{{NEXT_PUBLIC_TURNSTILE_SITE_KEY}}" data-action="submit_assignment"></div>
```

提交時從 `cf-turnstile-response` 取 token，POST 到 Next route，後端呼叫 `verifyTurnstileFromEnv(token, ip)`。

## 6. 本機測試（不觸真實 Cloudflare）

所有模組在缺憑證時 fail-fast，因此：
- `pnpm typecheck` 可全量驗證型別（不需真憑證）。
- 實際推理/R2/Turnstile 驗證需填入對應 env 後手測。

## 7. 既有專案說明（避免混淆）

- `my-worker/` 是 **Notion Worker**（`@notionhq/workers`，`ntn workers deploy`），與 Cloudflare 無關。
- 根 `wrangler.toml` 是孤立的 `smart-ai-router` Cloudflare Worker 設定，其 `main = "src/index.ts"`
  **根本不存在**（entry 未實作）。本 PR **未**改動它——把它指向 `my-worker/src/index.ts`
  會把 Notion Worker 語法餵給 `wrangler` 編譯，反而惡化既有的 Cloudflare Workers Build 失敗。
- ⚠️ PR CI 中的 `Workers Builds: esggo` 失敗屬 **repo 既有結構性失效**（Cloudflare 直連 repo 自動
  build 此 wrangler，但 entry 從未實作），與本 PR 的帳戶令牌整合**無因果**。歸類為預期紅、不在本 PR scope。
  若要修，應另開 PR 實作 smart-ai-router 的 Cloudflare Worker entry，而非在本 PR 夾帶。
- CI 已有 `ci.yml`（typecheck/vitest/secret-scan）+ `deploy.yml`（VPS Docker 部署），本整合不重造。

## 8. 落地狀態（Workers AI 備援降級鏈接入清單）

`runGeminiWithWorkersAIFallback` 薄封裝已接入以下 `@google/genai` 呼叫端（nexus 在前一 commit，grammar/trends 本 commit）。
主端 Gemini 失敗 → 自動降級 Cloudflare Workers AI（`cfat_` 帳戶令牌）；兩者皆敗回 `INTERNAL_ERROR` 503，不靜默造假。

| Route | 接入 | 原因 / 備註 |
| --- | --- | --- |
| `app/api/nexus/route.ts` | ✅ | trinity.awaken 核心端；provider 標註 gemini\|workers-ai |
| `app/api/sustain-write/v5/grammar/route.ts` | ✅ | 單一 gemini 呼叫、無既有 fallback，與 nexus 對稱 |
| `app/api/village/trends/route.ts` | ✅ | 單一 gemini 呼叫（generateContent 段）；interactions API 段維持原樣不動 |
| `app/api/omni-one/route.ts` | ❌ 刻意不接 | 已有多 provider 路由（Groq→OpenRouter→Gemini→mock），強插會破壞既有降級鏈，且語意重疊 |
| `app/api/rag/query/route.ts` | ❌ 刻意不接 | gemini 用於 embedContent（產生向量）+ generateContent；Workers AI 不產 Gemini 相容向量，僅最終段可備援，收益低且會複雜化 embedding 依賴；留待後續評估 |

驗證：`pnpm build` 通過（exit 0，含 app/** TypeScript 檢查），`pnpm typecheck` / `pnpm lint` 通過。
