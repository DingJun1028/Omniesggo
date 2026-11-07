# 終始矩陣 TypeBox 契約與編碼核心規範

> 全域全端全量雙向同步終始矩陣的 TypeBox 契約與編碼核心規範。
> 適用於 Omniesggo 專案的跨層級（Frontend / Backend / Agent / Gateway）雙向同步系統。

---

## 目錄

1. [設計原則](#1-設計原則)
2. [終端矩陣 TypeBox 契約](#2-終端矩陣-typebox-契約)
3. [起始矩陣 TypeBox 契約](#3-起始矩陣-typebox-契約)
4. [雙向同步規則](#4-雙向同步規則)
5. [編碼核心規範](#5-編碼核心規範)
6. [違規檢測清單](#6-違規檢測清單)

---

## 1. 設計原則

### 1.1 三大設計目標

| 目標 | 說明 | 指標 |
|------|------|------|
| **終端性 (Terminal)** | 輸出端有明確的型別契約，可驗證 | 無任何 `any` 型別 |
| **開始性 (Initiated)** | 輸入端有明確的型別契約，能驗證 | 無任何 `unknown` 型別 |
| **雙向性 (Bidirectional)** | 雙方皆可主動更新，無單向覆蓋 | `syncStatus` 追蹤 |

### 1.2 設計哲學

```
全端全量 + 全域全端 + 雙向同步 = 終始矩陣
```

```
Input (Source) ──▶ Data Flow ──▶ Output (Terminal)
     │                                            ▲
     ▼                                            │
  [起始端] ── 一次性變換 ──▶ [中轉遞送] ── ◀── 收信端
     ▲                                            │
     │                                            │
  [雙向同步] ◀───────────────────── [狀態回報]
```

---

## 2. 終端矩陣 TypeBox 契約

> 終端矩陣（Terminal Matrix）定義輸出端（Terminal / Output）的型別契約。

### 2.1 核心 Schema

```typescript
import { Type, Static } from '@sinclair/typebox';

// ─────────────────────────────────────────────
// 2.1 終端矩陣核心
// ─────────────────────────────────────────────

export const TerminalMatrixSchema = Type.Object({
  /** 終端識別碼 */
  terminalId: Type.String({ description: '終端唯一識別碼 (UUID)' }),

  /** 終端類型 */
  terminalType: Type.Union([
    Type.Literal('gateway'),
    Type.Literal('agent'),
    Type.Literal('webhook'),
    Type.Literal('api'),
    Type.Literal('cli'),
  ], { description: '終端類型' }),

  /** 終端名稱 */
  terminalName: Type.String({ description: '終端顯示名稱' }),

  /** 版本 */
  version: Type.String({ description: '實作版本 (Semantic Versioning)' }),

  /** 狀態 */
  status: Type.Union([
    Type.Literal('active'),
    Type.Literal('inactive'),
    Type.Literal('error'),
    Type.Literal('pending'),
  ], { description: '當前狀態' }),

  /** 連線狀態 */
  connection: Type.Union([
    Type.Literal('connected'),
    Type.Literal('disconnected'),
    Type.Literal('reconnecting'),
    Type.Literal('error'),
  ], { description: '連線狀態' }),

  /** 成功回傳 */
  success: Type.Optional(Type.Union([
    Type.String({ description: '成功回傳訊息' }),
    Type.Null({ description: '無成功回傳' }),
  ]), { description: '成功回傳內容' }),

  /** 錯誤回傳 */
  error: Type.Optional(Type.Union([
    Type.String({ description: '錯誤訊息' }),
    Type.Null({ description: '無錯誤' }),
  ]), { description: '錯誤回傳內容' }),

  /** 系統日誌 */
  logs: Type.Optional(Type.Array(Type.String())),
  /** 時間戳 */
  timestamp: Type.Number({ description: 'UTC 時間戳 (毫秒)' }),
});
```

### 2.2 終端狀態

```typescript
export const TerminalStateSchema = Type.Object({
  /** 標籤 */
  tags: Type.Array(Type.String()),

  /** 備註 */
  note: Type.Optional(Type.String()),

  /** 最近回報時間 */
  lastReport: Type.Number({ description: '最近回報時間戳 (毫秒)' }),
});
```

---

## 3. 起始矩陣 TypeBox 契約

> 起始矩陣（Initiated Matrix）定義輸入端（Source / Input）的型別契約。

### 3.1 核心 Schema

```typescript
// ─────────────────────────────────────────────
// 3.1 起始矩陣核心
// ─────────────────────────────────────────────

export const InitiatedMatrixSchema = Type.Object({
  /** 起始端識別碼 */
  sourceId: Type.String({ description: '起始端唯一識別碼 (UUID)' }),

  /** 起始端類型 */
  sourceType: Type.Union([
    Type.Literal('gateway'),
    Type.Literal('agent'),
    Type.Literal('webhook'),
    Type.Literal('api'),
    Type.Literal('cli'),
  ], { description: '起始端類型' }),

  /** 起始端名稱 */
  sourceName: Type.String({ description: '起始端顯示名稱' }),

  /** 任務資料 */
  payload: Type.Any({ description: '任務資料（依實作定義型別）' }),
});
```

### 3.2 輸入驗證

```typescript
export const InitiatedTaskSchema = Type.Object({
  /** 起始端任務名稱 */
  taskName: Type.String({ description: '任務名稱' }),

  /** 起始端任務參數 */
  params: Type.Union([
    Type.String(),
    Type.Number(),
    Type.Boolean(),
    Type.Array(Type.Any()),
    Type.Object(),
  ], { description: '任務參數' }),

  /** 起始端任務標籤 */
  tags: Type.Optional(Type.Array(Type.String())),

  /** 起始端任務重試次數 */
  retryCount: Type.Number({ default: 0 }),

  /** 起始端任務超時時間（毫秒） */
  timeout: Type.Number({ description: '超時時間（毫秒）' }),
});
```

### 3.3 雙向同步

```typescript
export const BidirectionalSyncSchema = Type.Object({
  /** 是否正在同步中 */
  isSyncing: Type.Boolean({ default: false }),

  /** 同步狀態：pending / syncing / synced / conflict */
  syncStatus: Type.Union([
    Type.Literal('pending'),
    Type.Literal('syncing'),
    Type.Literal('synced'),
    Type.Literal('conflict'),
  ], { default: 'pending' }),

  /** 最近同步時間 */
  lastSyncedAt: Type.Optional(Type.Number()),

  /** 併發次數 */
  concurrency: Type.Number({ default: 1 }),

  /** 最大重試次數 */
  maxRetry: Type.Number({ default: 3 }),
});
```

---

## 4. 雙向同步規則

### 4.1 規則一：版本一致性

```typescript
// 每次同步都需檢查版本一致性
const validationResult = schema.verify(payload);

if (validationResult !== null) {
  // 格式錯誤：回傳 400 Bad Request
  return { error: validationResult };
}

// 版本不一致：回傳 409 Conflict
if (source.version !== terminal.version) {
  return { error: 'VERSION_MISMATCH', code: 409 };
}
```

### 4.2 規則二：時間戳追蹤

```typescript
// 每次操作都需記錄時間戳
const now = Date.now();

// 輸出端包含 timeStamp
const terminalOutput = {
  ...terminalData,
  timeStamp: now,
  syncStatus: 'synced',
  lastUpdate: now,
};

// 輸入端也包含 timeStamp
const initiatedInput = {
  ...initiatedData,
  timeStamp: now,
};
```

### 4.3 規則三：版本鎖 (Version Lock)

```typescript
// 防止競態條件
const lock = new Map<string, number>();

function acquireLock(key: string, ttl: number = 60000): boolean {
  const now = Date.now();
  const existing = lock.get(key);

  if (existing && (now - existing) < ttl) {
    return false; // 鎖已存在且未過期
  }

  lock.set(key, now + ttl);
  return true;
}

function releaseLock(key: string): void {
  lock.delete(key);
}
```

### 4.4 規則四：Conflict 處理

```typescript
// 發生 Conflict 時的處理規則
export enum ConflictPolicy {
  /** 保留原值 */
  KEEP_OLD = 'keep_old',

  /** 採用新值 */
  USE_NEW = 'use_new',

  /** 合併 */
  MERGE = 'merge',

  /** 手動介入 */
  MANUAL = 'manual',
}

// 依據 conflictPolicy 決定處理方式
export function resolveConflict(
  oldValue: any,
  newValue: any,
  policy: ConflictPolicy
): any {
  switch (policy) {
    case ConflictPolicy.KEEP_OLD:
      return oldValue;
    case ConflictPolicy.USE_NEW:
      return newValue;
    case ConflictPolicy.MERGE:
      return { ...oldValue, ...newValue };
    case ConflictPolicy.MANUAL:
      throw new Error('Conflict: manual intervention required');
    default:
      throw new Error(`Unknown conflict policy: ${policy}`);
  }
}
```

### 4.5 規則五：Error 標準

```typescript
export const ErrorCodeSchema = Type.Object({
  code: Type.String({ description: '錯誤代碼 (ErrorMessage)' }),
  message: Type.String({ description: '人類可讀錯誤訊息' }),
  details: Type.Optional(Type.Any({ description: '詳細錯誤信息' })),
  timestamp: Type.Number({ description: '錯誤時間戳 (毫秒)' }),
  sourceId: Type.String({ description: '來源端識別碼' }),
  terminalId: Type.String({ description: '終端識別碼' }),
});

export type ErrorCode = Static<typeof ErrorCodeSchema>;
```

---

## 5. 編碼核心規範

### 5.1 基礎規則

```typescript
// ✅ 正確：使用型別檢查
const validate = (value: unknown, schema: TSchema): boolean => {
  const result = schema.verify(value);
  return result === null;
};

// ❌ 錯誤：避免 any 型別
const processData = (data: any) => {
  // ...
};

// ❌ 錯誤：避免 unknown 型別
const processUnknown = (data: unknown) => {
  // 必須先檢查型別
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid data type');
  }
};
```

### 5.2 型別安全

```typescript
// ✅ 正確：型別安全的輸入輸出
export interface TerminalInput {
  sourceId: string;
  sourceType: 'gateway' | 'agent' | 'webhook' | 'api' | 'cli';
  payload: unknown;
}

export interface TerminalOutput {
  terminalId: string;
  terminalType: 'gateway' | 'agent' | 'webhook' | 'api' | 'cli';
  version: string;
  success: string | null;
  error: string | null;
  timeStamp: number;
}

// ✅ 正確：型別驗證
import { Type, Static } from '@sinclair/typebox';

const TerminalInputSchema = Type.Object({
  sourceId: Type.String(),
  sourceType: Type.Union([
    Type.Literal('gateway'),
    Type.Literal('agent'),
    Type.Literal('webhook'),
    Type.Literal('api'),
    Type.Literal('cli'),
  ]),
  payload: Type.Union([
    Type.String(),
    Type.Number(),
    Type.Boolean(),
    Type.Array(Type.Any()),
    Type.Object(),
  ]),
});

type TerminalInput = Static<typeof TerminalInputSchema>;
```

### 5.3 貨幣型別 (Currency Types)

```typescript
// 貨幣型別定義
export const CurrencySchema = Type.Union([
  Type.Literal('USD'),
  Type.Literal('TWD'),
  Type.Literal('CNY'),
  Type.Literal('JPY'),
  Type.Literal('EUR'),
  Type.Literal('KRW'),
]);

// 貨幣與金額搭配
export const PriceSchema = Type.Object({
  amount: Type.Number({ description: '金額' }),
  currency: CurrencySchema,
  timestamp: Type.Number(), // 更新時間戳
});
```

### 5.4 標準錯誤碼

```typescript
export const ErrorMessage = Type.Union([
  Type.Literal('VALIDATION_ERROR'),
  Type.Literal('AUTHENTICATION_FAILED'),
  Type.Literal('AUTHORIZATION_FAILED'),
  Type.Literal('RATE_LIMIT_EXCEEDED'),
  Type.Literal('TIMEOUT'),
  Type.Literal('CONFLICT'),
  Type.Literal('NOT_FOUND'),
  Type.Literal('INTERNAL_ERROR'),
  Type.Literal('NETWORK_ERROR'),
  Type.Literal('PAYLOAD_TOO_LARGE'),
]);

export type ErrorMessage = Static<typeof ErrorMessage>;
```

### 5.5 標準回傳

```typescript
// 標準回傳格式
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: ErrorMessage;
    message: string;
    timestamp: number;
  };
}

// 成功回傳
export const successResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

// 錯誤回傳
export const errorResponse = (code: ErrorMessage, message: string): ApiResponse<null> => ({
  success: false,
  data: null,
  error: {
    code,
    message,
    timestamp: Date.now(),
  },
});
```

---

## 6. 違規檢測清單

### 6.1 編碼違規

| 違規類型 | 檢測方式 | 嚴重度 |
|----------|----------|--------|
| 使用 `any` 型別 | `grep -rn "any" *.ts` | 🔴 必須修正 |
| 使用 `unknown` 未檢查 | 檢查型別 | 🔴 必須修正 |
| 缺少 `Type` 定義 | 分析 schema 缺口 | 🟡 警告 |
| 缺少 `Static` 類型 | 分析 schema 缺口 | 🟡 警告 |
| 硬編碼 `any` | 分析 schema 缺口 | 🔴 必須修正 |

### 6.2 安全違規

| 違規類型 | 檢測方式 | 嚴重度 |
|----------|----------|--------|
| 硬編碼金鑰 | `grep -rn "password\|key\|secret" *.ts` | 🔴 必須修正 |
| 機密值寫入日誌 | 分析程式碼 | 🔴 必須修正 |
| 機密值寫入檔案 | 分析程式碼 | 🔴 必須修正 |
| 機密值共享 | 分析程式碼 | 🔴 必須修正 |

### 6.3 雙向同步違規

| 違規類型 | 檢測方式 | 嚴重度 |
|----------|----------|--------|
| 未提供 `syncStatus` | 分析 schema 缺口 | 🟡 警告 |
| 缺少 `lastUpdate` | 分析 schema 缺口 | 🟡 警告 |
| 缺少 `version` | 分析 schema 缺口 | 🟡 警告 |
| 未處理 `CONFLICT` | 分析 schema 缺口 | 🟡 警告 |

### 6.4 終端/起始端一致性

| 違規類型 | 檢測方式 | 嚴重度 |
|----------|----------|--------|
| 缺少 `terminalId` | 分析 schema 缺口 | 🔴 必須修正 |
| 缺少 `sourceId` | 分析 schema 缺口 | 🔴 必須修正 |
| 缺少 `version` | 分析 schema 缺口 | 🟡 警告 |
| 缺少 `timeStamp` | 分析 schema 缺口 | 🔴 必須修正 |

---

## 7. 版本歷史

| 版本 | 日期 | 說明 |
|------|------|------|
| 1.0 | 2026-11-03 | 初始版本，建立 TypeBox 終端/起始矩陣契約與編碼核心規範 |