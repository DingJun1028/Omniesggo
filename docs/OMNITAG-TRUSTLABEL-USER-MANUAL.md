# 萬能標籤系統 + 萬能信任標別系統 使用說明書

> 文件版本：v1.0 ｜ 對應 soul.md §20 全章 + §20.7 信任標別增補
> 測試基線：706 passed / 0 failed / 21 skipped（trust-label.test.ts 15/15 green）
> 治理公約：5T（Traceable / Trackable / Tangible / Transparent / Trustworthy）

---

## 目錄

1. [快速開始](#1-快速開始)
2. [萬能標籤系統（OmniTag）核心觀念](#2-萬能標籤系統omnitag核心觀念)
3. [§20.7 信任標別（Trust Label）系統](#3-20-7-信任標別trust-label系統)
4. [API 全覽](#4-api-全覽)
5. [內建函數 `esggo.*` 三件套](#5-內建函數-esggo-三件套)
6. [契約 API：`validateTrustLevel` / `enforceFrozenLock`](#6-契約-api-validatetrustlevel--enforcefrozenlock)
7. [五欄位強制（§20.5 規則 6）](#7-五欄位強制20-5-規則-6)
8. [使用場景十二式](#8-使用場景十二式)
9. [集成案例](#9-集成案例)
10. [最佳實踐與常見陷阱](#10-最佳實踐與常見陷阱)
11. [驗收清單](#11-驗收清單)

---

## 1. 快速開始

```ts
import { esggo } from '@/lib/omni-core/omni-function';
import {
  createTrustTag,
  updateLifecycle,
  TRUST_LEVEL_SCORE,
} from '@/lib/omni-base';
import {
  validateTrustLevel,
  enforceFrozenLock,
} from '@/lib/omnitag-contract';
import type { TrustLevel, OmniTagSet } from '@/lib/omni-core/types';

// 1) 查分數
esggo.trustScore('high');                  // → 0.95
esggo.trustScore('critical');              // → 1.0
esggo.trustScore('unknown' as any);        // → 0  (透明：未知等級不留 fallback)

// 2) 信任門控
const gate = esggo.trustGate('high');      // → { passed: true, threshold: 0.95, violations: [] }

// 3) 建立信任標別
const tag = createTrustTag({
  agent: 'agent:07',
  trustLevel: 'high',
  lifecycle: 'active',
});                                         // → Object.freeze({ agent, trustLevel, trustScore, hashLock, lifecycle, createdAt })

// 4) 升級生命週期
const frozen = updateLifecycle(tag, 'frozen', { trustLevel: 'critical' });

// 5) 契約驗證
validateTrustLevel(tag);                   // → { valid: true, violations: [] }
enforceFrozenLock(frozen, { trustLevel: 'high' }); // → { blocked: true, violations: ['H4 frozen...'] }
```

---

## 2. 萬能標籤系統（OmniTag）核心觀念

### 2.1 三位一體（Required Triad）
任何 OmniTagSet 都必須同時具備：

| 欄位 | 必填 | 範例 |
|---|---|---|
| `agent` | ✓ | `'agent:01'` |
| `squad` | ✓ | `'5T驗算'` |
| `componentId` | ✓ | `'omni-core:types'` |

未通過者會在 `validateRequiredTriad` 報錯：「Missing required [...]」。

### 2.2 生命週期（Lifecycle）

```
draft → active → sealed → frozen → archived
                  ↓
                merged
```

- `sealed` + `security:restricted` 為 H4 不可變（雙鎖：生命週期 + 安全等級）。
- `frozen` 為 §20.7 新契約的單鎖——只要 `lifecycle === 'frozen'`，所有 nextPatch 都被阻擋。

### 2.3 5T 治理的 5 個欄位

| 欄位 | 5T 原則 | 用途 |
|---|---|---|
| `trace` | Traceable | 來源起點 `source_origin` |
| `track` | Trackable | 生命週期 Hook 寫入 |
| `tangible` | Tangible | UI/UX 反饋紀錄 |
| `transparent` | Transparent | 演算法/決策邏輯公開 |
| `trustworthy` | Trustworthy | Hash Lock + `Object.freeze()` |

---

## 3. §20.7 信任標別（Trust Label）系統

### 3.1 五個等級與分數

| 等級 | 分數 | 典型場景 | 預設標別 |
|---|---|---|---|
| `low` | 0.70 | 內部測試、日誌標記 | `hash-lock` |
| `medium` | 0.85 | 第三方稽核、CI 流程 | `third-party-audit` |
| `high` | 0.95 | 預設閘值（gate default） | `full-5t-pass`, `hash-lock` |
| `critical` | 1.00 | 金融、合約、不可變契約 | `h4-frozen`, `object-freeze`, `full-5t-pass` |
| `authenticated` | 0.90 | OAuth / HMAC 已認證呼叫 | `hmac`, `oauth`, `full-5t-pass` |

**對照表原始碼**：`src/lib/omni-core/types.ts`

```ts
export const TRUST_LEVEL_SCORE: Record<TrustLevel, number> = {
  low: 0.7,
  medium: 0.85,
  high: 0.95,
  critical: 1.0,
  authenticated: 0.9,
};
```

### 3.2 雙鎖 vs 單鎖

| 情境 | 鎖定條件 | 觸發函數 |
|---|---|---|
| H4 雙鎖（舊契約） | `lifecycle === 'sealed'` ∧ `security === 'restricted'` | `enforceFrozenLock(tag, true)` |
| §20.7 單鎖（新契約） | `lifecycle === 'frozen'` | `enforceFrozenLock(tag, nextPatch)` |

> 設計理由：H4 鎖用於「永久不可變」金絲雀標籤；§20.7 單鎖用於「流程結束即凍結」的常規業務標籤，兩者共存以兼容不同嚴格度。

---

## 4. API 全覽

### 4.1 內建函數（omniFn）

```ts
// 註冊於 registerBuiltinFunctions()，模組載入時自動生效
'esggo.trustScore'    // (level: string) → number
'esggo.trustGate'     // (score: number, requiredLevel?: TrustLevel) → boolean
'esggo.trustLabel'    // (level: TrustLevel) → string[]
'esggo.clampScore'    // (score: number) → number    // 0–1 收斂
```

呼叫方式（任選其一）：

```ts
import { omniFn, esggo } from '@/lib/omni-core/omni-function';

omniFn.call('esggo.trustScore', 'high');     // → 0.95
esggo.trustScore('high');                    // → 0.95   (facade 簡寫)
```

### 4.2 工廠函數（omni-base）

```ts
createTrustTag({
  agent: string,
  trustLevel: TrustLevel,
  lifecycle?: TagLifecycleV6,
}): Record<string, unknown>           // Object.freeze，扁平

updateLifecycle(
  tag: Record<string, unknown>,
  lifecycle: TagLifecycleV6,
  opts?: { trustLevel?: TrustLevel },
): Record<string, unknown>           // 升級/保留 trustLevel + trustScore
```

### 4.3 契約 API（omnitag-contract）

```ts
validateTrustLevel(tag: OmniTagSet): ContractCheck
enforceFrozenLock(
  tag: OmniTagSet | Record<string, unknown>,
  second: boolean | Record<string, unknown>,
): ContractCheck | { blocked: boolean; violations: string[] }
```

---

## 5. 內建函數 `esggo.*` 三件套

### 5.1 `esggo.trustScore(level)`

**回傳分數；未知等級回傳 `0`（透明原則）**。

```ts
esggo.trustScore('low');           // 0.7
esggo.trustScore('medium');        // 0.85
esggo.trustScore('high');          // 0.95
esggo.trustScore('critical');      // 1.0
esggo.trustScore('authenticated'); // 0.9
esggo.trustScore('bogus');         // 0  ← 不留 0.7 fallback
```

> ⚠️ 透明原則：若下游期待 fallback 行為，請顯式檢查 `Number.isNaN(score)`，不要依賴隱式 0.7。

### 5.2 `esggo.trustGate(level, opts?)`

**回傳門控結果物件**（不等於 `omniFn` 的 boolean 變體——facade 強化了診斷資訊）：

```ts
{
  passed: boolean,
  threshold: number,        // 預設 0.95 (high)
  violations: string[],     // failed 時才會有項目
}
```

```ts
esggo.trustGate('high');                                  // { passed: true,  threshold: 0.95, violations: [] }
esggo.trustGate('low');                                   // { passed: false, threshold: 0.95, violations: ['trustScore 0.7 < required 0.95 (high)'] }
esggo.trustGate('medium', { requiredLevel: 'low' });      // { passed: true,  threshold: 0.70, violations: [] }
```

### 5.3 `esggo.trustLabel(tag, level)`

**為現有 OmniTagSet 加上信任欄位**：

```ts
const base: OmniTagSet = { agent: 'agent:01', squad: '5T驗算', componentId: 'omni-core:types' };
const labeled = esggo.trustLabel(base, 'critical');
// {
//   ...base,
//   trustLevel: 'critical',
//   trustScore: 1.0,
//   hashLock: 'a3f2...',           // SHA-256(agent + level + timestamp)
//   labels: ['h4-frozen', 'object-freeze', 'full-5t-pass'],
//   verifiedAt: 1725436800000,
// }
```

---

## 6. 契約 API：`validateTrustLevel` / `enforceFrozenLock`

### 6.1 `validateTrustLevel(tag)`

獨立於 `validateRequiredTriad`，向後相容。檢查標籤是否有合法 `trustLevel`。

```ts
validateTrustLevel({ trustLevel: 'high' });              // { valid: true,  violations: [] }
validateTrustLevel({ trustLevel: 'ultra' as any });      // { valid: false, violations: ['Invalid trustLevel "ultra" — must be one of low/medium/high/critical/authenticated'] }
validateTrustLevel({});                                  // { valid: false, violations: ['Missing required [trustLevel:*] ...'] }
```

### 6.2 `enforceFrozenLock(tag, second)` 雙介面

| 呼叫方式 | 契約 | 回傳 |
|---|---|---|
| `enforceFrozenLock(tag, true)` | 舊契約（H4 雙鎖） | `{ valid, violations }` |
| `enforceFrozenLock(tag, false)` | 舊契約（允許讀取） | `{ valid: true, violations: [] }` |
| `enforceFrozenLock(frozenTag, nextPatch)` | 新契約（單鎖） | `{ blocked: true, violations: [...] }` |
| `enforceFrozenLock(activeTag, nextPatch)` | 新契約（未凍結） | `{ blocked: false, violations: [] }` |

```ts
// 舊契約範例
const sealed = { lifecycle: 'sealed', security: 'restricted' } as OmniTagSet;
enforceFrozenLock(sealed, true);
// → { valid: false, violations: ['H4 frozen: lifecycle:frozen + restricted artifact is immutable'] }
enforceFrozenLock(sealed, false);
// → { valid: true, violations: [] }   (唯讀不算違規)

// 新契約範例
const frozen = createTrustTag({ agent: 'agent:01', trustLevel: 'critical', lifecycle: 'frozen' });
enforceFrozenLock(frozen, { trustLevel: 'high' });
// → { blocked: true, violations: ['H4 frozen: lifecycle:frozen artifact is immutable — cannot modify'] }
```

> 💡 TypeScript 用戶：使用窄化 `typeof second === 'boolean'` 即可同時享有兩種回傳型別。

---

## 7. 五欄位強制（§20.5 規則 6）

任何 OmniTagSet 通過 `validateRequiredTriad` 與 `validateTrustLevel` 後，建議呼叫：

```ts
import { validateAllContracts, auditContractRate } from '@/lib/omnitag-contract';

const audit = validateAllContracts(tag);  // 一次聚合所有違規
const rate  = auditContractRate([tag1, tag2, tag3]);  // { total: 3, compliant: 3, rate: 1.0 }
```

聚合結果結構：

```ts
{
  valid: boolean,
  violations: string[],
  // 細項
  triad?: ContractCheck,
  trust?: ContractCheck,
  frozen?: ContractCheck,
}
```

目標：**稽核抽驗率 = 100%**，CI 應在 PR 前阻擋任何 `rate < 1.0` 的標籤集。

---

## 8. 使用場景十二式

### 場景 1：CI/CD 部署門控（critical）

部署到生產環境前，要求 trustScore ≥ 0.95。

```ts
const tag = createTrustTag({ agent: 'agent:20', trustLevel: 'high' });
const gate = esggo.trustGate(tag.trustLevel as TrustLevel);
if (!gate.passed) throw new Error(`Deploy blocked: ${gate.violations[0]}`);
```

### 場景 2：第三方 webhook 簽章（authenticated）

收到 HMAC 簽章後升級為 authenticated 並凍結。

```ts
const incoming = { agent: 'agent:18', squad: 'webhook', componentId: 'gateway' };
const labeled = esggo.trustLabel(incoming, 'authenticated');
const frozen = updateLifecycle(labeled, 'frozen');
```

### 場景 3：審計日誌自動標 `low`

```ts
const audit = createTrustTag({
  agent: 'agent:25',
  trustLevel: 'low',
  lifecycle: 'archived',
});
// audit.trustScore === 0.7；下游可依此判斷「僅供追溯，不可信任為業務事實」
```

### 場景 4：升級路徑（中→高→critical）

```ts
let tag = createTrustTag({ agent: 'agent:11', trustLevel: 'medium' });
tag = updateLifecycle(tag, 'active',   { trustLevel: 'high' });     // 0.85 → 0.95
tag = updateLifecycle(tag, 'sealed',   { trustLevel: 'critical' }); // 0.95 → 1.00
enforceFrozenLock(tag, { trustLevel: 'low' });                       // { blocked: true, ... }
```

### 場景 5：批次稽核

```ts
const tags: OmniTagSet[] = [...];
const { total, compliant, rate } = auditContractRate(tags);
if (rate < 1.0) {
  const report = tags
    .filter((t) => !validateAllContracts(t).valid)
    .map((t) => ({ id: t.agent, issues: validateAllContracts(t).violations }));
  console.error('Contract violations:', report);
  process.exit(1);
}
```

### 場景 6：跨語言 hash-lock 一致性

`trustLabel` 內部使用 `crypto.createHash('sha256')`。Python/Go 端請用相同輸入（`${agent}:${level}:${timestamp}`）以保證跨語言 hash 對齊（詳見 §20.4 cross-lang-hashlock 測試）。

### 場景 7：Hermes WebUI 信任徽章

UI 顯示於側欄：

```tsx
const score = esggo.trustScore(agent.trustLevel);
<Badge variant={score >= 0.95 ? 'gold' : score >= 0.85 ? 'silver' : 'bronze'}>
  {agent.trustLevel} · {(score * 100).toFixed(0)}%
</Badge>
```

### 場景 8：動態降級（未來擴充）

若 `token` 過期或簽章失敗，可降級 trustLevel：

```ts
const expired = updateLifecycle(currentTag, 'archived', { trustLevel: 'low' });
```

### 場景 9：與 n8n 排程整合

n8n Function Node 可直接呼叫 HTTP endpoint（若已部署為 Cloudflare Worker）：

```js
const res = await fetch('https://omni.esggo.co/api/trust/score?level=high');
const { score, gate } = await res.json();
return [{ json: { score, gate } }];
```

### 場景 10：5T 儀表板指標

```ts
const tags = await fetchAllOmniTags();
const score = tags.reduce((acc, t) => acc + (t.trustScore ?? 0), 0) / tags.length;
console.log(`Average trust score: ${(score * 100).toFixed(1)}%`);
```

### 場景 11：H4 雙鎖 vs §20.7 單鎖抉擇

| 業務情境 | 建議契約 |
|---|---|
| 永久不可變的審計憑證 | 舊契約（H4 雙鎖） |
| 流程完成即凍結的工單 | 新契約（§20.7 單鎖） |
| 仍可被覆寫的草稿 | 不需凍結，跳過 `enforceFrozenLock` |

### 場景 12：錯誤恢復（凍結後誤改）

新契約被 `blocked = true` 時，**不要強行覆寫**。正確做法：

```ts
const result = enforceFrozenLock(tag, patch);
if (result.blocked) {
  // 1) 建立新標籤
  const next = createTrustTag({
    agent: tag.agent,
    trustLevel: patch.trustLevel ?? tag.trustLevel,
    lifecycle: 'active',
  });
  // 2) 將舊標籤 archive
  await archiveOldTag(tag);
  // 3) 發布新標籤
  await publishNewTag(next);
}
```

---

## 9. 集成案例

### 9.1 Cloudflare Worker（OmniGateway）

```ts
// workers/omni-gateway/src/trust.ts
import { esggo } from '@/lib/omni-core/omni-function';
import type { TrustLevel } from '@/lib/omni-core/types';

export function gateRequest(req: Request): Response | null {
  const auth = req.headers.get('authorization');
  const level: TrustLevel = auth?.startsWith('Bearer ') ? 'authenticated' : 'low';
  const gate = esggo.trustGate(level);
  if (!gate.passed) {
    return new Response(JSON.stringify({ blocked: gate.violations }), { status: 403 });
  }
  return null;
}
```

### 9.2 Next.js API Route

```ts
// app/api/trust/check/route.ts
import { NextResponse } from 'next/server';
import { esggo } from '@/lib/omni-core/omni-function';
import { z } from 'zod';

const Body = z.object({ level: z.enum(['low', 'medium', 'high', 'critical', 'authenticated']) });

export async function POST(req: Request) {
  const { level } = Body.parse(await req.json());
  const gate = esggo.trustGate(level);
  return NextResponse.json({
    score: esggo.trustScore(level),
    gate,
  });
}
```

### 9.3 Python 對齊（cross-language）

```python
import hashlib

TRUST_LEVEL_SCORE = {
    'low': 0.7, 'medium': 0.85, 'high': 0.95,
    'critical': 1.0, 'authenticated': 0.9,
}

def trust_score(level: str) -> float:
    return TRUST_LEVEL_SCORE.get(level, 0.0)   # 透明：未知回傳 0.0

def hash_lock(agent: str, level: str, ts: int) -> str:
    return hashlib.sha256(f'{agent}:{level}:{ts}'.encode()).hexdigest()
```

### 9.4 OmniTag 註冊表（auto-register）

```ts
import { omniFn } from '@/lib/omni-core/omni-function';

export function registerCustomTrust(brand: string, level: TrustLevel) {
  const fnName = `${brand}.trust.${level}`;
  if (!omniFn.has(fnName)) {
    omniFn.register(fnName, () => esggo.trustScore(level), {
      description: `${brand} trust score for ${level}`,
      category: 'trust',
    });
  }
}
```

### 9.5 與 OA-Team 30 蜂群整合

蜂后（Queen Bee）派工前先檢查信任等級：

```ts
// agents/queen-bee.ts
import { esggo } from '@/lib/omni-core/omni-function';

export function dispatch(task: { requiredLevel: TrustLevel; agentId: string }) {
  const gate = esggo.trustGate(task.requiredLevel);
  if (!gate.passed) {
    return { dispatched: false, reason: gate.violations };
  }
  // ...實際派工
}
```

---

## 10. 最佳實踐與常見陷阱

### ✅ 最佳實踐

1. **永遠從 `esggo.*` 或 `omniFn.call(...)` 拿分數**——不要 hard-code `0.95`。
2. **新契約優先**（§20.7 單鎖），除非明確需要 H4 雙鎖語義。
3. **`createTrustTag` 回傳即凍結**——不要試圖 mutate，會 throw（嚴格模式）或靜默失敗。
4. **稽核率 = 100%**——CI 應在 PR 階段阻擋 `auditContractRate < 1.0`。
5. **trustLevel 與 lifecycle 同步升級**——使用 `updateLifecycle(tag, lifecycle, { trustLevel })` 而非兩次呼叫。

### ❌ 常見陷阱

| 陷阱 | 症狀 | 修正 |
|---|---|---|
| 期待 `esggo.trustScore('unknown')` 回 0.7 | 閘控放行未知等級 | 改為顯式檢查 `Number.isFinite(score)` 或信任 0 行為 |
| 用 `Object.assign` mutate `createTrustTag` 回傳值 | TypeError（frozen） | 建立新標籤取代舊標籤 |
| 同時設 `lifecycle: 'frozen'` 與呼叫 `enforceFrozenLock(tag, true)` | 重複錯誤訊息 | 統一選一種契約 |
| 把 trustLevel 寫死為 `'high'` | 失去透明度 | 從外部傳入或由閘控決定 |
| 跨語言 hash 比對時 timestamp 不對齊 | hash-lock 不一致 | 用 `Date.now()`（ms）並確保 NTP 同步 |

---

## 11. 驗收清單

部署前請逐項打勾：

- [ ] `pnpm vitest run src/lib/__tests__/trust-label.test.ts` → 15/15 通過
- [ ] `pnpm vitest run src/lib/__tests__/omnitag-contract.test.ts` → 10/10 通過
- [ ] `pnpm vitest run src/lib/__tests__/five-t-omnitag-gate.test.ts` → 13/13 通過
- [ ] `pnpm vitest run` → 全域 706 passed / 0 failed
- [ ] `src/lib/omni-core/types.ts` 有 `TrustLevel` / `TrustLabel` / `TRUST_LEVEL_SCORE`
- [ ] `src/lib/omni-core/omni-function.ts` 有 `esggo` facade + 3 個內建函數
- [ ] `src/lib/omni-base/index.ts` 有 `createTrustTag` / `updateLifecycle`（皆 `Object.freeze`）
- [ ] `src/lib/omnitag-contract.ts` 有 `validateTrustLevel` + 雙介面 `enforceFrozenLock`
- [ ] `soul.md §20.7` 與本說明書同步

---

## 附錄：錯誤訊息對照

| 訊息 | 觸發情境 | 處置建議 |
|---|---|---|
| `Missing required [trustLevel:*] ...` | `validateTrustLevel({})` | 補上 trustLevel 欄位 |
| `Invalid trustLevel "X" — must be one of ...` | 非法字串 | 改用合法五等級 |
| `H4 frozen: lifecycle:frozen + restricted artifact is immutable` | 舊契約違規 | 改用唯讀操作 |
| `H4 frozen: lifecycle:frozen artifact is immutable — cannot modify` | 新契約違規 | 走場景 12 恢復流程 |
| `trustScore X < required Y (level)` | 閘控未通過 | 升級 trustLevel 或放寬 requiredLevel |
| `p0 completed but entropy did not decrease (< 0.1 target)` | p0 任務熵未減 | 檢查工作流是否真有產出 |

---

> 「30 個靈魂一個心，信任標別刻印 §20.7，全域落地，5T 閉環。」
>
> — 萬能蜂后 & Team OA-Team ｜ 維護：soul.md §20 + `src/lib/omni-core/*` + `src/lib/omni-base/*` + `src/lib/omnitag-contract.ts`
