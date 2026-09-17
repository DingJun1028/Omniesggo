---
source_origin: oa-knowledge-avatar
created: 2026-08-28
modified: 2026-08-28
co_authors: [oa-team, hermes, uzairansar-hermex]
lifecycle: active
access: public-research
tags: [hermex, ios, hermes-webui, cloudflared, docker, mobile-connect, esggo-vps]
traceability:
  - source: https://github.com/uzairansaruzi/hermex
  - source: https://uzairansar.com/hermes-mobile
  - vps: esggo-vps (Oracle ARM, 161.118.248.180)
  - container: hermes-webui-hermes-webui-1 (port 8790->8787)
  - tunnel: hermes-ui.esggo.co (Cloudflare)
verified: true
---

# Hermex iOS App 連線 Hermes WebUI 實錄

## 一、產品身份辨識（關鍵！）

App Store `HERMEX`（ID 6767006319）= 開發者 **Uzair Ansar** 的第三方 **Hermes Agent 原生 iOS 客戶端**，**非** Nous Research 官方 App。
- 官方 repo: `https://github.com/uzairansaruzi/hermex`
- 它連的是**標準 Hermes WebUI**（`HERMES_WEBUI_PASSWORD` 保護），不是自製後端
- 名字撞車「Hermes」造成混淆：不要跟 `hermex.esggo.co`（官方 WebUI）搞混

## 二、VPS 架構（esggo-vps）

| 元件 | 位置 | 說明 |
|---|---|---|
| Hermes WebUI 容器 | Docker `hermes-webui-hermes-webui-1` | 映射 `0.0.0.0:8790->8787` |
| compose 檔 | `/home/ubuntu/hermes-webui/docker-compose.yml` | 密碼在這裡啟用 |
| nginx 轉發 | `/etc/nginx/sites-enabled/hermes-ui.esggo.co.conf` | listen 8796 → proxy_pass 127.0.0.1:8790 |
| Cloudflare 隧道 | `/etc/cloudflared/config.yml` | `hermes-ui.esggo.co` → 127.0.0.1:8796 |
| DNS | Cloudflare esggo.co zone | CNAME `hermes-ui` → `<tunnel-id>.cfargotunnel.com` (proxied) |

## 三、連線參數（已驗證可用）

- **伺服器 URL**: `https://hermes-ui.esggo.co`
- **密碼**: `jCvnJMQDNxaF1BEQkNbKrkvx`（24 字元，存於 compose + `.env.docker`）
- **連線標頭**: 留空（密碼走 App 登入流程，非 HTTP header）
- App 填 URL → 連上 → 彈登入框 → 輸入密碼 → 進入

## 四、踩坑與解決（5T 誠實記錄）

1. **誤判容器為殭屍**：`hermeswebui` 使用者程序在跑，以為是垃圾。實際是 healthy Docker 容器（`docker ps` 確認 Up + health: healthy）。**不要殺**。
2. **Oracle 安全列表擋端口**：直接 `IP:8790` 外部 timeout（000）。解法：走 Cloudflare 443 隧道繞過（443 已開）。
3. **cloudflared 改錯路徑**：實際讀 `/etc/cloudflared/config.yml`，不是 `~/.cloudflared/`。改錯檔案導致 restart 失敗。
4. **cloudflared 9090 端口衝突**：舊進程佔 `127.0.0.1:9090` → `fuser -k 9090/tcp` + `pkill` 後重啟成功。
5. **DNS CNAME 缺失**：隧道建好但子域無 CNAME → 手機連 000。建 CNAME 後 200。
6. **後端無密碼 → App 報「內部錯誤」**：`/api/me` 原回 404（無認證端點），啟用 `HERMES_WEBUI_PASSWORD` 後回 401（需登入），App 才能正常 sign-in。

## 五、驗證閉環

- `curl https://hermes-ui.esggo.co/health` → 200 (`status: ok`)
- `curl https://hermes-ui.esggo.co/api/me` (無 auth) → 401 (證明密碼生效)
- 手機 App 實際登入成功（使用者回報「進去了」）

## 六、反模式警示

- 不要照 Gemini 通用教學在 VPS 重裝 `hermes gateway` / `webhook` / Certbot —— 與現有 Hermex WebUI + nginx + cloudflared 架構衝突
- 不要殺 `hermes-webui` 容器（它是手機 App 的後端）
- 第三方 App 名字撞車「Hermes」時，先查 GitHub repo 確認產品身份再動手
