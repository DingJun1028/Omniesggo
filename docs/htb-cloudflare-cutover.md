# htb.esggo-co 改採 Cloudflare 佈署 — 紀要與切換 Runbook（2026-10-10）

## 現況（已確認）
- 網頁本身：本機 `pnpm --filter @esggo/htb-esggo-co build` **先前是壞的**（tailwind v4 devDep + v3 語法 css，同 learning-center 的病）→ 已釘回 `tailwindcss ^3.4.19` 修好，build 綠（CSS 10.85kB／JS 291kB）。VPS 上 serving 的是 10/8 舊 dist。
- 原部署：VPS nginx 靜態站（`/var/www/htb.esggo.co`，certbot SSL）→ Cloudflare 代理。公開可訪問。
- 新部署（已就緒待切）：Cloudflare **Pages** 專案 `htb-esggo-co`，最新 dist 已部署（htb-esggo-co.pages.dev）。

## 阻塞：Cloudflare Access「All Workers」政策
帳戶有一條 `All Workers` Access 應用（id `86a4d5af-f6a9-49ec-9cda-9ce49862d052`），政策＝僅 Cloudflare 帳戶成員可登入，**涵蓋所有 Workers／Pages 主機名（含自訂域）**。實測：
- htb-esggo-co.pages.dev、htb-esggo-co.<account>.workers.dev → 302 導 access 登入
- htb.esggo.co 綁到 Pages 自訂域後同樣 302 → **公開站會被閘死**

API 建 bypass app 三次皆 `12130 invalid_request`（token 有 Access 讀、推測缺 Access 寫 scope），因此**暫不切域**：已刪 Pages 自訂域與 CNAME、A 記錄切回 VPS，公開訪問即時恢復（200 實測）。

## 一鍵切換前置（二選一，需帳戶權限）

### 選項 1：Dashboard（最易）
Workers & Pages → `htb-esggo-co` → **Access** 分頁 → 開啟「Make this Worker public（bypass account-level Access）」。
（同 ftgtours-api-public 的先例：Zero Trust → Access → Applications → self-hosted app for ftgtours.esggo.co + Bypass everyone。htb 只要複製此模式。）

### 選項 2：API（token 需 Access:Apps and Policies:Edit）
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/d9d7ecd92cbad6d858fba3e529b9cb7b/access/apps" \
 -H "Authorization: Bearer <有 ZeroTrust 寫權限的 token>" -H "Content-Type: application/json" \
 -d '{
   "type":"self_hosted",
   "name":"htb-esggo-co public (B2B 官網)",
   "domain":"htb.esggo.co",
   "self_hosted_domains":["htb.esggo.co"],
   "destinations":[{"type":"public","uri":"htb.esggo.co"}],
   "app_launcher_visible":false,
   "session_duration":"24h",
   "policies":[{"name":"Bypass everyone (public B2B site)","decision":"bypass","include":[{"everyone":{}}],"precedence":1}]
 }'
```

## 切換步驟（bypass 就緒後）
1. `pnpm --filter @esggo/htb-esggo-co build`
2. `cd apps/htb-esggo-co && npx wrangler pages deploy dist --project-name=htb-esggo-co --branch=main`
3. CF API：Pages 專案加自訂域 `htb.esggo.co`（或 Dashboard：Pages → htb-esggo-co → Custom domains → Add）
4. 刪舊 A 記錄（VPS），CF 會自動建 CNAME → htb-esggo-co.pages.dev（proxied）
5. 驗收清單：`/` 200＋標題、assets 200、iPhone/Android UA 200、HTTP→HTTPS 301、**無 access 登入閘**
6. VPS nginx site 保留 7 天當備援再下線

## 注意
- MX/TXT（email routing）全程未動。
- Pages 專案會持續保留；未加自動化 workflow 前，每次改版手動執行步驟 1-2（建議後續補 `deploy-htb.yml`）。
