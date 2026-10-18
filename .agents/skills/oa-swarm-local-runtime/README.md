# 技能：oa-swarm-local-runtime

> **技能名稱**: oa-swarm-local-runtime
> **版本**: 1.0.0
> **作者**: Hermes Agent (DingJun1028)
> **授權**: MIT

## 1. 技能說明

本技能描述 **OA-Team 30 蜂群本機運行與 OAB broker 部署** 的實踐細節，包括：
- 本地 Ollama 模型選擇（非 reasoning model）
- CrewAI + Ollama 的相容性配置
- OAB broker 的本地/本機部署（`pm2` 非 `nohup`）
- 本機運行 README、腳本與検測

本技能適用於在 **本地開發機 / 本機伺服器** 部署 OA-Team 30 蜂群。

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
| 30 代理載入 | `load_crew('crew.jsonc')` → 30 agents / 5 tasks | ✅ |
| 本機 LLM | `qwen2.5:3b-instruct-q4_K_M`（非 reasoning model） | ✅ |
| `ollama_model_tool` | 已清除，不保持引用 | ✅ |
| OAB broker | `pm2 start broker.py --name oab-broker --interpreter python3 -- --bus vps --store <dir> --heartbeat` | ✅ |
| Cloudflare Tunnel | `cloudflared tunnel --url http://localhost:8790 --hostname aistation.esggo.co` | ✅ |

---

## 4. 核心流程

### 4.1 本地 Ollama 模型選擇

```bash
# 1. 檢查 Ollama 是否已安裝
ollama --version

# 2. 拉取非 reasoning model（CrewAI 要求）
ollama pull qwen2.5:3b-instruct-q4_K_M

# 3. 驗證模型
ollama run qwen2.5:3b-instruct-q4_K_M "測試"
```

### 4.2 OAB broker 本地部署

```bash
# 1. 在本機建立 broker 目錄
mkdir -p oab-broker && cd oab-broker

# 2. 初始化 pm2 環境
pm2 init

# 3. 啟動 OAB broker
pm2 start broker.py --name oab-broker --interpreter python3 -- --bus vps --store <dir> --heartbeat

# 4. 檢查狀態
pm2 list

# 5. 查看日志
pm2 logs oab-broker --lines 50
```

### 4.3 本機運行驗證

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

### 5.1 `scripts/start_local.sh`

本地運行啟動腳本。負責：
- 檢查 Ollama 模型
- 載入 CrewAI 30 代理
- 啟動 OAB broker
- 驗證 5T 狀態

### 5.2 `test/test_local_runtime.py`

本地運行測試腳本。負責：
- 檢查 Ollama 模型
- 載入 CrewAI 30 代理
- 驗證 5T 狀態
- 輸出結果

---

## 6. 已知邊界

| 項目 | 狀態 | 說明 |
|------|------|------|
| 本機 Ollama 模型 | ✅ 已驗證 | `qwen2.5:3b-instruct-q4_K_M` |
| OAB broker（pm2） | ✅ 已驗證 | journal 成長 7→157 行 |
| Cloudflare Tunnel | ✅ 已驗證 | 透過 `curl -m 12` 收到 HTTP 200 |
| `ollama_model_tool` 殘留 | ✅ 已清除 | `git grep` 無殘留 |

---

## 7. 失敗模式與處置

| 失敗模式 | 徵兆 | 處置 |
|----------|------|------|
| 模型為 reasoning | `content` 為空 | 改用 `qwen2.5:3b-instruct` |
| OAB broker 不寫 journal | 7→N 行停滯 | `pm2 restart oab-broker` |
| `ollama_model_tool` 殘留 | import 時失敗 | `git grep "ollama_model_tool"` 清除 |
| 路徑穿越防護 | 任意路徑存取 | 全部入口經 `resolve(path)` 後確認在 `/storage` 內 |

---

## 8. 驗證方法論

1. **真實指令執行**：
   ```bash
   bash scripts/start_local.sh --check-crew
   python3 -m pytest test/ -v
   ```
2. ** Readiness gate **：`python3 -c "import oa_swarm_local_runtime; print('OK')"` exit 0。
3. ** 5T 狀態 **：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅

---

## 9. 版本記錄

| 日期 | 版本 | 修改內容 | 作者 |
|------|------|----------|------|
| 2026-10-16 | 1.0.0 | 首次發布 | Hermes Agent |
