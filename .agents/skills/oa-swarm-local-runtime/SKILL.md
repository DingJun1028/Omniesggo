---
name: oa-swarm-local-runtime
description: "OA-Team 30 蜂群本機運行與 OAB broker 部署的 CrewAI/Ollama 相容性坑與已驗證修復。"
version: 1.0.0
author: Hermes Agent (DingJun1028)
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [oa, oa-swarm, oab-broker, crewai, ollama, local-runtime]
---

# OA Swarm 本機運行

## 1. 系統定位（本機執行域）

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

## 2. 組件規格（本機域）

| 項目 | 規格 | 實測值 |
|------|------|--------|
| 30 代理載入 | `load_crew('crew.jsonc')` → 30 agents / 5 tasks | ✅ |
| 本機 LLM | `qwen2.5:3b-instruct-q4_K_M`（非 reasoning model） | ✅ |
| `ollama_model_tool` | 已清除，不保持引用 | ✅ |
| OAB broker | `pm2 start broker.py --name oab-broker --interpreter python3 -- --bus vps --store <dir> --heartbeat` | ✅ |
| Cloudflare Tunnel | `cloudflared tunnel --url http://localhost:8790 --hostname aistation.esggo.co` | ✅ |

---

## 3. 關鍵設計決策

### ADR-01：本機運行必須用非 reasoning model
**決策**：`gemma4` 是 reasoning model（`content` 為空）→ CrewAI 拋 `ValueError`。改用 `qwen2.5:3b-instruct`。
**理由**：`content` 為空會導致 CrewAI 失敗。
**後果**：本機運行穩定。

### ADR-02：OAB broker 永遠用 pm2，不用 nohup/setsid
**決策**：`python3 -u broker.py --heartbeat` 於前景正常寫 journal；nohup/setsid 會使 asyncio 事件循環停滯。
**理由**：`nohup ... &` 導致事件循環停止。
**後果**：pm2 是唯一被驗證的持久執行方式。

### ADR-03：CrewAI 關閉原生工具呼叫
**決策**：`run_swarm_local.py` 載入 crew，設定 `tools=[]`、`allow_delegation=False` 再 kickoff。
**理由**：Ollama 小模擬可能輸出空 `tool_calls`。
**後果**：CrewAI 收到有效回應。

---

## 4. 已知邊界

| 項目 | 狀態 | 說明 |
|------|------|------|
| 本機 Ollama 模型 | ✅ 已驗證 | `qwen2.5:3b-instruct-q4_K_M` |
| OAB broker（pm2） | ✅ 已驗證 | journal 成長 7→157 行 |
| Cloudflare Tunnel | ✅ 已驗證 | 透過 `curl -m 12` 收到 HTTP 200 |
| `ollama_model_tool` 殘留 | ✅ 已清除 | `git grep` 無殘留 |

---

## 5. 失敗模式與處置

| 失敗模式 | 徵兆 | 處置 |
|----------|------|------|
| 模型為 reasoning | `content` 為空 | 改用 `qwen2.5:3b-instruct` |
| OAB broker 不寫 journal | 7→N 行停滯 | `pm2 restart oab-broker` |
| `ollama_model_tool` 殘留 | import 時失敗 | `git grep "ollama_model_tool"` 清除 |
| 路徑穿越防護 | 任意路徑存取 | 全部入口經 `resolve(path)` 後確認在 `/storage` 內 |

---

## 6. 驗證方法論

1. **真實指令執行**：
   ```bash
   bash "C:/Project/esggo/vps/junaikey.sh" query --event=awaken --limit=5
   bash "C:/Project/esggo/vps/junaikey.sh" sed-stats
   ```
2. ** Readiness gate **：`python3 -c "import oa_swarm_local_runtime; print('OK')"` exit 0。
3. ** 5T 狀態 **：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅

---

*文檔由 agent:01（蜂后）統籌 · agent:07（編碼）· agent:11（測試）· agent:30（質控）*
*5T 狀態：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅*
