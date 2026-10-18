# 技能：oab-float-deploy-staging

> **技能名稱**: oab-float-deploy-staging
> **版本**: 1.0.0
> **作者**: Hermes Agent (DingJun1028)
> **授權**: MIT

## 1. 技能說明

本技能描述 **OAB daemon + float voice-fix staging 與 run-log relay** 的實踐細節，包括：
- OAB daemon 的本機/本機負載
- float voice-fix 的 staging 環境配置
- run-log relay 的對外傳遞
- 5T 追蹤（Traceable / Trackable / Tangible / Transparent / Trustworthy）

本技能適用於在 **staging 環境** 部署 OAB daemon 與 float voice-fix 任務。

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
| OAB broker | `pm2 start broker.py --name oab-broker --interpreter python3 -- --bus vps --store <dir> --heartbeat` | ✅ |
| float voice-fix | `voice-fix` 任務於 `staging` 環境執行 | ✅ |
| run-log relay | 把 staging 的 run-log 送往 `run-log` 端點 | ✅ |
| webhook | `X-AI-Station-Key` + `hmac.compare_digest` | ✅ |
| 路徑穿越防護 | `resolve(path)` 後確認在 `/storage` 內 | ✅ |

---

## 4. 核心流程

### 4.1 OAB broker 本機部署

```bash
# 1. 在本機建立 broker 目錄
mkdir -p oab-broker && cd oab-broker

# 2. 初始化 pm2 環境
pm2 init

# 3. 啟動 OAB broker（staging 模式）
pm2 start broker.py --name oab-broker --interpreter python3 -- --bus vps --store <dir> --heartbeat --env staging

# 4. 檢查狀態
pm2 list

# 5. 查看日志
pm2 logs oab-broker --lines 50
```

### 4.2 float voice-fix 任務配置

```bash
# 1. 建立 float voice-fix 任務配置
cat > voice-fix.config.json << 'EOF'
{
  "task": "voice-fix",
  "environment": "staging",
  "webhook": {
    "secret": "X-AI-Station-Key",
    "algorithm": "hmac-sha256"
  },
  "path_protection": {
    "resolve": true,
    "base": "/storage",
    "allowed": true
  }
}
EOF

# 2. 啟動 float voice-fix 任務
python3 -m voice_fix --config voice-fix.config.json --env staging
```

### 4.3 run-log relay 配置

```bash
# 1. 建立 run-log relay 配置
cat > run-log-relay.config.json << 'EOF'
{
  "target": "run-log",
  "source": "staging",
  "webhook_secret": "X-AI-Station-Key",
  "algorithm": "hmac-sha256"
}
EOF

# 2. 啟動 run-log relay
python3 -m run_log_relay --config run-log-relay.config.json
```

### 4.4 本機運行驗證

```bash
# 1. 執行本地測試
python3 -m pytest test/ -v

# 2. 驗證 OAB broker 狀態
pm2 status oab-broker

# 3. 驗證 float voice-fix 任務
pm2 status voice-fix-task

# 4. 驗證 run-log relay
pm2 status run-log-relay
```

---

## 5. 組件說明

### 5.1 `scripts/deploy_staging.sh`

staging 部署腳本。負責：
- 檢查 OAB broker 是否已啟動
- 部署 float voice-fix 任務
- 配置 run-log relay
- 驗證 5T 狀態

### 5.2 `test/test_staging.py`

staging 測試腳本。負責：
- 檢查 OAB broker 狀態
- 驗證 float voice-fix 任務
- 驗證 run-log relay
- 驗證 5T 狀態
- 輸出結果

---

## 6. 已知邊界

| 項目 | 狀態 | 說明 |
|------|------|------|
| OAB daemon | ✅ 已驗證 | `pm2 list` 在線，journal 成長 |
| float voice-fix | ✅ 已驗證 | `voice-fix` 任務於 staging 執行 |
| run-log relay | ✅ 已驗證 | run-log 送往 `run-log` 端點 |
| webhook 認證 | ✅ 已驗證 | `hmac.compare_digest` |
| 路徑穿越防護 | ✅ 已驗證 | `resolve` 後確認在 `/storage` |

---

## 7. 失敗模式與處置

| 失敗模式 | 徵兆 | 處置 |
|----------|------|------|
| OAB daemon 停機 | `pm2 list` 看不到 | `pm2 start broker.py --name oab-broker` |
| run-log relay 失敗 | `run-log` 端點無回應 | 檢查 `X-AI-Station-Key` + `hmac.compare_digest` |
| float voice-fix 卡住 | `staging` 環境無輸出 | 檢查 `voice-fix` 任務設定 |
| 路徑穿越 | 任意路徑存取 | 全部入口經 `resolve(path)` 後確認在 `/storage` |

---

## 8. 驗證方法論

1. **真實指令執行**：
   ```bash
   bash scripts/deploy_staging.sh --check-crew
   python3 -m pytest test/ -v
   ```
2. ** Readiness gate **：`python3 -c "import oab_float_deploy_staging; print('OK')"` exit 0。
3. ** 5T 狀態 **：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅

---

## 9. 版本記錄

| 日期 | 版本 | 修改內容 | 作者 |
|------|------|----------|------|
| 2026-10-16 | 1.0.0 | 首次發布 | Hermes Agent |
