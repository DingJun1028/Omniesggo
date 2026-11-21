# 萬能藍圖中心 — VPS 建設 Runbook

> 目標：將 Omni-Blueprint Hub 部署至 VPS (161.118.248.180) 並通過端對端驗證

## 階段 0：SSH 通道修復（必須先做）
VPS 端本機執行（控制台/其他通道）：
```bash
cat ~/.ssh/esggo_original.pub >> ~/.ssh/authorized_keys
chmod 644 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
sudo systemctl restart sshd
# 驗證：從本機 ssh -i ~/.ssh/esggo_original git@161.118.248.180 'echo OK'
```

## 階段 1：本地產物確認（已完成）
- core-types.ts / hub-engine.ts / hub-demo.ts（5T + IComponentCore + 單一資料表）
- monitor-server.mjs / translate.mjs / captions-scraper.mjs（轉播服務）
- deploy.sh / ecosystem.config.cjs / .env.example
- 型別檢查 0 錯誤，tsx 實際執行通過

## 階段 2：一鍵部署
```bash
cd apps/omni-blueprint-hub
bash deploy.sh
```
流程：語法檢查 → 本機煙霧測試 → rsync → pm2 重啟 → 公網驗證

## 階段 3：公網驗證
- 講者端: https://live.esggo.co/studio.html
- 觀眾端: https://live.esggo.co/stream?src=studio
- 健康:   https://live.esggo.co/healthz

## 階段 4：藍圖產品綁定 Akkadu
- 指定轉播網址: https://esggo.app/live-sync?host=lecturer-a&source=akkadu_kxxf&token=5T-AKKADU-A89F
- 來源: https://akkadu.ai/live/kxxf

---
*Hash Lock 已啟用 | 見證：OA-Team 30 萬能蜂群*
