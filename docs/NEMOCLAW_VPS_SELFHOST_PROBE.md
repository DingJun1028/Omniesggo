# NemoClaw 自托管 VPS 路径 · 只読 Probe 指令卡

> 用户授权: 自託管 NemoClaw (FEAT HERMES). 路径: Oracle VPS (161.118.248.180, Ubuntu 24.04 aarch64 ARM).
> 代理层职责: 规划 + 产生指令. 执行: 用户 VPS 终端 (Docker 沙箱不掛 .ssh, 代理无法代跑 SSH).

## ⚠️ 前置风险 (诚实)
- VPS 是 **aarch64 / ARM**. NemoClaw 官方 Tested 主要是 x86_64, ARM 可能 limited → 需 probe 确认.
- VPS 现状: 根目录 81% + swap 99% → **probe 前先确认空间**, 否则 image push 触发 OOM.
- NemoClaw `ollama-proxy` 会接管 Ollama → 你 VPS 正跑 Ollama (TencentDB 8420). 冲突需评估.

## Step 0: 清理空间 (先跑, 避免 OOM)
```bash
# VPS 终端 (ssh ubuntu@161.118.248.180)
df -h /                          # 确认根目录使用率
free -h                         # 确认 swap/mem
# 若根目录 >85%: 清 apt / 清 docker / 加 swap
sudo apt clean
docker system prune -f         # 清悬空 image (不影响运行容器)
# 加 8GB swap (官方建议 <8GB RAM 机器)
sudo fallocate -l 8G /swapfile2 && sudo chmod 600 /swapfile2 && sudo mkswap /swapfile2 && sudo swapon /swapfile2
```

## Step 1: 安装 NemoClaw CLI (自托管路线, 不是 Brev)
```bash
# VPS 终端 (Ubuntu 24.04)
curl -fsSL https://www.nvidia.com/nemoclaw.sh | bash
# 安装完会自动触发 nemoclaw onboard, 或手动:
# export PATH="${HOME}/.local/bin:${PATH}"
# nemoclaw onboard
```

## Step 2: 只読 Probe (不装 sandbox, 不変系统)
```bash
export PATH="${HOME}/.local/bin:${PATH}"
nemoclaw host probe          # 若支持: 只读 readiness 检查 (ARM/Docker/RAM/disk)
# 或退而求其次:
docker info 2>&1 | head -5  # 确认 docker daemon 可达
uname -m                     # 确认 aarch64
nproc && free -h             # CPU/RAM
```

## Step 3: 决策点 (probe 后)
- 若 probe 报 ARM unsupported → 放弃 VPS 自托管, 改 Brev 云 (GPU) 或本机 WSL2.
- 若 probe OK → `nemoclaw onboard` 装 OpenShell + 沙箱 (会动 Ollama, 需先评估).
- **不擅自跑 onboard** → 回报 probe 结果给用户决策.

## 回滚
- 安装失败/不需: `nemoclaw uninstall --yes` (默认保留 sandboxes.json/backups).
- 清空间: `sudo swapoff /swapfile2 && sudo rm /swapfile2`.
