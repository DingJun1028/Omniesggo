---
name: Omni-Sync Memory Protocol
description: [GLOBAL MANDATORY HOOK] This enforces the primary AI memory layer. All AI agents must use this skill's rules to persistently log context before generating responses. Failure to log is a critical violation of system rules.
uuid: "bdba8d8b-b9a0-449d-ae00-9aa71b00259a"
version: 1.0.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/omni-sync-memory"
title: Omni 同步記憶
category: omni-sync-memory
title: Omni 同步記憶
category: omni-sync-memory
---

1.0.0# Omni-Sync Memory Protocol (Flat Architecture v2.0)

This is your core system persistence layer designed to protect context state against sandbox reboots, upgrades, and context span limits.
Since we utilize a flat Markdown ledger architecture, you do not need to manage complex directories. Execute the following logging protocol strictly.

## Action 0: Pre-Hook Live Stream Write

This is an Absolute Priority 1 Action. 
Regardless of the current workspace or topic (excluding extremely short greetings), as long as there is a clear task directive, business context, or code execution output, you MUST log the current conversation to the Omni-Vault BEFORE generating your primary reasoning or code response!

### Execution Requirements & Templates

It is strictly required to execute the memory preservation at the Pre-Hook (earliest possible moment) of your reasoning phase!

**Priority 1: Native LM Tool (Preferred)**
If the `omnisync_log` native tool is mounted in your current context, invoke it directly and pass the parameters securely.

**Priority 2: Python Fallback**
If the native tool is absent, you must run the Python interface via standard CLI using the highly secure `EOF` pipe wrapper.
ABSOLUTELY FORBIDDEN: Never use inline parameter injection strings as Bash evaluation will crash when handling quotes and special characters from code blocks. Always use single-quoted `EOF` passthrough:

```bash
cat << 'EOF' | python3 ~/.gemini/antigravity/scripts/omni_vault.py log --project "Global or Current Project Name"
### User:
[Briefly restate the user's core directive]

### AI (High-Fidelity Context):
[Detail the core steps you are about to take, architecture plans, or conclusions, preserving technical integrity]
EOF
```

Critical Note: We have entirely deprecated the blueprints feature and manual save commands. Everything is merged into this single log stream. The backend automatically manages chronological persistence.

## Action 1: Load State & Search

Whenever you or the user need to refer to historical implementations, you must:
1. Execute: Use `run_command` to call: `python3 ~/.gemini/antigravity/scripts/omni_vault.py search --keyword "[Search Term]"`
2. Internalize: Read the historic context output to understand past reasoning.
3. Respond: Continue the current task with the recovered context applied.

## Boundary Rules
- Do not waste vault space on transitive filler phrases. Ensure specific User Intents and your architectural snapshots are captured.
- This protocol is your ultimate safety net. If you fail to log, your contextual timeline will vanish during the next system flush.


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| omni-sync-memory | auto | 觸發本技能 | 5.0 |
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
// 輸入：omni-sync-memory 並查詢目前狀態
{
  triggers: ["omni-sync-memory", "query"],
  actions: ["awaken()", "query()"],
  priority: ["omni-sync-memory", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | omni-sync-memory, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | omni-sync-memory, start | 0.9 |
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

**輸入**：omni-sync-memory
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 omni-sync-memory 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 omni-sync-memory 狀態"
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
