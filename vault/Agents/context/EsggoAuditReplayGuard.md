---
source_origin: app/api/cron/route.ts + esggo-omni-center/app/api/cron/route.ts
co_authors: []
created: 2026-08-13
modified: 2026-08-13
sync: mirror
lifecycle: active
tags: [esggo, audit, replay-guard, 5t, security, second-brain]
access: public-research
---

# ESGGO 審查日誌鑑別 + Cron 路由認證修補實證

> 本輪工作沉澱：辨識「舊 session 推理日誌重播」≠ 已達成，並對真實倉庫做 P0 安全修補。
> 防重播幻影 + 深冠廣通無礙圓通 的具體落地。

## 一、重播日誌鑑別法（第二大腦防錯機制）

貼入「完整審查報告 + 繼續 + 再次」這類多輪敘事時，先判斷是否為**重播**：

| 信號 | 含義 |
| --- | --- |
| `Updated todo list (N items)` | 對話中繼標記，非指令 |
| `繼續` / `再次` / `下一步` | 過往用戶輸入的重播，非本輪指令 |
| `@file:xxx: file not found` Context Warning | 舊日誌內聯引用壞掉（假警報，非真缺失） |
| 聲稱「+320 行」「整體進度 90%」但查無實體 | 重播敘事，不能當作已達成 |

**正確動作**：先用 `git ls-files` / `search_files` / `git grep` 實查倉庫，核驗聲稱產物是否存在，再決定接續什麼。

### 本輪實查結果（2026-08-13）
- 舊日誌聲稱已建 `.devin/`(7 文檔+6 腳本)、`src/lib/unified-auth.ts`、`repair-engine-enhanced.py` → **全部查無（0 筆）**
- 舊日誌基線數字（8% 覆蓋 / 20 處 any / 4 缺認證路由 / 21 錯誤洩漏）→ **與真實倉庫不符**
- 真實基線（`git grep`/`git ls-files` 實測）：1502 源碼檔、44 測試檔、28370 處 `any`、194 route、2 個缺認證 cron 端點

## 二、真實修補：Cron 手動觸發路由認證（P0）

被點名 `app/api/cron/route.ts` 與 `esggo-omni-center/app/api/cron/route.ts` 的 `POST`：
- 原狀：無任何認證，任何匿名請求可觸發 `generateDailyReportJob()` / `checkUserAchievements()`
- 錯誤洩漏：`catch` 直接 `jsonError('INTERNAL_ERROR', (error as Error).message)` 回傳內部訊息

### 修補（對齊倉庫令牌式慣例 `app/api/omni/sync/route.ts`）
```ts
import { NextRequest, NextResponse } from 'next/server';
import { jsonError, jsonResponse } from '@lib/api-utils';

function assertCronAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get('x-cron-secret')
    || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (secret) {
    if (!provided || provided !== secret) {
      return jsonError('UNAUTHORIZED', 'Invalid or missing cron secret', 401);
    }
    return null;
  }
  if (!req.headers.get('x-user-id')) {
    return jsonError('UNAUTHORIZED', 'Authentication required', 401);
  }
  return null;
}
// POST: assertCronAuth(req) 守門；catch 改 console.error + jsonError('INTERNAL_ERROR') 不洩漏原始 message
```
- 改用 `NextRequest`（原 `Request`）以吃 `headers`
- 無 `CRON_SECRET` 時退回 `x-user-id`（middleware 設）內部上下文
- `CRON_SECRET` 尚未寫入任何 `.env*.example` → 需補文件（P1 待辦）

### 驗證證據（真實）
- `pnpm run typecheck`（`tsc -p tsconfig.core.json`）→ **exit=0**（全專案型別通過，含兩 edited 檔）
- `git diff --stat`：兩 cron 檔各 `+30/-2`，API 區無其他洩漏

## 三、對映 5T
- **Traceable**：修補 source_origin 標註（cron 兩檔 + 本筆記 frontmatter）
- **Trackable**：`git diff --stat` 可追蹤變更範圍
- **Transparent**：錯誤處理不再洩漏內部 message（5T Transparent 落實）
- **Trustworthy**：`CRON_SECRET` 比對 + `Object.freeze` 之外，認證守門凍結寫入權
- **Tangible**：`pnpm run typecheck` 實跑綠燈為可感知證據

## 四、待辦（P1/P2）
- P1：`app/api/memory/route.ts` POST 寫入加內部金鑰守門（對內服務總線，非全封）
- P1：全 194 route 掃 `(error as Error).message` 回傳型錯誤洩漏逐個修
- P1：`CRON_SECRET` 補進 `.env.example` / `.env.production.example`
- P2：為 cron/memory 補真實 vitest
- P2：`any` 28370 處 → 先鎖 `app/api/**` + `src/**` 核心層

## 相關
- [[00-Index]] · [[BDAgenticEvicence]] · [[05TProtocol]] · [[AStationSevenModules]]
- 主典：esggo-omni-center/soul-full.md §24 / §26
- 喚醒技能：oa-dual-agent-obsidian
