# NemoClaw 自託管 VPS 路徑 · 只読 Probe 指令卡

> 使用者授權: 自託管 NemoClaw (FEAT HERMES). 路徑: Oracle VPS (161.118.248.180, Ubuntu 24.04 aarch64 ARM).
> 代理層職責: 規劃 + 產生指令. 執行: 使用者 VPS 終端 (Docker 沙箱不掛 .ssh, 代理無法代跑 SSH).

## ⚠️ 前置風險 (誠實)
- VPS 是 **aarch64 / ARM**. NemoClaw 官方 Tested 主要是 x86_64, ARM 可能 limited → 需 probe 確認.
- VPS 現狀: 根目錄 81% + swap 99% → **probe 前先確認空間**, 否則 image push 觸發 OOM.
- NemoClaw `ollama-proxy` 會接管 Ollama → 你 VPS 正跑 Ollama (TencentDB 8420). 衝突需評估.

## Step 0: 清理空間 (先跑, 避免 OOM)
```bash
# VPS 終端 (ssh ubuntu@161.118.248.180)
df -h /                          # 確認根目錄使用率
free -h                         # 確認 swap/mem
# 若根目錄 >85%: 清 apt / 清 docker / 加 swap
sudo apt clean
docker system prune -f         # 清懸空 image (不影響執行容器)
# 加 8GB swap (官方建議 <8GB RAM 機器)
sudo fallocate -l 8G /swapfile2 && sudo chmod 600 /swapfile2 && sudo mkswap /swapfile2 && sudo swapon /swapfile2
```

## Step 1: 安裝 NemoClaw CLI (自託管路線, 不是 Brev)
```bash
# VPS 終端 (Ubuntu 24.04)
curl -fsSL https://www.nvidia.com/nemoclaw.sh | bash
# 安裝完會自動觸發 nemoclaw onboard, 或手動:
# export PATH="${HOME}/.local/bin:${PATH}"
# nemoclaw onboard
```

## Step 2: 只読 Probe (不裝 sandbox, 不変系統)
```bash
export PATH="${HOME}/.local/bin:${PATH}"
nemoclaw host probe          # 若支持: 只讀 readiness 檢查 (ARM/Docker/RAM/disk)
# 或退而求其次:
docker info 2>&1 | head -5  # 確認 docker daemon 可達
uname -m                     # 確認 aarch64
nproc && free -h             # CPU/RAM
```

## Step 3: 決策點 (probe 后)
- 若 probe 報 ARM unsupported → 放棄 VPS 自託管, 改 Brev 云 (GPU) 或本機 WSL2.
- 若 probe OK → `nemoclaw onboard` 裝 OpenShell + 沙箱 (會動 Ollama, 需先評估).
- **不擅自跑 onboard** → 回報 probe 結果給使用者決策.

## 回滾
- 安裝失敗/不需: `nemoclaw uninstall --yes` (預設保留 sandboxes.json/backups).
- 清空間: `sudo swapoff /swapfile2 && sudo rm /swapfile2`.
