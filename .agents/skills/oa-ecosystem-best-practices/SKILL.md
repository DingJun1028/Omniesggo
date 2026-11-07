---
name: oa-ecosystem-best-practices
description: "OA 蜂群/CrewAI/OAB/Tailscale 建置除錯的實戰陷阱與對策。建 OA 時載入。"
version: 1.0.0
author: Hermes Agent (DingJun1028)
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [oa, crewai, oab, tailscale, ollama, best-practices, swarm]
title: OA 生態最佳實踐
category: oa-ecosystem-best-practices
title: OA 生態最佳實踐
category: oa-ecosystem-best-practices
---

# OA Ecosystem Best Practices

Hard-won operational rules for the OA (Omni-Agency) six-node ecosystem. Each rule came from a
real incident during the OA-Team 30-swarm + OAB broker + Tailscale mobile-access buildout.

## Node map (what "done" means for OA)
- ① OA-Local: `oa-team-crewai/` runs CrewAI with local Ollama → `load_crew('crew.jsonc')` → 30 agents / 5 tasks
- ② OA-Team (VPS): same project on `esggo-vps` → `~/oa-team-crewai/oa-team-crewai`, crewai via uv tool
- ③ OAB: `oa-twins/oab/broker.py` running on VPS via **pm2**, journal growing (`vps.oab.jsonl`)
- ④ OA-TWINS: `oa-twins-tracker.py` + `notify_via_tracker.py` (Hermes scripts dir) closed loop
- ⑤ OA-VPS bridge: Hermes WebUI on VPS docker `0.0.0.0:8790`, reachable via Tailscale `100.71.82.0:8790`
- ⑥ OAB is the event bus tying ③④ together

## 1. Local Ollama model MUST be non-reasoning for CrewAI
- `gemma4` is a **reasoning model**: answer goes in `reasoning` field, `content` is EMPTY → CrewAI
  raises `ValueError: Invalid response from LLM call - None or empty`.
- Use `qwen2.5:3b-instruct-q4_K_M` (non-reasoning) for CrewAI. Verified: content non-empty.
- Also: gemma4 8B on CPU can crash Ollama (long sequential swarm inference) → service drops.
- Rule: default local CrewAI model = qwen2.5:3b-instruct, never a reasoning model.

## 2. CrewAI + Ollama: disable native tool-calling path
- CrewAI 0.175 walks `call_llm_native_tools` for agents with delegation/tools → Ollama small models
  return empty/invalid `tool_calls` → `None or empty`.
- Fix (local wrapper, NOT in repo jsonc — keeps repo CI-friendly): a `run_swarm_local.py`
  (gitignored) that loads crew, sets each agent `tools=[]`, `allow_delegation=False`, then kickoff.
- Rule: keep `agents/*.jsonc` environment-driven (no hardcoded `llm`); inject Ollama via
  `run_local.sh` env vars (`OPENAI_API_BASE`, `OPENAI_MODEL_NAME`). This satisfies §19 (no drift).

## 3. OAB broker: NEVER run via nohup/setsid daemon — use pm2
- `nohup python3 broker.py --heartbeat &` and `setsid ... < /dev/null &` both start the process,
  but asyncio event loop STALLS in daemon mode → journal stops growing (stuck at N lines).
- `python3 -u broker.py --heartbeat` in foreground WRITES journal fine (7→13 lines in 10s).
- Fix: `pm2 start broker.py --name oab-broker --interpreter python3 -- --bus vps --store <dir> --heartbeat`
  then `pm2 save`. Verified: journal grew 7→157 lines, survives restart.
- Rule: any long-running asyncio service on VPS = pm2, not nohup.

## 4. Tailscale reachability: curl timeout is a FALSE NEGATIVE
- First connection to a Tailscale IP (e.g. `100.71.82.0:8790`) over direct wireguard handshake can
  take >8s. `curl -m 8` returns `HTTP=000` even though the service is UP.
- Fix: use `curl -m 12` (or more) when testing Tailscale IPs. Verified: `-m 12` → `HTTP=200`.
- Also: VPS self-test `curl $MY_TS_IP:8790` works even when external client times out — that proves
  the service is fine; the client just needs a longer timeout.
- Rule: when verifying Tailscale endpoints, always use `-m 12+`.

## 5. CrewAI `load_crew` signature changed — pass `source`
- Old: `load_crew()` → works on some versions.
- New (CrewAI 0.175): `load_crew(source: 'Path|str', agents_dir=None)`. Calling without `source`
  raises `TypeError: missing 1 required positional argument: 'source'`.
- Correct: `load_crew('crew.jsonc')`.
- Rule: always pass the crew config path. Verify with `len(crew.agents)==30 and len(crew.tasks)==5`.

## 6. VPS crewai is a uv tool — find its python, not system python3
- `python3 -c "import crewai"` on VPS → `ModuleNotFoundError` (crewai is in uv-isolated env).
- Correct: `export PATH=$HOME/.local/bin:$PATH; CREWAI_PY=$(dirname $(readlink -f $(which crewai)))/python`
  then run validation with `$CREWAI_PY`.
- Rule: on VPS, always resolve crewai's own interpreter before any import.

## 7. git: protect unrelated working-tree edits with stash, never force-add
- When pulling/rebasing hits "untracked files would be overwritten", the conflicting files are often
  YOUR other in-progress work (e.g. universal-translator). Move them to `/tmp`, rebase, then restore.
- If you accidentally `git add` them, `git stash push -- <files>` to pull them back out (safe, poppable).
- Rule: scope every commit to OA-related files only; stash unrelated tracked modifications, pop after.

## 8. Verification = real runtime evidence, not claims
- For bash deploy scripts: `bash -n` (syntax) + actual side-effect on target (e.g. re-run the pm2
  start segment, confirm journal line count increased).
- For CrewAI: `load_crew` + count agents/tasks (30/5).
- For OAB: `pm2 list` online + `wc -l journal/*.jsonl` growing.
- For Tailscale: `curl -m 12` returns 200.
- Never report "verified" without the actual tool output above.

## Self-audit checklist (run before declaring OA "done")
- [ ] Local CrewAI uses qwen2.5 (not gemma4/reasoning) (rule 1)
- [ ] run_swarm_local.py disables native tools/delegation (rule 2)
- [ ] agents/*.jsonc has no hardcoded llm (§19 clean) (rule 2)
- [ ] OAB broker on pm2 (not nohup), journal growing (rule 3)
- [ ] Tailscale endpoints tested with `-m 12` (rule 4)
- [ ] load_crew called with source arg (rule 5)
- [ ] VPS crewai validated via its own python (rule 6)
- [ ] git commit scoped to OA only; unrelated edits stashed (rule 7)
- [ ] Real runtime evidence collected for each node (rule 8)


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| oa-ecosystem-best-practices | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：oa-ecosystem-best-practices 並查詢目前狀態
{
  triggers: ["oa-ecosystem-best-practices", "query"],
  actions: ["awaken()", "query()"],
  priority: ["oa-ecosystem-best-practices", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | oa-ecosystem-best-practices, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | oa-ecosystem-best-practices, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：oa-ecosystem-best-practices
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 oa-ecosystem-best-practices 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 oa-ecosystem-best-practices 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
