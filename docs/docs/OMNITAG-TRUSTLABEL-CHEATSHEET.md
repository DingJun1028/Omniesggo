# 萬能標籤 + 信任標別 Cheatsheet（A4 速查）

> 一頁打完收工。對應：soul.md §20.7、tests/trust-label.test.ts (15/15 green)

---

## 1. 五個等級 × 分數

| Level | Score | Label Set |
|---|---|---|
| `low` | 0.70 | `hash-lock` |
| `medium` | 0.85 | `third-party-audit` |
| `high` | 0.95 ⭐ 預設閘值 | `full-5t-pass`, `hash-lock` |
| `critical` | 1.00 | `h4-frozen`, `object-freeze`, `full-5t-pass` |
| `authenticated` | 0.90 | `hmac`, `oauth`, `full-5t-pass` |

> 未知等級一律回傳 **0**（透明原則，不留 fallback）

---

## 2. 三個內建函數

```ts
import { esggo } from '@/lib/omni-core/omni-function';

esggo.trustScore('high');                                    // → 0.95
esggo.trustGate('low');                                       // → { passed:false, threshold:0.95, violations:[...] }
esggo.trustGate('high');                                      // → { passed:true,  threshold:0.95, violations:[] }
esggo.trustGate('medium', { requiredLevel: 'low' });          // → { passed:true,  threshold:0.70, violations:[] }
esggo.trustLabel(tag, 'critical');                            // → 加上 trustLevel + trustScore + hashLock + labels
```

---

## 3. 兩個工廠函數

```ts
import { createTrustTag, updateLifecycle } from '@/lib/omni-base';

// 建立（自動 Object.freeze）
const tag = createTrustTag({
  agent: 'agent:07',
  trustLevel: 'high',
  lifecycle: 'active',
});
// → { agent, trustLevel:'high', trustScore:0.95, hashLock:'<sha256>', lifecycle, createdAt }

// 升級（保留 hashLock，重新計算 trustScore）
const frozen = updateLifecycle(tag, 'frozen', { trustLevel: 'critical' });
```

---

## 4. 兩個契約

```ts
import { validateTrustLevel, enforceFrozenLock } from '@/lib/omnitag-contract';

// 驗證 trustLevel 合法性（獨立於三位一體）
validateTrustLevel({ trustLevel: 'high' });
// → { valid: true, violations: [] }
validateTrustLevel({ trustLevel: 'bogus' });
// → { valid: false, violations: ['Invalid trustLevel "bogus" — must be one of ...'] }

// 凍結鎖 — 雙介面
enforceFrozenLock(sealed, true);                              // 舊契約 H4 雙鎖 → ContractCheck
enforceFrozenLock(frozen, { trustLevel: 'low' });             // 新契約 §20.7 單鎖 → { blocked, violations }
```

---

## 5. 5T 對齊

| 原則 | 實作點 |
|---|---|
| **T**raceable | `createHash('sha256')` 產 hashLock，跨語言位元級一致 |
| **T**rackable | lifecycle 欄位雙向聯動 trustLevel |
| **T**angible | UI 可顯示 `score × 100%` 徽章 |
| **T**ransparent | 未知等級回 0；score/threshold 一律可讀 |
| **T**rustworthy | `Object.freeze` 標籤不可變；enforceFrozenLock 阻擋變更 |

---

## 6. 常見錯誤快查

| 錯誤訊息片段 | 處置 |
|---|---|
| `Invalid trustLevel "X" — must be one of low/medium/high/critical/authenticated` | 改用合法五等級 |
| `H4 frozen: lifecycle:frozen + restricted artifact is immutable` | 走唯讀或不呼叫 enforceFrozenLock |
| `H4 frozen: lifecycle:frozen artifact is immutable — cannot modify` | 建立新標籤取代（場景 12） |
| `trustScore X < required Y (level)` | 升級 trustLevel 或放寬 requiredLevel |
| `Missing required [trustLevel:*]` | 補上欄位後重試 |

---

## 7. 驗收指令

```bash
pnpm vitest run src/lib/__tests__/trust-label.test.ts       # 15/15
pnpm vitest run src/lib/__tests__/omnitag-contract.test.ts  # 10/10
pnpm vitest run                                               # 706/0/21
```

---

> 「一頁打完，5T 閉環。」— 萬能蜂后
