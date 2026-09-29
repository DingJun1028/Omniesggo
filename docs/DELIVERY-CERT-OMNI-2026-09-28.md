---
source_origin: 萬能分身 session 20260925_224102（測試重寫 + 根因修復 + runtime 缺陷修補）
created: 2026-09-28
modified: 2026-09-28
lifecycle: active
scope: packages/omni-agent-bus、packages/* 型別根因、packages/omni-ui runtime
related_cert: docs/DELIVERY-CERT-2026-09-28.md（另一 session，涵蓋 commit 1-4 中之 3 筆）
---

# 交付證書：測試驗證力 × 依賴根因 × 執行期缺陷

> 本證書**只涵蓋本 session 的工作**。同日另一萬能分身 session 已產出
> `DELIVERY-CERT-2026-09-28.md`，涵蓋依賴安全閉環（4 commits）。兩者範圍部分重疊
> （`e66473548` 由本 session 產出、由該 session 驗證後提交），互補而不重複。

## 專案識別

| 欄位 | 值 |
|------|-----|
| 分支 | `feat/oa-swarm-array-routing-ws-auth`（ahead 3） |
| 交付日期 | 2026-09-28 |
| 型別錯誤 | 22 → **0**（15 個套件全掃） |
| 淨變更 | 14 個檔案，**+438 / −12**（A 已提交 5 檔 +26/−8；B 已提交 8 檔 +410/−2；C 未提交 1 檔 +2/−2） |

## 本次交付的四項

### 1. 測試驗證力（可證偽的測試，非裝綠）

`packages/omni-agent-bus` 原有測試只做**維度級**斷言（`defeatsOnly(dim)`），
對 `GATE_PATTERNS` 五條正則的多關鍵詞分支**無偵測力**。改寫為維度 × 關鍵詞矩陣。

以 **mutation test** 證明測試真的會紅，而非僅編譯通過：

| 注入缺陷 | 測試是否變紅 |
|---------|------------|
| 移除單一關鍵詞分支 | ✅ 變紅 |
| 移除整條正則 | ✅ 變紅 |
| 移除維度清單整項 | ✅ 變紅 |
| **還原先前「只修一半」的修法** | ✅ 變紅（見下）|

**關鍵事實**：審查者指出「根因只解一半」時，我的第一版修法仍讓一個 mutant 存活。
是 mutation test 而非人工審查發現此事。**若無 mutation，該缺陷會靜默通過。**

### 2. 依賴根因（治本，非逐包打補丁）

`@types/uuid@~11.0.0` 為**已棄用空殼**（`"main": ""`、無 `index.d.ts`）。tsc 未設
`types` 欄位時會自動向上納入**所有** `@types/*`，於是任何未設 `types` 的子套件
`tsc` 皆爆 `TS2688: Cannot find type definition file for 'uuid'`。

- 全 repo `git grep` 確認**無人 `import 'uuid'`** → 該套件為純死重
- 從根 `package.json` 移除 + 更新 `pnpm-lock.yaml`（1m14s，安裝成功）
- **實驗證實**：移除後，該套件**不設 `types` 也能建置**（exit 0）
  → 證實我先前的 `tsconfig` 修法是**貼膠布**
- 仍保留 `"types": ["node"]`，理由改為**確定性**與 7 個兄弟套件慣例一致

回歸驗證：主應用 `typecheck.core` exit 0、`core.test.ts` 14 passed。

### 3. 執行期缺陷（非本次修復造成，驗證時發現）

`LiquidGlassRenderer` / `FloatingCore` 建構子為
`config ? { ...config } : { ...DEFAULT_X }` —— **部分設定不與預設值合併**。

實測 `new LiquidGlassRenderer({ blur: 33 })` 產出**無效 CSS**：

```
❌ background: rgba(16, 36, 63, undefined)
```

**嚴重度如實評估**：`LiquidGlassConfig` 欄位標為必填，全型別 TS 呼叫端
**編譯期即被擋下**（探針需 `as` cast 才觸發）。屬既存缺陷，僅 JS 呼叫端或
unsound cast 可達。**不誇大為嚴重問題。**

修為淺合併（2 行）。三種輸入皆無回歸：完整設定 ≡ 原樣；`undefined` ≡ 原預設；
部分設定由 `undefined` 變有效值（純改善）。巢狀 `position` 安全（傳入即整個覆蓋）。

### 4. 22 個型別錯誤 → 0（4 套件，差異審查）

| 套件 | 基準 | 修法性質 | 作弊掃描 |
|------|------|---------|---------|
| `omni-ui` | 16 | 補 `private readonly config` 欄位宣告（單一根因） | 0 |
| `shared` | 4 | jose v6 匯入、local-store 預設匯入、`tx: PrismaClient` 簽名 | 0 |
| `omni-memory` | 1 | `this.configServiceId` → `this.config.serviceId` | 0 |
| `i18n` | 1 | 補 `I18nBundle` 型別匯入 | 0 |

**審查界線**：`as any` / `as unknown` / `@ts-ignore` / `@ts-expect-error` /
`@ts-nocheck` **新增 0 處**；`strict` 系列旗標**未動**；變更 26 增 8 刪。

**審查中推翻自身的疑慮**：我一度懷疑 `auth.ts` 移除 `{merge:true}` 造成資料遺失。
讀 `src/lib/local-store.ts:6`（`set: (data) => Promise.resolve()` 的 no-op stub）
後**確認我錯了** —— JS 對單參數函式丟棄額外引數，**原本就從未生效**。修補行為等價。

## 驗證結果（全部為實跑輸出）

```
【1】全庫型別       掃描 15 個套件 → 合計 0 錯（基準 22）
【2】主應用         typecheck.core exit=0 · core.test.ts 14 passed
【3】omni-agent-bus build/typecheck/typecheck:test/test 皆 exit=0
                     dist 25 js + 25 d.ts · dist-smoke exit=0
【4】runtime 探針   OMNI_UI_RUNTIME_OK · PARTIAL_CONFIG_OK（皆 exit 0）
【5】乾淨重建       50 檔 → 清空 → 50 檔，數量吻合（證明無殘留過期檔）
【6】依賴稽核       pnpm audit: info 0 low 0 moderate 0 high 0 critical 0
```

### 全庫健康度（因全庫 vitest 總時長約 9 分鐘超過工具 420s 硬上限，改以分段跑完）

以 `find` 枚舉的 **42 個測試檔全數執行**，7 段合計 **422 tests、0 失敗**：

| 分段 | 測試檔 | Tests | 耗時 |
|------|-------|-------|------|
| `src/lib` | 7 | 73 passed | 45s |
| `src/core` | 6 | 92 passed | 33s |
| `src/agents` | 6 | 44 passed | 35s |
| `src/__tests__` + `src/impl` | 7 | 60 passed | 38s |
| `src/components` + `incremental-output` + `middleware` + `oa-integration` | 5 | 18 passed | 53s |
| `packages/` | 9 | 68 passed | 79s |
| `oa-swarm` + `ftg-3.0` + `gateway` | 5 | 67 passed | 16s |
| **合計** | **45 次計數** | **422 passed / 0 failed** | ~5 min |

**全庫 vitest 超時並非測試掛住**，而是總時長 ~9 分鐘超出工具硬上限。逐段實測無任何
檔案逾時或失敗。

| 閘 | 指令 | 結果 |
|----|------|------|
| Lint | `pnpm run lint`（`ts-node scripts/celestial-gate.ts`）| `32 problems (0 errors, 32 warnings)`，`✅ 核心目錄通過熵境門檻` |
| TS 矩陣 | `node tools/ts-matrix/verify.mjs` | exit 0 · lock 連 3 次穩定 `3702e54f…` |

`lint` 的 0 errors / 32 warnings 與另一 session 證書宣稱的數字**完全一致**，屬獨立證實。

### 全庫熵減（commit `ac28f7dd1`）

`pnpm run lint` 警告 **32 → 7**（減 78%），0 errors 維持；`no-unused-vars` 全數清零。
13 檔 **+22 / −34**（淨減 12 行）。每一處均先 grep 查證使用情形才動手。

**死碼（需判斷，非機械刪除）**

- **三個 health 路由的 `const cpu = os.loadavg()[0]`** —— 同一段程式碼被
  copy-paste 三份（`health/route.ts`、`health-metrics/route.ts`、
  `health/metrics/route.ts`）。實測 `os.platform()` = `win32`、
  `os.loadavg()` 恆為 `[0,0,0]`，且該值從未進入 metrics 模板。
  **刻意「補上 CPU 指標」是錯的選擇** —— 會輸出一個恆為 0、在 Prometheus
  看似「CPU 閒置」的誤導 gauge，比沒有更糟。故刪除，並連帶移除僅供其使用的
  `import os`。首次只修了 1 份，經 lint 掃描才發現另有 2 份。
- `omnitag-contract.ts` 的 `SQUAD_SET` —— 5 個 squad 名稱完整保留於
  `src/core/omnitag_registry.py`，移除不損失資訊。
- `omni-kernel.ts` 的 `register<T>` —— `<T>` 從未用於簽章，且專案程式碼
  無任何 `.register<Type>()` 顯式型別引數。

**未使用匯入（10 處）** —— 僅移除 flagged 名稱，保留同一匯入中仍有使用的成員
（例：`api-gateway.ts` 的 `import { freeze, uuidV4, OA_VERSION }` 只刪 `OA_VERSION`）。

**未使用參數** —— 依 eslint 規則自身的 `/^_/u` 慣例處理而非刪除（這些是刻意的
API 相容 stub，註解明寫「GCP Firebase Auth 已停用，本地模式降級回 null」）。

### 驗證方法論教訓（重要）

本次曾以 `tsconfig.core.json` 驗證 `src/lib` 的變更，但該設定的 `include` 僅含
`src/impl`、`src/lib/omni-core`、`src/lib/cloudflare`、`lib/types` ——
**不含 `src/lib/unified-auth.ts`**，因此把「實際有使用」的參數 `config` 誤改名為
`_config` 時，檢查回報 exit 0（假綠），該 bug 會在執行期拋 `ReferenceError`。

補救與防再發：
1. 逐一大括號配對切出函式本體，確認 3 個 `_config` 函式體內 0 個裸 `config`、
   2 個 `config` 函式有 3–4 處使用（`verify-params.js`，問題數 0）
2. `src/lib` 的驗證一律改用 `tsconfig.json`（確認涵蓋 2/2 目標檔案）

**教訓：全域檢查通過不等於本次變更被檢查到。必須確認檢查工具的覆蓋範圍包含變更檔案。**

## 工具自述與觀察事實矛盾處（以實測為準）

兩批 subagent 皆回報「8 分鐘無進度已取消」之**失敗**。實測 `shared` / `i18n` /
`omni-memory` / `omni-ui` 全部 exit 0，修復在磁碟且在 HEAD（`e66473548`）。
**協調層監控逾時 ≠ 工作失敗。**

### 本證書自身的更正

初稿的「淨變更 +31 / −11」是**憑印象填入、未經實測**的數字。交付前逐項核對時以
`git show --numstat` 查出真值為 **+438 / −12**，已更正。記錄於此係因
**交付文件本身也必須通過零幻覺驗算**，不得成為唯一未經驗證的環節。

## 未解決事項（如實記錄）

| 項目 | 狀態 | 原因 |
|------|------|------|
| omni-agent-bus 工作混在 `5e91a11e0` | 未拆分 | 該提交訊息為 ws-auth CI 修復，與本工作無關。**未重寫他人提交**，留待決策 |
| 本證書所述變更 | **未提交** | 分支正被其他 worker 作業，提交需協調 |
| `setFirestoreDoc` 為死碼 | 未修 | 全 repo 零呼叫端，且無條件 import no-op stub，從未真正寫入資料。屬既存設計問題 |
| 10 項鐵律閘 9/10 | 紅燈非本工作 | 覺一 紅燈指向 `docs/DELIVERY-CERT-2026-09-28.md`（另一 session 產物，untracked） |

## 5T 對照

| 面向 | 本次實踐 |
|------|----------|
| Traceable | 每項修復對應 commit hash 與檔案行號；探針位於 `.hermes/probe/`（gitignored） |
| Trackable | 驗證指令與 exit code 全部可重現；基準 22 為客觀值 |
| Tangible | 22 錯→0 為使用者可見的開發體驗改善；omni-ui 修補後 CSS 有效 |
| Transparent | 明列 4 項未解決事項；主動推翻自身對 merge 語義的錯誤疑慮 |
| Trustworthy | 以 mutation test 證明測試會紅；乾淨重建 50→0→50 證明無殘留 |

## 交付狀態

- [x] 全庫 22 型別錯誤 → 0，實測複核
- [x] 測試驗證力經 mutation 證明（非僅編譯通過）
- [x] 依賴根因治本，零回歸
- [x] 執行期無效 CSS 缺陷修補並經探針驗證
- [ ] 提交（需與其他 worker 協調分支）
- [ ] 拆分 `5e91a11e0`（需決策是否 rebase）

```
靈魂簽章：Queen Bee & Team OA-Team
5T 狀態：22→0 · mutation 證明 · 根因治本 · 4 項未解決如實記錄
刻印狀態：VERIFIED
```
