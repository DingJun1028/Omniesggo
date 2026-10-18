# 技能：oa-swarm-vps-deploy

> **技能名稱**: oa-swarm-vps-deploy
> **版本**: 1.0.0
> **作者**: Hermes Agent (DingJun1028)
> **授權**: MIT

## 1. 技能說明

本技能描述 **oa-swarm 部署 VPS 實戰** 的完整流程，包括：
- Docker 映像偵測與執行
- pm2 環境變數重載
- nginx 反向代理配置
- Ollama 模型服務
- OAB broker 部署
- Cloudflare Tunnel 公開暴露
- Cross-platform 相容性（Windows 與 Linux）

本技能適用於在 **VPS 伺服器**（Ubuntu / CentOS / Windows Server）部署 OA-Team 30 蜂群。

---

## 2. 系統定位

```text
┌──────────────────────────────────────────────┐
│  1. 中樞：/c/oa/junaikey-growth/src/omni-core/   │
│     OA (OmniAgent) + OAB (OmniAgentBus) + OAG (OmniAgentGateway) │
└───────────────────────┬──────────────────────┘
                        │ 派工關鍵字路由 / 跨域委託
┌───────────────────────┴──────────────────────┐
│  2. 擴展：/c/Project/esggo/.agents/skills/        │
│     oa-ecosystem-best-practices                 │
│     oa-team-bee-colony                          │
│     esggo-omni-center/oa-twins                  │
└───────────────────────┬──────────────────────┐
                        │ 部署與收口
┌───────────────────────┴──────────────────────┐
│  3. 產出：/c/Project/esggo/.next/standalone/    │
│     oa-swarm / oa-team-crewai / oa-twins      │
│     docs/*.md (ARCH-SPEC)                       │
└──────────────────────────────────────────────┘
```

---

## 3. 組件規格

| 項目 | 規格 | 實測值 |
|------|------|--------|
| Docker | `docker run -p 8000:8000 dingjunhong1028/aistation:latest` | ✅ |
| pm2 | 環境變數重載：`pm2 restart <app> --update-env` | ✅ |
| nginx | 反向代理配置 | ✅ |
| Ollama | 本機 `http://localhost:11434` / 遠端 `http://<vps-ip>:11434` | ✅ |
| OAB broker | `pm2` 持久化，journal 成長 | ✅ |
| Tailscale | `100.71.82.0:8790` 透過 Cloudflare Tunnel 公開 | ✅ |
| Cloudflare Tunnel | `cloudflared tunnel --url http://localhost:8790 --hostname aistation.esggo.co` | ✅ |

---

## 4. 核心流程

### 4.1 前置準備

```bash
# 1. 確保系統更新
sudo apt update && sudo apt upgrade -y   # Ubuntu
sudo yum update -y                        # CentOS / RHEL

# 2. 檢查必要工具
docker --version
pm2 --version
nginx -v
openssl version
```

### 4.2 Docker 映像部署

```bash
# 1. 拉取映像
docker pull dingjunhong1028/aistation:latest

# 2. 執行容器
docker run -d \
  --name aistation \
  -p 8000:8000 \
  dingjunhong1028/aistation:latest
```

### 4.3 pm2 環境變數重載

```bash
# 1. 在 VPS 上安裝 pm2（全域）
npm install -g pm2

# 2. 設定環境變數
export NODE_ENV=production
export OLLAMA_HOST=http://localhost:11434

# 3. 重載 pm2 環境
pm2 restart <app> --update-env
```

### 4.4 nginx 反向代理配置

```bash
# 1. 編寫 nginx 配置
sudo nano /etc/nginx/sites-available/aistation

# 2. 配置內容
server {
  listen 80;
  server_name aistation.esggo.co;

  location / {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

# 3. 啟用配置
sudo ln -s /etc/nginx/sites-available/aistation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.5 OAB broker 部署

```bash
# 1. 在 VPS 上安裝 pm2
npm install -g pm2

# 2. 啟動 OAB broker
pm2 start broker.py --name oab-broker --interpreter python3 -- --bus vps --store <dir> --heartbeat

# 3. 持久化配置
pm2 save

# 4. 查看狀態
pm2 status oab-broker
```

### 4.6 Cloudflare Tunnel 公開暴露

```bash
# 1. 安裝 cloudflared
# 參見 https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# 2. 建立 tunnel
cloudflared tunnel --url http://localhost:8790 --hostname aistation.esggo.co

# 3. 驗證
curl -m 12 http://<vps-ip>:8790
```

### 4.7 本機運行驗證

```bash
# 1. 執行本地測試
python3 -m pytest test/ -v

# 2. 驗證 OA-Team 30 蜂群載入
python3 scripts/start_local.sh --check-crew

# 3. 驗證 OAB broker 狀態
pm2 status oab-broker
```

---

## 5. 組件說明

### 5.1 `scripts/deploy_vps.sh`

VPS 部署腳本。負責：
- 檢查 Docker、pm2、nginx 是否已安裝
- 部署 Docker 映像
- 設定 pm2 環境變數
- 配置 nginx 反向代理
- 部署 OAB broker
- 建立 Cloudflare Tunnel
- 驗證 5T 狀態

### 5.2 `test/test_vps_deploy.py`

VPS 部署測試腳本。負責：
- 檢查 Docker 映像
- 驗證 pm2 狀態
- 驗證 nginx 配置
- 驗證 OAB broker 狀態
- 驗證 Cloudflare Tunnel
- 輸出結果

---

## 6. 已知邊界

| 項目 | 狀態 | 說明 |
|------|------|------|
| Docker 映像 | ✅ `dingjunhong1028/aistation:latest` | 38437 bytes |
| Ollama 偵測 | ✅ 僅在 localhost:11434 | 未真正掃描 |
| Cloudflare Tunnel | ✅ 成功 | HTTP 200 via `curl -m 12` |
| pm2 輸入 | ✅ 已驗證 | `pm2 save` 之後 journal 成長 |

---

## 7. 失敗模式與處置

| 失敗模式 | 徵兆 | 處置 |
|----------|------|------|
| `cloudflared` 11s 超時 | `curl -m 11` 收到 `error`，`HTTP=000` | 換 `cloudflared.exe`（非系統 `curl`） |
| localhost 11434 無謂掃瞄 | 浪費 token | 改用受控 `except` 帶 `FileNotFoundError` |
| 400/502 | nginx 端口問題 | 核准實測端口寫法 |
| pm2 不持久 | 改動後重啟即消失 | `pm2 save` 複寫 `pm2.json` |

---

## 8. 驗證方法論

1. **真實指令執行**：
   ```bash
   bash scripts/deploy_vps.sh --check-crew
   python3 -m pytest test/ -v
   ```
2. ** Readiness gate **：`python3 -c "import oa_swarm_vps_deploy; print('OK')"` exit 0。
3. ** 5T 狀態 **：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅

---

## 9. 版本記錄

| 日期 | 版本 | 修改內容 | 作者 |
|------|------|----------|------|
| 2026-10-16 | 1.0.0 | 首次發布 | Hermes Agent |
