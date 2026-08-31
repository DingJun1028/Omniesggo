# 執行指令卡 · 授權進行 (123)

> 代理層規劃 + 產生指令. 執行: 用戶本機 / VPS 終端 (Docker 沙箱不掛 .ssh / secret-vault, 代理無法代跑).

## ① VPS 部署 (ftg 圖 + Ollama proxy)
```bash
# 本機 PowerShell (SCP 進 VPS)
# ftg 官方圖同步
scp -i ~/.ssh/esggo_original -r "C:\Project\esggo\apps\ftg-3.0\public\images\esg-impact-note\*" ubuntu@161.118.248.180:/var/www/ftg.esggo.co/images/esg-impact-note/
# ftg index.html (若 VPS 用 git pull 則跳過, 直接 VPS git pull)
ssh -i ~/.ssh/esggo_original ubuntu@161.118.248.180 "cd /var/www/ftg.esggo.co && git pull origin main"
# Ollama proxy 部署
scp -i ~/.ssh/esggo_original -r "C:\Project\esggo\vps\ollama-proxy" ubuntu@161.118.248.180:/opt/ollama-proxy
ssh -i ~/.ssh/esggo_original ubuntu@161.118.248.180 "cd /opt/ollama-proxy && pip install fastapi uvicorn httpx && OLLAMA_PROXY_KEY=<從聖櫃讀> OLLAMA_BACKEND=http://127.0.0.1:11434 nohup uvicorn app:app --host 0.0.0.0 --port 11435 > /var/log/ollama-proxy.log 2>&1 &"
```

## ② VPS probe (NemoClaw 自託管 ARM 確認)
```bash
# VPS 終端 (ssh ubuntu@161.118.248.180)
df -h / && free -h                    # 確認空間 (81%/99% 風險)
sudo fallocate -l 8G /swapfile2 && sudo chmod 600 /swapfile2 && sudo mkswap /swapfile2 && sudo swapon /swapfile2   # 加 swap 防 OOM
curl -fsSL https://www.nvidia.com/nemoclaw.sh | bash   # 裝 NemoClaw CLI
export PATH="$HOME/.local/bin:$PATH"
nemoclaw host probe                    # 只讀 readiness (ARM/Docker/RAM/disk)
docker info | head -3                  # 確認 docker daemon
uname -m                                # 確認 aarch64
```
→ 貼 probe 結果回聊天, 代理決策是否 `nemoclaw onboard`.

## ③ 金鑰入聖櫃 (GUI, 本機)
1. 檔案總管開 `C:\Users\dingj\secret-vault\ENV20230818.env`
2. 記事本開啟, 末行加 `變數名=值` (例: `BREV_API_KEY=***`)
3. Ctrl+S
4. 告代理「變數名 + 用了哪把值」(GO65J4JP4WJJ6J4XOZ4 / FVU06 / BGJ 選一), 記錄保管完成.

## ④ Brev GPU (花錢, 可選)
```bash
# WSL Ubuntu
export PATH="$HOME/.local/bin:$PATH"
brev login          # 瀏覽器登入 + 綁卡
brev create         # 選 GPU 實例
```
