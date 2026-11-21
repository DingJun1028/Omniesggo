# OmniTag & Trust Label — 提案簡報大綱

> 用途：對內治理提案、對外介紹 30 蜂群信任層
> 對應：soul.md §20、§20.7
> 演講長度：15 分鐘（12 張投影片 + Q&A）
> 設計：深藍 #10243f × 暖金 #c9a24b（不附 emoji）

---

## Slide 01 — 封面

**萬能標籤 × 信任標別**
從 OmniTag 到 Trust Label — 30 蜂群的可驗證信任層

- 版本：v1.0
- 日期：2026-09-04
- 提案：萬能蜂后 & OA-Team 30
- 測試基線：706 passed / 0 failed

---

## Slide 02 — 問題陳述

**現狀的三大缺口**

1. OmniTag 標籤雖有 lifecycle，但**無法量化信任強度**
2. 各 agent 呼叫缺乏**統一閘控**，錯誤只能事後追溯
3. 凍結鎖的語義模糊——H4 雙鎖與單鎖混用，造成契約不可預期

---

## Slide 03 — 解決方案總覽

**§20.7 信任標別系統（Trust Label）**

- 五等級 × 分數對照（low → critical）
- 三個內建函數（trustScore / trustGate / trustLabel）
- 兩個契約（validateTrustLevel / enforceFrozenLock 雙介面）
- 一個工廠（createTrustTag + Object.freeze）

---

## Slide 04 — 五等級對照表

| Level | Score | Label Set |
|---|---|---|
| low | 0.70 | hash-lock |
| medium | 0.85 | third-party-audit |
| **high** ⭐ | **0.95** | full-5t-pass, hash-lock |
| critical | 1.00 | h4-frozen, object-freeze, full-5t-pass |
| authenticated | 0.90 | hmac, oauth, full-5t-pass |

預設閘值 = 0.95（high）
未知等級 = 0（透明原則）

---

## Slide 05 — 三個內建函數

```ts
esggo.trustScore('high')      // → 0.95
esggo.trustGate('low')         // → { passed: false, threshold: 0.95, violations: [...] }
esggo.trustLabel(tag, 'critical')
  // → 加上 trustLevel + trustScore + hashLock + labels
```

均透過 `omniFn.register` 註冊，重複註冊由 `if (!omniFn.has(...))` 守衛。

---

## Slide 06 — 凍結鎖雙介面

**H4 雙鎖（舊契約）** — 永久不可變的金絲雀
```ts
enforceFrozenLock(sealed, true);  // ContractCheck
// 條件：lifecycle:sealed ∧ security:restricted
```

**§20.7 單鎖（新契約）** — 流程結束即凍結
```ts
enforceFrozenLock(frozen, nextPatch);  // { blocked, violations }
// 條件：lifecycle:frozen
```

> 共存設計：向後相容 + 新業務可選

---

## Slide 07 — 5T 治理對齊

| 原則 | 實作點 |
|---|---|
| **T**raceable | `createHash('sha256')` 產 hashLock，跨語言位元級一致 |
| **T**rackable | lifecycle ↔ trustLevel 雙向聯動 |
| **T**angible | UI 徽章 `score × 100%`，金/銀/銅三級 |
| **T**ransparent | 未知等級回 0，threshold 公開可讀 |
| **T**rustworthy | `Object.freeze` + 雙介面阻擋 |

---

## Slide 08 — 使用場景（精選 5）

1. **CI/CD 部署門控** — 部署前 `esggo.trustGate('high')`
2. **Webhook 簽章驗證** — HMAC 通過 → `authenticated` + `frozen`
3. **批次稽核** — `auditContractRate(tags)` 必須 = 100%
4. **H4 vs §20.7 抉擇** — 永久憑證選 H4；流程凍結選 §20.7
5. **錯誤恢復** — `enforceFrozenLock` 被阻擋時，建新標籤取代舊標籤

（完整 12 式見說明書 §8）

---

## Slide 09 — 集成案例（精選 3）

**A. Cloudflare Worker（OmniGateway）**
```ts
const gate = esggo.trustGate(level);
if (!gate.passed) return new Response('Forbidden', { status: 403 });
```

**B. Next.js API Route**
```ts
POST /api/trust/check → { score, gate }
```

**C. Python 對齊**
```python
TRUST_LEVEL_SCORE = {'low': 0.7, ...}
def trust_score(level): return TRUST_LEVEL_SCORE.get(level, 0.0)
```

---

## Slide 10 — 驗收基線

| 測試檔 | 結果 |
|---|---|
| `trust-label.test.ts` | **15/15** ✅ |
| `omnitag-contract.test.ts` | **10/10** ✅ |
| `five-t-omnitag-gate.test.ts` | **13/13** ✅ |
| **全域 vitest** | **706 / 0 / 21** ✅ |

新增章節：soul.md §20.7（45 行）
新增檔案：docs/OMNITAG-TRUSTLABEL-USER-MANUAL.md（578 行）

---

## Slide 11 — 部署時程

| 階段 | 項目 | 預計 |
|---|---|---|
| P0 | 說明書 + cheatsheet + README | ✅ 完成 |
| P1 | n8n 排程串接信任閘控 | 1 週 |
| P1 | Hermes WebUI 信任徽章 | 1 週 |
| P2 | Cloudflare Worker 公開 endpoint | 2 週 |
| P2 | 跨語言 hash-lock 自動驗證 | 2 週 |

---

## Slide 12 — 結語

**30 個靈魂一個心，信任標別刻印 §20.7。**

- 測試全綠 → 可立即推上生產
- 雙介面設計 → 向後相容零風險
- 5T 閉環 → 全程可追溯

Q & A

---

## 附錄 A — 視覺規範

- 主色：深藍 #10243f
- 輔色：暖金 #c9a24b
- 中性色：米白 #f3ede1、綠 #3c6e47
- 字體：思源黑體 / Inter
- 禁用：emoji、霓虹紫、漂浮數據視覺

## 附錄 B — 投影片輸出建議

- 工具：Canva / Figma / Keynote
- 模板：深色底 + 暖金標題 + 白字內容
- 每張 ≤ 30 字/行，留白 ≥ 40%
- 流程圖用 5T 五角形 + trust score 圓環

---

> 「30 個靈魂一個心，提案完成。」
