---
name: oa-vps-gateway
description: "Hermes Agent Gateway VPS setup, Telegram auth, cron reports, and infrastructure management. Use when setting up or maintaining Hermes Gateway on a VPS (Oracle Cloud, etc.), configuring Telegram bot auth, scheduling daily reports, or debugging gateway connectivity."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [vps, gateway, hermes, telegram, cron, infrastructure, esggo]
    related_skills: [oa-summon, oa-deploy, oa-realtime-monitor]
---

# OA VPS Gateway — Hermes Gateway VPS 基礎設施 v2

## Overview

管理 Hermes Agent Gateway 在 VPS 上的部署、Telegram 認證、定時任務、基礎設施監控。支援 Oracle Cloud、DigitalOcean、任何 Linux VPS。

## When to Use

- 用戶說「VPS Gateway」、「Hermes VPS」、「Telegram Bot 設定」、「Gateway 部署」
- 需要設定或維護遠端 Gateway

**Don't use for:** 本地開發、Vercel 部署（用 `oa-deploy`）

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VPS (Oracle ARM64)                │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  PM2: esggo-core │  │  PM2: omniagent-gateway │  │
│  │  Port: 3000      │  │  Port: 8642             │  │
│  └────────┬────────┘  └───────────┬─────────────┘  │
│           │                       │                │
│           └───────────┬───────────┘                │
│                       ▼                            │
│           ┌─────────────────────┐                  │
│           │      Nginx          │                  │
│           │  Port 80/443        │                  │
│           │  proxy_next_upstream│                  │
│           └─────────────────────┘                  │
└─────────────────────────────────────────────────────┘
```

## Core Workflow

### Step 1: VPS 初始化

```bash
# Ubuntu 22.04 ARM64 (Oracle Cloud)
# 1. 系統更新
apt update && apt upgrade -y

# 2. 安裝 Node.js 22+
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# 3. 安裝 PM2、Nginx
npm i -g pm2
apt install -y nginx

# 4. 設定 ulimit
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf
echo "session required pam_limits.so" >> /etc/pam.d/common-session
```

### Step 2: 部署雙進程

```bash
# 1. Clone 專案
cd /var/www
git clone https://github.com/DingJun1028/esggo.git
cd esggo

# 2. 安裝依賴
pnpm install --frozen-lockfile

# 3. 建置
pnpm build

# 4. PM2 生態配置
# ecosystem.config.cjs 已包含 esggo-core (3000) + omniagent-gateway (8642)

# 5. 啟動
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Step 3: Nginx 反向代理

```nginx
# /etc/nginx/sites-available/esggo
upstream esggo_core {
    server 127.0.0.1:3000;
}

upstream omniagent_gateway {
    server 127.0.0.1:8642;
}

server {
    listen 80;
    listen 443 ssl http2;
    server_name 161.118.248.180;  # VPS IP

    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;

    # 必須：proxy_next_upstream 處理上游失敗
    proxy_next_upstream error timeout http_500 http_502 http_503 http_504;

    location / {
        proxy_pass http://esggo_core;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /omniagent/ {
        proxy_pass http://omniagent_gateway/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /health {
        proxy_pass http://esggo_core/health;
    }
}
```

### Step 4: Telegram Bot 設定

```bash
# 1. 建立 Bot (@BotFather) → 取得 TOKEN
# 2. 設定 webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://161.118.248.180/omniagent/telegram/webhook"}'

# 3. 設定 .env
OMNIAGENT_TELEGRAM_BOT_TOKEN=<TOKEN>
OMNIAGENT_TELEGRAM_WEBHOOK_SECRET=<SECRET>
OMNIAGENT_ALLOWED_CHATS=<YOUR_CHAT_ID>  # 數字 ID，非 username
```

### Step 5: Cron 報表

```bash
# PM2 cron
pm2 start ecosystem.config.cjs --cron "0 9 * * *" --name "daily-report"
# 或使用 oa-cron-scheduler 技能
```

## Common Pitfalls

1. **PM2 SIGTERM 傳播問題** — `pm2 kill` 會殺掉 gateway，用 `kill -TERM <PID>` 讓 systemd 重啟
2. **Nginx proxy_next_upstream 缺失** — 上游掛掉時會回 502，必須加上
3. **Telegram allowed_chats 為空** — 預設擋所有用戶，必須設定數字 Chat ID
4. **Node.js 版本過舊** — Hermes 需 Node 22+，Ubuntu 預設 20 需升級
5. **Gateway .env 路徑陷阱** — `omni-server.mjs` 讀取 `__dirname + '.env'`，必須在 gateway 目錄

## Verification Checklist

- [ ] Node.js 22+ 安裝
- [ ] PM2 雙進程運行
- [ ] Nginx 反代 + proxy_next_upstream
- [ ] SSL 憑證（自簽或 Let's Encrypt）
- [ ] Telegram webhook 設定
- [ ] allowed_chats 設定數字 ID
- [ ] ulimit 65535 生效
- [ ] 健康檢查端點回應 200