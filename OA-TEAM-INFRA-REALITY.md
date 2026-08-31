# OA-Team 基礎設施真實資產盤點（Infrastructure Reality Inventory）

> 生成日期：2026-08-18
> 生成方式：oci CLI 實查 + SSH 實查 + 檔案系統掃描（非口號，非宣告）
> 5T 原則：Traceable（每條有查證來源）· Trackable（可複查）· Trustworthy（只記實測）

## 0. 目的

過去多個 session 出現「Soul 35/36/37/38 …」等狀態宣告，與雲端實際資源對不上。
本文件是**唯一事實來源**：把 Soul 編號（01-60）與真實存在的資產一一對齊，
標記「已落地（verified）」或「幻影（phantom，查無實體）」，杜絕口號式宣告。

---

## 1. 真實硬體（oci CLI 實查）

| 實例 | 形狀 | OCPU | 記憶體 | 狀態 | 公網 IP |
|------|------|------|--------|------|---------|
| esggo-vps | VM.Standard.A1.Flex (ARM) | 4 | 24GB | RUNNING | 161.118.248.180 |
| oa-worker-01 | VM.Standard.A1.Flex (ARM) | 1 | 6GB | RUNNING | （內網） |

- 兩台都在 `AP-SINGAPORE-1-AD-1` 單一可用性網域
- **AMD E2.Micro 實例數 = 0**（已實查，無此資源）
- 免費 ARM 額度：used 5 OCPU，尚有餘裕

---

## 2. Soul 編號 ↔ 真實資產對照（光系蜂后隊 31-60 = OA-VPS）

> 編號體系沿用 `OA-TEAM-60-MEMORY-MAPPING.md`：蜂王隊 01-30（本地 umbra）、蜂后隊 31-60（VPS lumen）。
> 下方只列「有對應到實體或宣告」的編號，其餘編號目前無獨立實體（為邏輯角色，非硬體節點）。

| Soul 編號 | 代理角色（mapping） | 對應真實資產 | 狀態 |
|-----------|---------------------|--------------|------|
| 35 | 蜂后萬能風險蜂 (Sentinel) | `omniagent-gateway` 容器（Up 10h healthy）+ `esggo-gateway.service` | ✅ 已落地（但無 `soul35.service` 這個名字） |
| 36 | 蜂后萬能優化蜂 (Alchemist) | `.github/workflows/auto-repair.yml`（OA-TWINS Auto-Repair） | ✅ 已落地（但名為 OA-TWINS，非 soul36） |
| 37 | 蜂后萬能編碼蜂 (Smith) | （宣稱 AMD E2.Micro keep-alive） | ❌ 幻影（帳號 0 台 AMD） |
| 38 | 蜂后萬能算法蜂 (Depth) | （宣稱 AMD keep-alive） | ❌ 幻影（同上） |
| 30 | 萬能質控蜂 (Seal) | 無獨立實體 | ⚪ 邏輯角色 |
| 40 | 蜂后萬能數據蜂 (Weaver) | 無獨立實體 | ⚪ 邏輯角色 |

---

## 3. 真實容器（VPS docker ps 實查，18 個）

| 容器 | 狀態 |
|------|------|
| omniagent-gateway | Up 10 hours (healthy) |
| oa-swarm | Up 20 hours |
| rsshub | Up 27 hours |
| sonar-postgres | Up 27 hours |
| esggo-redis | Up 2 days (healthy) |
| portainer | Up 2 days |
| tdai-proxy | Up 2 days (healthy) |
| tdai-memory-hub | Up 2 days (healthy) |
| tdai-memory-core | Up 46 hours (healthy) |
| minio | Up 2 days |
| sonarqube | Up 2 days |
| hermes-webui | Up 2 days (healthy) |
| deer-flow-nginx | Up 2 days (healthy) |
| deer-flow-gateway | Up 2 days (healthy) |
| deer-flow-frontend | Up 2 days |
| deer-flow-redis | Up 2 days (healthy) |
| watchtower | Up 2 days (healthy) |
| uptime-kuma | Up 2 days (healthy) |
| filebrowser | Up 2 days (healthy) |

24/7 自癒機制：靠 Docker `--restart` 政策 + `watchtower`（自動更新），
**非** `soul35_watch.sh` + `soul35.service`（後者查無此物）。

---

## 4. 真實 GitHub Workflows（19 個）

| 檔案 | 名稱/用途 |
|------|-----------|
| ci.yml | 主 CI |
| auto-repair.yml | OA-TWINS Auto-Repair（CI 失敗時自動修復 + PR） |
| deploy.yml / deploy-oracle.yml / deploy-vercel.yml | 部署 |
| deploy-worker.yml | Worker 部署 |
| vps-8642-onetime.yml / vps-8642-direct.yml / vps-ssh-diagnose.yml | VPS 診斷/直連 |
| crewai-run.yml | CrewAI |
| security-audit.yml | 安全掃描 |
| oci-launch-vps.yml | OCI 開機 |
| learning-center-ci.yml | 學習中心 CI |
| deploy-deerflow.yml | DeerFlow 部署 |
| build.yml | 建構 |
| sacred-pipeline.yml | 聖管線 |
| test-dispatch.yml | 測試分派 |
| check-design.yml | 設計檢查 |

---

## 5. 真實網路路徑

| 路徑 | 狀態 |
|------|------|
| SSH tunnel：本機 localhost:11435 → VPS 11434（Ollama） | ✅ 常駐（腳本 `~/ollama_tunnel.sh`） |
| Cloudflare Tunnel：esggo.co / ftg / translate | ✅ 運作中 |
| Cloudflare：ollama.esggo.co | ⚠️ DNS 記錄 404（CNAME 未生效，需 CF token 或手動修） |
| Ollama 模型：qwen2.5:3b (3.0 tok/s) / gemma4:e4b / nomic-embed | ✅ 可用（CPU-only） |

---

## 6. 結論

1. **Soul 編號體系是真的**（repo 已有 60 代理 mapping），但**不要用編號當硬體節點**——30/60 是「角色數」，不是「機器數」。
2. 真實硬體 = **2 台 ARM**，不是 30 台。
3. 凡宣告「Soul N = 某硬體/服務」，一律先查本表對應真實資產，查無即標「幻影」。
4. 後續任何 session 若貼「Soul 狀態」，必須能回溯到本表某一列的 verified 實體，否則不採信。
