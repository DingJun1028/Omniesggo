# TODO — 2026-09-30 萬能超覺醒：VPS 架構真相與待修項

> 5T-Traceable: 全部結論來自 `ssh -i ~/.ssh/esggo_original ubuntu@161.118.248.180` 實測，非推測
> 5T-Transparent: 本文件修正了兩條「以為是壞掉、其實是過期架構」的誤判

---

## 一、要更新到記憶的事（記憶已 99% 滿，暫時寫不進去）

### 1.1 ❌ 記憶過期：VPS 不是 PM2 架構

記憶原記「VPS=PM2+nginx+CF」。**實測證偽**：

| 事實 | 證據 |
|---|---|
| PM2 進程表**完全空白** | `pm2 list` 只回 `pm2-logrotate` module，0 個 app |
| 實際 11 個 systemd 單元 | `aistation` / `cloudflared` / `esggo-gateway` / `fail2ban` / `n8n` / `nginx` / `oa-swarm` / `ollama` / `tailscaled` / `iscsid` / `fwupd` |
| 實際 10+ 個 Docker 容器 | `tdai-memory-core`(6d healthy) / `tdai-memory-hub`(10d healthy) / `tdai-proxy`(3w healthy) / `rsshub`(1200) / `moneyprinterturbo-api+webui`(7861/7860) / `deer-flow-gateway`(8001) / `sonarqube`(19000) / `esggo-redis` / `deer-flow-redis` / `sonar-postgres` |

**結論**：PM2 已被 systemd + Docker 完全取代。記憶與技能書中的「PM2 需手動 logrotate」「PM2 reload ecosystem.config.js」等指示**對這台 VPS 已無效**。

- [ ] **記憶更新**（需先騰出 ~250 字元空間）
      - [ ] 把 `VPS=PM2+nginx+CF` 換成 `VPS=161.118.248.180(ubuntu,23.9GB)，架構 systemd+Docker 不用 PM2`
      - [ ] 刪除「PM2需手動logrotate」

### 1.2 新增環境事實

- [ ] `VPS IP = 161.118.248.180`（不是記憶中任何寫法；`154.19.32.109` **連不上**，22 埠逾時）
- [ ] SSH key `C:/Users/dingj/.ssh/esggo_original` 若權限變成 644 → `Permission denied (publickey)`；`chmod 600` 即恢復。**2026-09-30 實測命中此坑**
- [ ] VPS 內 `ssh 'curl 127.0.0.1:PORT'` 對本機埠常回 `000`（curl 在非互動 ssh 下行為異常）；
      改用 `node -e "require('http').get({host:'127.0.0.1',port:P},...)"` 才是準的
- [ ] `systemctl show` 欄位語意：**`NRestarts` = 重啟次數**、**`ExecMainStatus` = exit code**。
      2026-09-30 我誤把 `ExecMainStatus=203` 讀成「重啟 203 次」，實為 exit code 203
- [ ] 憑證到期日：`esggo.co` → **2026-10-28**；`aistation.esggo.co` → **2026-12-25**

---

## 二、待修項（實測發現，皆非緊急）

### P1 · `certbot.service` 續期失敗 ⚠️

- [ ] **現象**：`/etc/letsencrypt/live/esggo.co/fullchain.pem (failure)`，`1 renew failure(s)`，exit 1
- [ ] **現況風險：低** — 憑證有效至 10/28，尚有 28 天；且 `esggo.co` 走 Cloudflare 代理（解析到 104.21.x），
      CF↔origin 這一段不是使用者直觀感受
- [ ] **但 nginx 實際用的是** `aistation.esggo.co` 憑證（12/25 到期，健康）→ 優先釐清為何續的是 esggo.co
- [ ] 排查：`sudo certbot renew --dry-run` 完整輸出（本次 grep 過濾後為空，需看全文）
- [ ] 注意：Memory 有 `esggo-omni-vps-certbot` / `esggo-omni-vps-cloudflare-dns` 可用

### P2 · `tdai-memory.service` 殘留過期單元

- [ ] **現象**：`loaded failed failed`，`ExecMainStatus=203`、`Restart=no`、**`NRestarts=0`**、
      最後啟動 2026-08-31 12:57、`journalctl` 僅 1 條
- [ ] **判定：非故障，是殘留**。三層棧已由 3 個 healthy 容器接管
      （`tdai-memory-core` 6d / `tdai-memory-hub` 10d / `tdai-proxy` 3w）
- [ ] 處置選項：
      - [ ] A. `sudo systemctl disable --now tdai-memory.service`（停止 failed 噪音）
      - [ ] B. 保留但加註解（若未來要回復原架構）
- [ ] ⚠️ **不要刪 `/opt/esggo/apps/tencentdb-memory/`** —— 尚未確認是否仍被其他流程引用

### P3 · `esggo-gateway.service` 的 watchdog 迴圈寫法脆弱

- [ ] 單元內容是 `while true; do docker ps --filter name=omniagent-gateway ...; sleep 30; ...`
      —— 這是 shell watchdog，不是原生 healthcheck
- [ ] 建議改為 `docker restart unless-stopped` 讓 Docker 自己管，或確認 watchdog 邏輯在 container 改名後會失效

---

## 三、P1 · CPU 飽和（資源層覺醒新增）

**實測數據**（`cores=4`，`top` 二次採樣）：

| 指標 | 值 | 判讀 |
|---|---|---|
| load average | **8.89 / 7.87 / 6.39** | 對 4 核 = **過載 2.2 倍** |
| `%Cpu` | us 69.0 · **sy 30.4** · id **0.2** · wa 0.0 | CPU 真飽和，但**非 I/O 瓶頸** |
| 佔用者 | `llama-server` **209% CPU**、父 = `ollama serve`(pid 462390) | 純 CPU 推論 |
| 模型 | `nomic-embed-text:latest`，`size_vram=0.0GB` | **GPU 未使用** |
| 呼叫方 | `pid 745322`（`node --import tsx src/gateway/server.ts` = esggo-gateway / TDAI 記憶層） | 記憶層在算 embedding |
| 容器資源 | 全部 < 1% CPU，最大 `tdai-memory-core` 0.97% | 容器**不是**元凶 |
| 記憶體 | 16.5 GB free；`dockerd` 3.3GB 為最大單項 | **無洩漏** |
| 硬體 | **無 NVIDIA GPU** | CPU 推論是必然結果，非設定錯誤 |

**結論：這是正常運作，不是故障。** 但有兩個可優化點：

- [ ] **P1-a** `llama-server` 已燒 **21:56 CPU 時間**且持續 209% — 若 TDAI 記憶層的 embedding 呼叫
      不是必要的即時路徑，可考慮降低頻率或改用更小的 embedding 模型
- [ ] **P1-b** `sy 30.4%` 系統時間偏高（`dockerd` 172.7% / 13d+8h CPU 時間）。
      dockerd 長時間高 sys 常與**容器數量 + 日誌量**相關，目前 12 個容器
- [ ] 註：`esggo-redis` 記憶體僅 **1.68 MiB** — 若這是期望中的快取，容量可能過小，值得確認

---

## 四、本輪未觸碰的項目（承接上一輪）

- [ ] **PR #1199** 仍 `OPEN` / `MERGEABLE` / `UNSTABLE`（32 pass，3 fail 全為 Cloudflare 端孤兒綁定）
- [ ] Cloudflare 孤兒綁定待你手動停用：`esggo-worker` / `oa` / `wrangler-deploy`（**勿停 `esggo`**）
