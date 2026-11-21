# ESGGO VPS 完整使用指南 (v2.0)
# 每個項目附帶 Why / What / How 解說

## 系統架構概觀

### Why What How
- **Why**: 企業級應用需要穩定、安全、可監控的基礎架構
- **What**: Ubuntu 24.04 ARM64 VPS，搭配 Nginx、PM2、Prometheus 監控棧
- **How**: 透過 systemd 服務管理、自簽證書 HTTPS、Telegram 即時告警

---

## 一、SSH 登入

### Why
SSH 金鑰認證取代密碼，防止暴力攻擊與提高登入安全性

### What
使用 OpenSSH 金鑰配對進行驗證，支援 Windows/macOS/Linux

### How
```bash
# 1. 準備金鑰 (Windows)
Get-Content C:\Users\Administrator\Downloads\ssh-key-2026-04-25.key | ssh root@161.118.248.180

# 2. 連線方式
ssh -i ~/.ssh/esggo-vps-key root@161.118.248.180                 # Linux/macOS
ssh -i C:\Users\Administrator\Downloads\ssh-key-2026-04-25.key root@161.118.248.180  # Windows
```

---

## 二、PM2 服務管理

### Why
Node.js 應用需要常駐、自動重啟、叢集支持

### What
PM2 是 Node.js 生產環境進程管理器，支援叢集模式與記錄

### How
```bash
# 查看服務狀態
pm2 list

# 即時記錄
pm2 logs esggo-core

# 叢集重啟
pm2 reload esggo-core

# 保存當前狀態 (開機自動啟動)
pm2 save
pm2 startup
```

---

## 三、Nginx 反向代理

### Why
單一進入點管理 HTTPS、負載平衡、靜態檔案快取

### What
Nginx 接收 HTTP/HTTPS 請求，轉發至 Next.js (3000) 與 Gateway (8642)

### How
```bash
# 配置位置
/etc/nginx/sites-available/esggo-https.conf

# 核心配置
server {
  listen 443 ssl;
  ssl_certificate /etc/nginx/ssl/esggo.crt;
  location / { proxy_pass http://127.0.0.1:3000; }
  location /gateway { proxy_pass http://127.0.0.1:8642; }
}
```

---

## 四、HTTPS/SSL 加密

### Why
資料傳輸加密，瀏覽器信任，SEO 友好

### What
自簽證書 (有效 1 年)，將 HTTP 80 自動轉向 HTTPS 443

### How
```bash
# 產生證書
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/esggo.key \
  -out /etc/nginx/ssl/esggo.crt \
  -subj '/CN=161.118.248.180/O=ESGGO/C=TW'

# Nginx 重啟
nginx -t && nginx -s reload
```

---

## 五、Prometheus 監控

### Why
時間序列資料庫，用於儲存與查詢系統指標

### What
每 15 秒採集一次 node-exporter、nginx-exporter、netdata 指標

### How
```bash
# 端點: http://161.118.248.180:9090
# 查詢範例
curl "http://localhost:9090/api/v1/query?query=up"
```

---

## 六、Alertmanager 告警

### Why
集中式告警路由，支援 Email/Webhook/Slack/Telegram

### What
接收 Prometheus 告警，轉發至 Telegram Bot (chat_id: 6387287462)

### How
```bash
# 配置: /etc/alertmanager/alertmanager.yml
route:
  receiver: 'telegram'

# Webhook 位址
http://localhost:9080/alert  (由 telegram-alert.sh 提供)
```

---

## 七、Netdata 即時監控

### Why
即時系統資源可視化，無需配置，自動發現服務

### What
展示 CPU/記憶體/磁碟/網路 74 個指標，網頁介面一看即知

### How
```bash
# 網頁: http://161.118.248.180:19999
# API 查詢
curl http://localhost:19999/api/v1/info | jq .
```

---

## 八、Telegram 告警服務

### Why
即時通知您的手機，任何時間、任何地點收到系統狀態

### What
Bot Token: 環境變數 `TELEGRAM_BOT_TOKEN`（BotFather 取得），透過 nc 監聽 9080 webhook 接收 Alertmanager POST

### How
```bash
# 測試發送
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d chat_id=${TELEGRAM_ALERT_CHAT_ID} \
  -d text="✅ 服務運作正常"
```

---

## 九、UFW 防火牆

### Why
預設 deny all，僅允許必要端口，阻擋端口掃描與攻擊

### What
允許 22/80/443/3000/8642，IPv4/IPv6 都適用

### How
```bash
ufw status verbose
# 22/tcp   ALLOW IN   Anywhere
# 80/tcp   ALLOW IN   Anywhere
# 443/tcp  ALLOW IN   Anywhere
```

---

## 十、Fail2Ban 入侵防護

### Why
自動封鎖 SSH 暴力攻擊 IP 3 次失敗封 24 小時

### What
監控 /var/log/auth.log，ban offenders

### How
```bash
# 狀態
fail2ban-client status sshd

# 解鎖 IP
fail2ban-client set sshd unbanip 1.2.3.4
```

---

## 十一、備份系統

### Why
資料災僱難恢復，自動備份確保 ESGGO 數據安全

### What
每日/每週/每月 三層保留策略，儲存於 /var/backups/esggo

### How
```bash
# 查看備份
bash /root/vps/backup.sh --list

# 手動備份
bash /root/vps/backup.sh

# 還原
bash /root/vps/backup.sh restore 20260704
```

---

## 十二、Logrotate 日誌管理

### Why
防止日誌無限增長喫滿磁碟，自動壓縮與保留 14 天

### What
Nginx/PM2/系統日誌自動輪轉

### How
```bash
# 配置
/etc/logrotate.d/esggo

# 手動執行
logrotate /etc/logrotate.d/esggo
```

---

## 十三、Cron 排程

### Why
自動化重複性任務：健康檢查、備份、維護

### What
每 5 分鐘健康檢查、每日 03:00 備份、每週完整備份

### How
```bash
# 查看
crontab -l

# 手動觸發
/usr/local/bin/esggo-health-check
```

---

## 十四、Cloudflare CLI

### Why
CDN、DNS、SSL 管理，未來可快速切換到 Cloudflare 下發

### What
npm 套件 `cloudflare`，支援 zones/dns/ssl 管理

### How
```bash
npm install -g cloudflare
cf api YOUR_API_TOKEN
```

---

## 十五、日誌與故障排除

### Why
系統問題快速定位，記錄所有異常

### What
Nginx/PM2/Prometheus 日誌分別存於不同位置

### How
```bash
# Nginx
tail -f /var/log/nginx/error.log

# PM2
pm2 logs --json

# 系統
journalctl -fu prometheus
```

---

## 服務總覽表

| 服務 | 端口 | Why | How |
|------|------|-----|-----|
| SSH | 22 | 安全登入 | ssh -i key root@161.118.248.180 |
| Nginx HTTPS | 443 | 加密代理 | https://161.118.248.180 |
| Nginx HTTP | 80 | 轉 HTTPS | 自動轉向 443 |
| ESGGO Core | 3000 | 前端應用 | proxy via Nginx |
| OmniAgent | 8642 | AI Gateway | /gateway 端點 |
| Prometheus | 9090 | 指標查詢 | Web UI + API |
| Alertmanager | 9093 | 告警路由 | Telegram webhook |
| Netdata | 19999 | 即時監控 | 資源儀錶板 |
| nginx-exporter | 9113 | Nginx 指標 | Prometheus target |
| Telegram | 9080 | 告警接收 | Alertmanager webhook |