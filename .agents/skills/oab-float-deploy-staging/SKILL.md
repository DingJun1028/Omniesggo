---
name: oab-float-deploy-staging
description: "OAB daemon + float voice-fix staging and run-log relay."
version: 1.0.0
author: Hermes Agent (DingJun1028)
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [oa, oab-broker, float-voice-fix, staging, run-log-relay]
---

# OAB Float 部署與 staging / run-log relay

## 1. 系統定位（OAB 與浮動修復域）

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

## 2. 組件規格（OAB 與浮動修復域）

| 項目 | 規格 | 實測值 |
|------|------|--------|
| OAB broker | `pm2 start broker.py --name oab-broker --interpreter python3 -- --bus vps --store <dir> --heartbeat` | ✅ |
| float voice-fix | `voice-fix` 任務於 `staging` 環境執行，並 relay run-log 至 `run-log` 目標 | ✅ |
| run-log relay | 把 staging 的 run-log 送往 `run-log` 端點 | ✅ |
| webhook | `X-AI-Station-Key` + `hmac.compare_digest` | ✅ |
| 路徑穿越防護 | `resolve(path)` 後確認在 `/storage` 內 | ✅ |

---

## 3. 關鍵設計決策

### ADR-01：OAB daemon 永遠用 pm2
**決策**：`python3 -u broker.py --heartbeat` 於前景正常寫 journal；nohup/setsid 會使 asyncio 事件循環停滯。
**理由**：`nohup ... &` 導致事件循環停止。
**後果**：pm2 是唯一被驗證的持久執行方式。

### ADR-02：float voice-fix 於 staging 環境執行
**決策**：`float` 修復任務於 `staging` 環境執行，並靠 run-log relay 持續回寫。
**理由**：staging 最佳化後，float voice-fix 任務可同時觸發並送信。
**後果**：float voice-fix 任務可同時觸發並送信。

### ADR-03：staging 部署為單例，對外提供回退閘
**決策**：staging 部署為單例操作；`run-log` 目標在收到後觸發垂直回退。
**理由**：避免多個 staging 環境撞覆。
**後果**：閘門可單例獨立。

---

## 4. 已知邊界

| 項目 | 狀態 | 說明 |
|------|------|------|
| OAB daemon | ✅ 已驗證 | `pm2 list` 在線，journal 成長 |
| float voice-fix | ✅ 已驗證 | `voice-fix` 任務於 staging 執行 |
| run-log relay | ✅ 已驗證 | run-log 送往 `run-log` 端點 |
| webhook 認證 | ✅ 已驗證 | `hmac.compare_digest` |
| 路徑穿越防護 | ✅ 已驗證 | `resolve` 後確認在 `/storage` |

---

## 5. 失敗模式與處置

| 失敗模式 | 徵兆 | 處置 |
|----------|------|------|
| OAB daemon 停機 | `pm2 list` 看不到 | `pm2 start broker.py --name oab-broker` |
| run-log relay 失敗 | `run-log` 端點無回應 | 檢查 `X-AI-Station-Key` + `hmac.compare_digest` |
| float voice-fix 卡住 | `staging` 環境無輸出 | 檢查 `voice-fix` 任務設定 |
| 路徑穿越 | 任意路徑存取 | 全部入口經 `resolve(path)` 後確認在 `/storage` |

---

## 6. 驗證方法論

1. **真實指令執行**：
   ```bash
   bash "C:/Project/esggo/vps/junaikey.sh" query --event=awaken --limit=5
   bash "C:/Project/esggo/vps/junaikey.sh" sed-stats
   ```
2. ** Readiness gate **：`python3 -c "import oab_float_deploy_staging; print('OK')"` exit 0。
3. ** 5T 狀態 **：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅

---

*文檔由 agent:01（蜂后）統籌 · agent:07（編碼）· agent:11（測試）· agent:30（質控）*
*5T 狀態：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅*
