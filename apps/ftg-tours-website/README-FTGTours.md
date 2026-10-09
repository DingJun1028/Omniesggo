# 🌿 FTG Tours 官網部署說明

## 網站資訊
- **正式網址**: https://ftgtours.esggo.co  
- **VPS**: 161.118.248.180 (Ubuntu + Nginx)  
- **CDN**: Cloudflare Tunnel (esggo-tunnel)  

## 快速部署

### 1. 本地建置
```bash
cd ~/ftg-tours-website
pnpm install
pnpm run build
```

### 2. 打包與上傳
```bash
rm -f dist.tar.gz
tar -czf dist.tar.gz -C dist .
scp -i "C:/Project/ESGGO VPS/id_rsa_esggo_real" -o StrictHostKeyChecking=no dist.tar.gz ubuntu@161.118.248.180:/tmp/
```

### 3. VPS 部署
```bash
ssh -i "..." ubuntu@161.118.248.180 \
  "cd /var/www/ftgtours && sudo rm -rf * && sudo tar -xzf /tmp/dist.tar.gz && sudo chown -R www-data:www-data * && echo '✅ DEPLOY OK'"
```

### 4. 清除 Cloudflare 快取
前往 [dash.cloudflare.com](https://dash.cloudflare.com) → **Caching** → **Purge Cache** → **Purge Everything**

## 驗證
- **網站狀態**: `curl -sI https://ftgtours.esggo.co/` → 顯示 `200 OK`  
- **價值圖片**: `curl -s https://ftgtours.esggo.co/ | grep 'value-'` → 應返回 3 張  
- **Cloudflare Tunnel**: `cloudflared tunnel list` → `esggo-tunnel` 顯示 `HEALTHY`

## 價值主張圖片
| 標題 | 文件 | 說明 |
|------|------|------|
| 親近自然 | `value-nature.webp` | 團隊在台灣山林海岸 |
| 連結地方 | `value-local.webp` | 團隊與當地文化互動 |
| 照顧員工 | `value-team.webp` | 團隊在山峰信任活動 |

## GitHub Actions CI
- **Workflow**: `.github/workflows/ci.yml`  
- **分支**: `main`  
- **部署**: 推送到 `main` 分支自動觸發 Build  
