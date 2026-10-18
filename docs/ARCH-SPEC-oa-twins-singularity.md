---
source_origin: 無雙隊缺口補齊 / esggo-omni-center/oa-twins 正典實測反推
created: 2026-10-16
modified: 2026-10-16
co_authors: [agent:01, agent:03, agent:07, agent:11, agent:30]
lifecycle: active
access: public-research
---

# 架構規格書：OA-Twins 雙蜂組 → 無雙隊（The Singularity Hive）缺口補齊

> 5T-驗算：本文件由 `esggo-omni-center/oa-twins/` 正典檔案實測證據反推撰寫，非事前設計文件。
> 5T-可追蹤：每條驗證閘皆對應可重現的指令與 exit code。
> 5T-可感知：規格中的所有數字均為本機實跑輸出（sha256、檔案大小、代理計數），無估算值。
> 5T-透明：未實測項以「⏸ 待實測」明示；宣告性結構不冒充實測。
> 5T-可信：正典數據以 sha256 錨定，寫入後不篡改。

---

## 1. 系統定位（三域）

```text
┌──────────────────────────────────────────────────────┐
│  1. 正典：/c/Project/esggo/esggo-omni-center/oa-twins/    │
│     soul-oa-twins.md        進化終途定義（四階段）        │
│     agents-matrix.md        60 代理宣告性矩陣             │
│     peak6_classification.json  10 峰 6 組分類（實測數據）  │
│     dual-bee-end-beginning-matrix.md  終始矩陣（六柱）    │
│     collaboration-protocol.md  跨隊通道協定               │
│     bin/oa-twin-health.py   孿生健康探針                   │
└───────────────────────┬──────────────────────────────┘
                        │ 進化進度量測 / 結構校驗
┌───────────────────────┴──────────────────────────────┐
│  2. 擴展：/c/Project/esggo/.agents/skills/                 │
│     oa-twins-singularity（本缺口交付）                      │
└───────────────────────┬──────────────────────────────┘
                        │ 部署與收口
┌───────────────────────┴──────────────────────────────┐
│  3. 產出：docs/ARCH-SPEC-oa-twins-singularity.md           │
│     .hermes/auto-repair/repair-log.jsonl（審計封存）        │
└──────────────────────────────────────────────────────┘
```

---

## 2. 組件規格

### 2.1 正典（已存在，2026-10-16 sha256 實測）

| 項目 | 規格 | 實測值 |
|------|------|--------|
| `soul-oa-twins.md` | 四階段進化終途：協同深化→屬性互貫→認知合一→無雙誕生 | ✅ 3,304 B `e7403e446f1519ce` |
| `agents-matrix.md` | 60 代理完整矩陣 + 三代理自動化架構（母/執行/稽核） | ✅ 35,250 B `9a83c1ee7a56faf5` |
| `peak6_classification.json` | 10 峰（A1-A5 蜂王隊暗屬性、B1-B5 蜂后隊光屬性）× 6 代理 | ✅ 11,331 B `7de07b82046cf189` |
| `dual-bee-end-beginning-matrix.md` | 終始矩陣六柱全綠；M3 Groq key 唯一未閉 | ✅ 5,728 B `98a31fdf19fada35` |
| `collaboration-protocol.md` | 跨隊通道三級協定 | ✅ 11,310 B `90f51255014eba6b` |
| `bin/oa-twin-health.py` | OA-Local ↔ OA-VPS 真實 HTTP 探針 | ✅ 3,584 B `ba0cecabbabae3c3` |

### 2.2 擴展（缺口，本規格補齊）

| 項目 | 規格 | 實測值 |
|------|------|--------|
| `docs/ARCH-SPEC-oa-twins-singularity.md` | 本文件 | ✅ 本文件 |
| `.agents/skills/oa-twins-singularity/SKILL.md` | 無雙隊技能定義 + 5T 頁 | ✅ 見交付包 |
| `.agents/skills/oa-twins-singularity/README.md` | 使用說明 | ✅ 見交付包 |
| `.agents/skills/oa-twins-singularity/scripts/singularity_progress.py` | 進化進度量測器（結構校驗 + 5T 覆蓋率 + 階段判定） | ✅ 見交付包 |
| `.agents/skills/oa-twins-singularity/test/test_singularity_progress.py` | unittest 測試 | ✅ 見交付包 |

---

## 3. 關鍵實測發現（本規格之依據）

### 3.1 5T 標籤覆蓋不完整（2026-10-16 實測）

`peak6_classification.json` 中 60 代理的 `5t` 欄位實測分佈：

