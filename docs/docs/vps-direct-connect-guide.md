# 🌌 VPS 直連指南

> **主機：** 161.118.248.180
> **作業系統：** Linux (Ubuntu/Debian)
> **用途：** ESG GO 生產環境 + OmniAgent 運行

---

## 📋 快速連接

### SSH 連接
```bash
ssh root@161.118.248.180
```

### 帶端口連接（如果 SSH 不是 22）
```bash
ssh -p <端口> root@161.118.248.180
```

### 使用密鑰連接
```bash
ssh -i ~/.ssh/your_key root@161.118.248.180
```

---

## 🔧 連接後基本操作

### 檢查系統狀態
```bash
# 系統資訊
uname -a
cat /etc/os-release

# 磁碟空間
df -h

# 記憶體使用
free -h

# CPU 資訊
lscpu
```

### 檢查服務狀態
```bash
# PM2 進程管理
pm2 list
pm2 status

# Docker 容器
docker ps
docker compose ls

# Nginx 狀態
systemctl status nginx
nginx -t
```

---

## 🚀 部署操作

### 一鍵部署
```bash
# 進入項目目錄
cd /var/www/esggo

# 執行部署腳本
bash vps/deploy-omni.sh
```

### 手動部署步驟
```bash
# 1. 拉取最新代碼
cd /var/www/esggo
git pull origin main

# 2. 安裝依賴
pnpm install

# 3. 構建
pnpm build

# 4. 重啟服務
pm2 restart ecosystem.config.cjs
# 或
pm2 restart all
```

### Docker 部署
```bash
# 進入 Docker 目錄
cd /var/www/esggo/vps

# 構建並啟動
docker compose up -d --build

# 查看日誌
docker compose logs -f
```

---

## 📊 服務端口一覽

| 服務 | 端口 | 說明 |
|------|------|------|
| App (Next.js) | 3000 | 主應用服務 |
| Gateway (OmniAgent) | 8642 | AI 代理網關 |
| Redis | 6379 | 快取/會話 |
| Nginx | 80/443 | 反向代理 |
| SSH | 22 | 遠端連接 |

---

## 🔍 日誌查看

### PM2 日誌
```bash
# 查看所有日誌
pm2 logs

# 查看特定服務
pm2 logs esggo-app
pm2 logs omniagent-gateway

# 查看錯誤日誌
pm2 logs --err

# 實時監控
pm2 monit
```

### Docker 日誌
```bash
# 查看容器日誌
docker compose logs -f gateway
docker compose logs -f app

# 查看最近 100 行
docker compose logs --tail 100
```

### Nginx 日誌
```bash
#存取日誌
tail -f /var/log/nginx/access.log

# 錯誤日誌
tail -f /var/log/nginx/error.log
```

### 系統日誌
```bash
# 系統錯誤
journalctl -xe

# Nginx 相關
journalctl -u nginx
```

---

## 🛠️ 常見問題排查

### 服務無法啟動
```bash
# 檢查端口是否被佔用
lsof -i :3000
lsof -i :8642
lsof -i :6379

# 檢查進程
ps aux | grep node
ps aux | grep nginx
```

### 連接超時
```bash
# 檢查防火牆
ufw status
iptables -L

# 檢查 Nginx 配置
nginx -t
cat /etc/nginx/sites-enabled/esggo
```

### 記憶體不足
```bash
# 查看記憶體使用
free -h
top -bn1 | head -20

# 清理緩存
sync && echo 3 > /proc/sys/vm/drop_caches
```

### 磁碟空間不足
```bash
# 查看磁碟使用
du -sh /var/www/*
du -sh /var/log/*

# 清理日誌
find /var/log -name "*.log" -mtime +30 -delete

# 清理 Docker
docker system prune -a
```

---

## 🔐 安全操作

### 防火牆設定
```bash
# 查看規則
ufw status verbose

# 開放端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# 重載
ufw reload
```

### SSL 證書
```bash
# 檢查證書
certbot certificates

# 更新證書
certbot renew

# 強制更新
certbot renew --force-renewal
```

### 修改 SSH 設定
```bash
# 編輯設定
nano /etc/ssh/sshd_config

# 重啟 SSH
systemctl restart sshd
```

---

## 📦 備份與恢復

### 備份數據庫
```bash
# PostgreSQL
pg_dump -U username dbname > backup_$(date +%Y%m%d).sql

# Redis
redis-cli BGSAVE
```

### 備份配置
```bash
# 備份 Nginx
tar -czf nginx_backup_$(date +%Y%m%d).tar.gz /etc/nginx/

# 備份 PM2
pm2 save
```

### 恢復
```bash
# 恢復數據庫
psql -U username dbname < backup_20260706.sql

# 恢復 PM2
pm2 resurrect
```

---

## 🔄 Git 操作

### 在 VPS 上更新代碼
```bash
cd /var/www/esggo

# 拉取最新
git fetch origin
git pull origin main

# 查看變更
git log --oneline -5
git status
```

### 回滾版本
```bash
# 回滾到特定提交
git reset --hard <commit-hash>

# 重啟服務
pm2 restart all
```

---

## 📞 緊急聯繫

### 服務完全無法訪問
1. 檢查 `pm2 list` 或 `docker ps`
2. 檢查 Nginx：`systemctl status nginx`
3. 檢查端口：`netstat -tlnp`
4. 檢查防火牆：`ufw status`

### 資料丟失
1. 檢查備份：`ls /var/backups/`
2. 恢復數據庫
3. 聯繫管理員

---

## 📝 常用別名（可加入 ~/.bashrc）

```bash
# 快速進入項目
alias esg='cd /var/www/esggo'

# 快速查看服務
alias spm='pm2 list'
alias sdw='docker compose ps'

# 快速部署
alias deploy='cd /var/www/esggo && bash vps/deploy-omni.sh'

# 快速查看日誌
alias lg='pm2 logs'
alias ldw='docker compose logs -f'
```

---

*最後更新：2026-07-06*
*維護者：JunAiKey*
