# ESGGO VPS 完整使用指南

## 系統資訊
- IP: 161.118.248.180
- OS: Ubuntu 24.04 LTS (ARM64)
- SSH: 金鑰登入 only (密碼登入已停用)

---

## 服務端點

| 服務 | URL | 說明 |
|------|-----|------|
| ESGGO 前端 | https://161.118.248.180 | Next.js 15 主應用 (HTTPS) |
| OmniAgent Gateway | https://161.118.248.180/gateway | AI Gateway v3.0 |
| Prometheus | http://161.118.248.180:9090 | 監控數據查詢 |
| Alertmanager | http://161.118.248.180:9093 | 告警管理 |
| Netdata | http://161.118.248.180:19999 | 即時系統監控 |

---

## 一、SSH 登入

### Linux/macOS
```bash
ssh -i ~/.ssh/esggo-vps-key root@161.118.248.180
```

### Windows PowerShell
```powershell
ssh -i C:\Users\Administrator\Downloads\ssh-key-2026-04-25.key root@161.118.248.180
```

---

## 二、PM2 服務管理

```bash
# 查看服務狀態
pm2 list

# ESGGO Core (3000)
pm2 logs esggo-core

# OmniAgent Gateway (8642)  
pm2 logs omniagent-gateway

# 重啟服務
pm2 restart esggo-core
pm2 restart omniagent-gateway

# 效能監控
pm2 monit
```

---

## 三、監控系統

### Prometheus
```bash
# 查看目標狀態
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health=="up") | .labels.job'
```

### Alertmanager
```bash
# 告警規則
cat /etc/prometheus/alerts.yml
```

### Netdata
- 網頁: http://161.118.248.180:19999
- API: http://161.118.248.180:19999/api/v1/info

---

## 四、HTTPS/SSL

### 目前狀態
- 使用自簽證書 (有效 1 年)
- HTTP 80 自動轉向 HTTPS 443

### 更新 HTTPS 配置
```bash
# 修改網站配置
vi /etc/nginx/sites-available/esggo-https.conf
nginx -t && nginx -s reload
```

---

## 五、Telegram 告警

### Bot 資訊
- Token: 從 BotFather 取得（設為環境變數 `TELEGRAM_BOT_TOKEN`）
- Chat ID: 6387287462（設為環境變數 `TELEGRAM_ALERT_CHAT_ID`）

### 測試告警
```bash
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage \
  -d chat_id=${TELEGRAM_ALERT_CHAT_ID} \
  -d text="🚨 測試: ESGGO 告警系統運作中"
```

---

## 六、備份系統

### 觀看備份列表
```bash
bash /root/vps/backup.sh --list
```

### 手動備份
```bash
bash /root/vps/backup.sh
```

### 還原備份
```bash
bash /root/vps/backup.sh restore 20260704
```

### 備份排程 (Cron)
```bash
# 每日 03:00 備份
# 每週日 03:00 完整備份  
# 每月 1 日 03:00 冷備份
crontab -l
```

---

## 七、健康檢查

```bash
# 手動執行
bash /root/vps/configs/health-check.sh

# 或使用已安裝路徑
/usr/local/bin/esggo-health-check
```

---

## 八、防火牆狀態

```bash
ufw status verbose
# 預設允許: 22, 80, 443
```

---

## 九、日誌查詢

```bash
# Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PM2
pm2 logs --lines 100

# Prometheus
journalctl -u prometheus -f

# Netdata
journalctl -u netdata -f
```

---

## 十、故障排除

### Nginx 錯誤
```bash
nginx -t                    # 測試配置
systemctl status nginx      # 查看狀態
```

### PM2 程序下線
```bash
pm2 restart all
pm2 save
pm2 startup                 # 開機自動啟動
```

### 監控服務重啟
```bash
systemctl restart prometheus
systemctl restart prometheus-alertmanager
systemctl restart netdata
```

---

## 十一、Cloudflare CLI

```bash
# 登入 (需 API token)
cf api YOUR_API_TOKEN

# 查看區域
cf zones list

# DNS 記錄
cf dns list --zone YOUR_ZONE_ID
```

---

## 十二、檔案位置索引

```
/etc/nginx/sites-available/      - Nginx 配置
/etc/nginx/ssl/                  - SSL 證書
/etc/prometheus/                 - Prometheus 配置
/etc/alertmanager/alertmanager.yml - 告警規則
/root/vps/                       - 部署腳本目錄
/var/backups/esggo/               - 備份存儲
```

---

## 十三、效能指令速查

```bash
htop              # 系統資源
free -h           # 記憶體
df -h             # 磁碟
uptime            # 負載
ss -tlnp          # 網路端口
```