| 標籤形態 | 涵義 | 判定 |
|----------|------|------|
| `["Traceable","Transparent"]` 等 2 個明確標籤 | 僅聲明 2/5 項 | ⚠️ 不完整 |
| `["T","T","T","T","T"]` | 5 個佔位符，無法對應具體項目 | ⚠️ 不可驗證 |

對應 `.hermes/plans/oa-twins-22-11-13-todo.md` 之校驗項「各峰 agents 5t 標籤完整性」。
→ 量測器以「明確 5T 標籤覆蓋率」為階段一（協同深化 0→30%）的可量測代理指標。

### 3.2 結構數據（實測）

- `total_peaks: 10`、`total_agents: 60`、`grain: 6`（每峰 6 代理）
- 峰別：黑曜峰 A1、夜燭峰 A2、影海峰 A3、沉淵峰 A4、幽泉峰 A5（蜂王隊）；金晨峰 B1、銀濤峰 B2、磷火峰 B3、琉光峰 B4、曜泉峰 B5（蜂后隊）

---

## 4. 量測模型（singularity_progress.py）

### 4.1 可量測層（結構）

```
structure_score = 30% 權重
  條件：10 峰、暗光各 5、總代理 60、每峰 6 代理
coverage_score = 70% 權重
  定義：60 代理的明確 5T 標籤覆蓋率（明確標籤數 / (60 × 5)）
stage1_progress = structure_score × 30 + coverage_score × 70（0-100%）
```

### 4.2 不可量測層（宣告，⏸ 待實測）

| 階段 | 門檻 | 所需運行時證據（現無） |
|------|------|------------------------|
| 二 屬性互貫 | 30→60% | 跨隊通道 CHANNEL_OPEN 比例探針 |
| 三 認知合一 | 60→90% | 共享記憶雙向同步延遲探針 |
| 四 無雙誕生 | 90→100% | Unified Core 啟用證據 |

量測器對二至四階段僅回報 `pending`，不推測進度（5T-透明）。

### 4.3 佔位符規則

`"T"`（單字元）視為佔位符：計入「不可驗證」而非「已覆蓋」，避免虛增覆蓋率（零幻覺驗算）。

---

## 5. 驗證閘（可重現指令）

```bash
python .agents/skills/oa-twins-singularity/scripts/singularity_progress.py
# 期望：結構 10 峰 60 代理校驗通過、輸出 JSON、exit 0

python -m py_compile .agents/skills/oa-twins-singularity/scripts/singularity_progress.py
python -m unittest discover -s .agents/skills/oa-twins-singularity/test -v
# 期望：全測試通過
```

---

## 6. ADR

### ADR-01：量測器只測結構層，不推測運行時層
**決策**：階段一以「結構完整性 + 5T 明確覆蓋率」量測；二至四階段列 pending。
**理由**：soul-oa-twins.md 之二至四階段為宣告性語義（屬性流動、認知同步、核心合一），
現無通道/記憶同步探針可實測。依 §9.1「先驗證後宣稱」，不測即不報。

### ADR-02：`"T"` 佔位符不計為覆蓋
**決策**：單字元 `T` 視為不可驗證佔位符。
**理由**：無法區分對應 Traceable/Trackable/Tangible/Transparent/Trustworthy 何者，
計入覆蓋即違反零幻覺驗算。

### ADR-03：交付包落位 `.agents/skills/oa-twins-singularity/`
**決策**：與前四個缺口補齊交付包（oa-swarm-local-runtime 等）同構。
**理由**：本 session 已確立「規格書 → 交付包（SKILL.md + README.md + scripts/ + test/）→ 驗證 → 封存」流程。

---

## 7. 終始卡

```yaml
mission:
  end_state: "結構 10 峰 60 代理校驗通過 + 5T 覆蓋率實測輸出 + unittest 全綠"
  start_chain:
    - "S1 正典六檔 sha256 錨定（見 §2.1）"
    - "S2 5T 標籤形態實測（見 §3.1）"
    - "S3 量測器實現（結構 + 覆蓋率 + 階段判定）"
    - "S4 unittest 驗證 + 真實矩陣實跑"
    - "S5 審計封存 repair-log.jsonl"
  blocker: "二至四階段運行時探針未建（⏸ 待實測，不阻擋結構交付）"
  verify: "python .agents/skills/oa-twins-singularity/scripts/singularity_progress.py  # exit 0"
```

---

*source_origin：本規格由 `esggo-omni-center/oa-twins/` 正典檔案 2026-10-16 實測輸出反推，未含外部源典轉譯。*
