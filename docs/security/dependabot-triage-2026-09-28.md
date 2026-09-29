# Dependabot 安全告警評估與修復計畫（2026-09-28）

**狀態：ASSESSMENT ONLY — 未套用任何修復。**
資料來源：`gh api repos/DingJun1028/esggo/dependabot/alerts?state=open --paginate`（59 筆）＋
各子專案 `pnpm audit --json`（含 `--ignore-workspace`）＋ manifest / lockfile / CI workflow 靜態追蹤。

---

## 0. TL;DR

| 結論 | 數字 |
|---|---|
| 開啟告警總數 | 59（12 critical / 13 high / 31 moderate / 3 low） |
| 去重後「(advisory × package)」唯一組合 | **34**（重複因子 1.74×） |
| 真正落在 production runtime dependency 上的 | **4 筆**（全部 `my-worker` 的 `fast-uri`） |
| 12 critical 的實質內容 | **只有 1 個 advisory**：`GHSA-5xrq-8626-4rwp`（vitest UI RCE），散佈在 12 個 manifest |
| 12 critical 中在 root workspace 內、且已被 override 修掉 | 10（phantom） |
| 12 critical 中真實存在、但僅限 test-runner | 2（`oa-swarm` 的獨立 lock） |
| 建議實際動工 | **1 個 P0、2 個 P1、1 個 P2、1 個 P3（治理）** |

> **一句話判斷**：這批告警的「critical」標籤嚴重誤導。12 critical 無一可被遠端利用，
> 但有 4 筆 high（`fast-uri` SSRF / host confusion）確實掛在 `@notionhq/workers` 的 production
> dependency 鏈上，是唯一值得優先動工的項目。

---

## 1. 為什麼 59 個告警其實只有 34 個問題

Dependabot 對 **每個 manifest × 每個 advisory** 各開一筆。同一個套件出現在多個 manifest 就重複計數：

| manifest | 告警數 | critical | 性質 |
|---|---|---|---|
| `apps/learning-center/pnpm-lock.yaml` | 18 | 0 | 巢狀 workspace 的獨立 lock（**部分有效**，見 §4） |
| `my-worker/pnpm-lock.yaml` | 16 | 0 | 完全獨立、非 workspace 成員（**有效**） |
| `libs/incremental/pnpm-lock.yaml` | 7 | 1 | **孤兒 lock**（根 workspace 已有同 importer） |
| `oa-swarm/pnpm-lock.yaml` | 7 | 1 | 獨立 lock，**真實生效** |
| 10 × `*/package.json`（vitest 宣告範圍） | 11 | 10 | **phantom**（override 已在安裝時覆寫） |
| `oa-swarm/package.json` | (含上) | 1 | 真實（vitest `^2.1.0` 宣告） |

---

## 2. 12 CRITICAL 逐案分析 — 全部是 vitest 同一個 advisory

**唯一 advisory：`GHSA-5xrq-8626-4rwp`**
> *When Vitest UI server is listening, arbitrary file can be read and executed*
> fix version: `3.2.6`

### 2.1 可利用性判定：不可利用

| 檢查項 | 結果 | 證據 |
|---|---|---|
| 是否為 production dependency？ | ❌ 全部是 `devDependencies` | 10 個 manifest 的 vitest 皆在 `devDependencies` |
| 程式碼是否啟用 Vitest UI？ | ❌ **零引用** | `grep '@vitest/ui'` 全 repo → 0 hits；無 `--ui` 參數 |
| test script 內容 | `vitest run`（一次性，非 watch、非 UI） | `libs/incremental`、`packages/omni-ui`、`oa-swarm` 的 `scripts.test` |
| oa-swarm 的 vitest 是否在 CI 執行？ | ❌ 否 | `ci.yml:357-358` 只跑 `node oa-swarm/scripts/verify-oa-gap.mjs`，不跑 vitest |

**結論**：GHSA-5xrq-8626-4rwp 的觸發前提是「Vitest UI server 正在監聽」並讓攻擊者能連線到它。
本 repo 從未安裝 `@vitest/ui`、從未以 `--ui` 啟動、且這些 vitest 不在 CI 路徑上。
**遠端可利用性 = 0。** 這 12 筆是 severity 標籤與實際暴露面脫節的典型案例。

### 2.2 但其中 10 筆是 phantom —— 連「存在」都不成立

這 10 個 manifest：`packages/{i18n,omni-bridge,omni-core,omni-db,omni-forge,omni-memory,omni-tag,omni-ui}/package.json`
＋ `libs/incremental/package.json`。

它們宣告 `vitest: ^1.6.0` 或 `^2.0.0`（宣告層面確實 < 3.2.6 → Dependabot 開單），
但根 `pnpm-workspace.yaml:58` 已有：

```yaml
vitest: ">=4.1.11"
```

實機驗證（root `pnpm-lock.yaml` importer `libs/incremental`）：

```yaml
libs/incremental:
    devDependencies:
      vitest:
        specifier: '>=4.1.11'
        version: 5.0.1(...)
```

磁碟實測 `libs/incremental/node_modules/vitest/package.json` → **5.0.1**。
`packages/omni-core`、`packages/i18n` 同為 5.0.1。

→ **這 10 筆 critical 在安裝後不存在**，純屬 Dependabot 讀 manifest 宣告字串的機械式誤報。
`libs/incremental/pnpm-lock.yaml`（vitest 2.1.9）亦同 — 該 lock 是孤兒檔，
根 `pnpm-lock.yaml:514` 已有 `libs/incremental` importer，CI 一律走 `--frozen-lockfile` 根安裝。

### 2.3 真正存在的 2 筆：`oa-swarm`

`oa-swarm/package.json` + `oa-swarm/pnpm-lock.yaml` 解析到 `vitest@2.1.9`（確實 < 3.2.6）。

**這裡發現一個 workspace 治理缺陷**：`pnpm-workspace.yaml` 的註解宣稱
> 「源碼層 oa-swarm/ 已納回根 workspace（上方未排除）」

但 `packages:` 的 glob 實際是 `apps/*`、`apps/*/functions`、`cli/*`、`packages/*`、`libs/*`、`.`
—— **`oa-swarm/` 不符合任何一條 glob**。實測 `pnpm ls -r` → 39 個 project，
`has oa-swarm: False`。註解與實際設定不符，導致根 override 對 oa-swarm 完全不生效。

（`my-worker` 同樣 `has my-worker: False`，但這個是**刻意**的，見 §3。）

---

## 3. HIGH 13 筆 — 依可利用性分三級

### P0（唯一真正值得優先動工）：`my-worker` × `fast-uri` × 4

| advisory | 內容 | severity |
|---|---|---|
| `GHSA-f65p-4m7j-42xc` | SSRF via malformed IPv6 normalization | high |
| `GHSA-fph4-wmhf-6fwf` | SSRF via repeated hostname percent-decoding | high |
| `GHSA-jqff-g426-hqxp` | host confusion via percent-encoded scheme normalization | high |
| `GHSA-5jgf-p345-68v8` | host confusion via skipped IDN canonicalization | high |

依賴鏈（`pnpm audit --ignore-workspace` 於 `my-worker/` 實測）：

```
.> @notionhq/workers > ajv > fast-uri@3.1.5
.> @notionhq/workers > ajv-formats > ajv > fast-uri@3.1.5
```

**為什麼是 P0（相對）**：
- `my-worker/package.json` 的 `dependencies` 只有一項：`"@notionhq/workers": "^0.8.10"`。
  `fast-uri` 是它的**生產依賴鏈**，不是 dev tool。
- SSRF / host confusion 這類 advisory 一旦 worker 上線並處理外部輸入即可被利用。
- 根 workspace 已有正確 override（`pnpm-workspace.yaml:26` `"fast-uri": ">=3.1.6 <4"`），
  **但 my-worker 不在 workspace，override 對它無效** → 這是「配置缺口」而非「技術難題」。

**緩解事實（誠實揭露）**：`my-worker` 目前**沒有部署管線**。
- 根 `wrangler.toml:2` 的 `main = "worker/src/index.ts"`，不是 my-worker。
- `deploy-worker.yml` 的 `working-directory: worker`，不涉及 my-worker。
- `my-worker/` 無 `wrangler.toml`、無 `node_modules`、無任何 workflow 引用。
→ **當前無 production 暴露面**，但依賴鏈是 prod dep，屬於「上線即中招」型風險。

### P1：`esggo-auto-repair` Worker 的 `hono`（7 筆，1 high-class ReDoS + 5 moderate + 1 low）

`apps/learning-center/pnpm-lock.yaml` 中的 7 筆 hono 告警全部來自同一個 importer：

```
esggo-auto-repair/worker > hono@4.12.32
```

| advisory | 內容 | severity |
|---|---|---|
| `GHSA-8j4g-w8fx-2239` | ReDoS in CORS middleware via `Access-Control-Request-Headers` | moderate |
| `GHSA-g6gw-c38x-mqfc` | Unbounded dot-notation nesting in `parseBody()` → memory exhaustion | moderate |
| `GHSA-f23p-vx2j-j53r` | `memo()` retains SSR output across requests → cross-user data disclosure | moderate |
| `GHSA-crvj-82cr-hjcx` | Query parser reads params after URL fragment → cache-key differential | moderate |
| `GHSA-gqvv-2mrq-wpjv` | `toSSG()` writes files outside output dir | moderate |
| `GHSA-54fx-42gc-7vw4` | Algorithmic Complexity DoS in Language Middleware | moderate |
| `GHSA-79qm-7rj5-m7r9` | Proxy helper 不移除 `Connection` header 列出的 response headers | low |

**這是全批唯一「production 程式碼路徑」的高價值修復**，因為：
- `apps/learning-center/esggo-auto-repair/worker/src/index.ts:1-3` **實際 import 了**
  `Hono`、`hono/cors`、`hono/http-exception`，並在 line 119 註冊為 `fetch: app.fetch`（Cloudflare Worker handler）。
- 該 worker 有 `wrangler.toml`（含 queues producer/consumer 設定）→ 是設計上要上線的元件。
- `hono/cors` 的 ReDoS 與 `parseBody()` 的記憶體耗盡都對「已部署的 HTTP 入口」有實質意義。

**緩解事實**：目前**沒有任何 CI workflow 部署這個 worker**
（`grep 'wrangler deploy' .github/workflows/` → 僅 `deploy-worker.yml`，指向 `worker/`）。
`esggo-auto-repair/worker` 也**不在根 lockfile** 中（`grep -c auto-repair pnpm-lock.yaml` → 0），
它由 `apps/learning-center/pnpm-workspace.yaml` 這個**巢狀 workspace** 管理。
→ 有效但需獨立 lock 的手動/外部部署路徑，非 root `pnpm audit` 可見。

### P2：其餘 8 筆 high — 全為 dev/build-time-only

| manifest | 套件 | 依賴鏈 | 為何不急 |
|---|---|---|---|
| `apps/learning-center` | `js-yaml` ×2 | `eslint>@eslint/eslintrc>js-yaml` | 純 lint 期，處理的是 repo 自己的靜態資源，非使用者輸入 |
| `apps/learning-center` | `undici` ×1 (high) | `vitest>jsdom>undici`, `wrangler>miniflare>undici` | test runner / 本地模擬器 |
| `apps/learning-center` | `sharp` | `wrangler>miniflare>sharp` | wrangler dev server 依賴 |
| `libs/incremental` | `vite` | `vitest>vite` | devDependency；且屬孤兒 lock |
| `oa-swarm` | `vite` | `vitest>vite` | devDependency，CI 不執行 |
| `my-worker` | `sharp` ×2 | `wrangler>sharp` | wrangler devDep |
| `my-worker` | `ws` | `wrangler>miniflare>ws` | wrangler devDep |

**my-worker 12 筆非 fast-uri 的告警全部來自 `wrangler@3.114.17` → `miniflare`**
（`undici@5.29.0` ×9、`ws@8.18.0` ×2、`sharp@0.33.5` ×2、`esbuild@0.17.19` ×1 —— 合計 14 筆含 moderate）。
全在 `devDependencies` 的 wrangler 之下，且該 worker 未部署。

---

## 4. 31 moderate + 3 low 的壓縮视图

同樣按「誰拉進來的」分類：

| 類別 | 筆數 | 依賴鏈 | 判定 |
|---|---|---|---|
| `hono` | 6 mod + 1 low | `esggo-auto-repair/worker>hono` | **見 P1** |
| `undici` | 9 | `vitest>jsdom`, `wrangler>miniflare` | dev |
| `vite` | 4 | `vitest>vite` | dev |
| `vitest` + `@vitest/mocker` | 7 | 直接 | dev（且根 workspace 已被 override 修掉） |
| `esbuild` | 3 | `vitest>vite>esbuild` / `wrangler>esbuild` | dev server |
| `postcss` | 1 | `tailwindcss>postcss` | **build-time**；處理 repo 自己的 CSS，非使用者輸入 |
| `undici` low ×2 | 2 | `wrangler>miniflare>undici` | dev |

### LC 的 18 筆中，哪些是真的？

`apps/learning-center/pnpm-lock.yaml` 是**有效的獨立 lock**（由巢狀
`apps/learning-center/pnpm-workspace.yaml` 管理）。但它的多數告警在 root 安裝下已被 override 蓋掉：

| 套件 | LC lock 解析 | root lock 解析 | 差異 |
|---|---|---|---|
| `hono` | 4.12.32 ⚠️ | **4.13.8** ✅ | LC 是 nested workspace，root override 不覆寫它 |
| `sharp` | 0.35.2 ⚠️ | **0.35.4** ✅ | 同上（且 LC 那條來自 wrangler devDep） |
| `undici` | 7.28.0 ⚠️ | **7.29.0** ✅ | 同上（且來自 jsdom/miniflare） |
| `js-yaml` | 4.3.0 ⚠️ | **5.3.0** ✅ | 同上（且來自 eslint） |
| `vite` | 7.3.6 ✅ | 8.1.3 | 兩者皆 > fix 6.4.3 |
| `vitest` | 4.1.10 ✅ | 5.0.1 | 兩者皆 > fix 4.1.11 |

**關鍵洞察**：`hono` 是唯一一個「LC lock 內部偏低、且根 override 無法制約、且程式碼真的在用」的套件。
其餘 LC 告警要嘛已被 root override 修掉，要嘛只經由 dev toolchain 進入。

---

## 5. 修復計畫（依優先序；本輪不執行）

### P0 — `my-worker` fast-uri SSRF / host confusion（4 high）

**為何先做**：唯一的 production dependency 鏈；修法成本極低。

**建議修法**：`my-worker/` 建立獨立的 `pnpm-workspace.yaml`，納入與根一致的安全 override。
（my-worker 已有自己的 `pnpm-lock.yaml`，加 workspace 檔不影響 CI —— 目前無 CI 安裝它。）

```yaml
# my-worker/pnpm-workspace.yaml（新增）
overrides:
  "fast-uri": ">=3.1.6 <4"   # 與根 pnpm-workspace.yaml:26 對齊
```

驗證：`cd my-worker && pnpm install && pnpm audit --ignore-workspace` → fast-uri 歸零。

**若要更徹底**：`@notionhq/workers` 若有釋出版本將 `ajv` 升級到用 `fast-uri>=3.1.6`，
可直接 bump；否則 override 是唯一無副作用路徑。**不要**為了消 alert 去 bump `@notionhq/workers` major。

---

### P1 — `esggo-auto-repair` Worker 的 hono 7 筆（1 ReDoS + 5 moderate + 1 low）

**建議修法**：在 `apps/learning-center/pnpm-workspace.yaml` 新增 overrides
（該檔目前只有 `packages` / `allowBuilds`，無 overrides 區塊）。

```yaml
# apps/learning-center/pnpm-workspace.yaml（新增）
overrides:
  "hono": ">=4.13.5 <5"        # 對齊根 pnpm-workspace.yaml:67
```

驗證：`cd apps/learning-center && pnpm install && pnpm audit --ignore-workspace` → hono 7 筆歸零。
再跑 `cd apps/learning-center/esggo-auto-repair/worker && npx tsc -p tsconfig.json` 確認 typecheck 綠燈
（該 worker 的 `lint` script 就是 tsc，見其 package.json）。

**為何選 override 而非 bump 宣告**：`hono` 在該 worker 是 **devDependency**
（`apps/learning-center/esggo-auto-repair/worker/package.json`），但 wrangler 會把 devDep 一起 bundle。
bump `^4.12.32` → `^4.13.5` 是同 major 的 minor 升級，風險低；override 同樣安全且能連帶修正 nested workspace 中其他位置。
兩者可並行（override 為主，宣告同步為佳）。

---

### P2 — 治理：消除 phantom 告警（10 critical + 7 libs/incremental lock）

這是**唯一能讓 critical 數字實際歸零**的動作，而且**零程式碼風險**。

1. **消除 phantom critical（10 筆）**
   將 9 個 `packages/*/package.json` 的 `vitest` 宣告由 `^1.6.0` / `^2.0.0` 更新為
   與 override 一致的 `>=4.1.11`（或 `^5.0.1`）。
   磁碟實測已是 5.0.1 → **純宣告面對齊，安裝結果不變**，零風險。
   `libs/incremental/package.json` 同步。

2. **刪除孤兒 lock `libs/incremental/pnpm-lock.yaml`（7 筆，含 1 critical）**
   證據：根 `pnpm-lock.yaml:514` 已有 `libs/incremental` importer；所有 CI 一律
   `pnpm install --frozen-lockfile` 於根執行。該檔自 2026-08-16 未更新（根 lock 為 09-28）。
   刪除前請確認無任何腳本 `cd libs/incremental && pnpm install`。

---

### P3 — `oa-swarm` vitest 2.1.9（1 critical + 6 moderate，test-runner only）

**這裡有兩個選項，需要你決定，因為涉及 workspace 結構變更：**

- **選項 A（推薦，結構性修正）**：修正 `pnpm-workspace.yaml:22-24` 那段**與事實不符的註解**。
  `oa-swarm/` 目前不符合任何 glob。應二選一：
  - A1：真的把 `oa-swarm` 加進 `packages:`（例如新增 `- 'oa-swarm'`），
    讓根 override 生效，同時把 `vitest` 宣告拉到 `>=4.1.11`。**但這會改變 CI 的 install 圖**，
    需確認 `ci.yml:342-371` 的 gate 與 `--frozen-lockfile` 不會因此 ERR_PNPM_OUTDATED_LOCKFILE
    （該註解記載 2026-08-17 正是因類似問題踩過坑）。
  - A2：承認 oa-swarm 是獨立部署單元（`Dockerfile` 只 `COPY package.json` + `COPY dist`，
    不做 install；PM2 跑 `dist/index.js`），**修正註解說明這是刻意的**，
    並在 `oa-swarm/pnpm-workspace.yaml`（需新建）加同款 overrides。

- **選項 B（最小改動）**：只在 `oa-swarm/package.json` 把 `vitest: ^2.1.0` → `>=4.1.11`，
  重跑 `oa-swarm` 的 install 更新其獨立 lock。不碰 workspace 結構。

**注意**：這 1 critical 無遠端可利用性（vitest 不在 CI 路徑、Docker 映像不含 devDeps）。
P3 是**衛生工作，不是緊急威脅**。

---

### 明確不建議做的事

| 動作 | 理由 |
|---|---|
| `pnpm audit fix` / 任何全自動修復 | 會改寫 39 個 workspace project 的 lockfile；本 repo 已有多處註解記載跨 major 踩坑（undici@8 破壞 jsdom、apps/* glob 污染、ERR_PNPM_OUTDATED_LOCKFILE） |
| 為了消 12 critical 去升 `vitest` 到 3.2.6 | 這是 **downgrade**（5.0.1 → 3.2.6），會退掉 `@vitest/mocker` 等已修 advisory |
| 把 `esbuild` / `vite` override 放寬跨 major | 根 override 已有 `<1` / `<9` 上界且當前解析值安全（esbuild 0.28.1、vite 8.1.3） |
| bulk-dismiss 59 筆 | 會把 P0 的 `fast-uri` 一起消掉。真要 dismiss，只針對 §3 P2 那 8 筆 dev-only high，且必須附書面理由 |

---

## 6. 附帶發現（不屬本次 59 筆，但違反自家規範）

`pnpm-workspace.yaml` 多處 override 使用**裸 `>=` 無上界**，與 AGENTS.md #4 衝突
（「Never use bare `>=` without upper bound — pnpm may jump across major versions」）。
實際有跨 major 風險者：

| 行 | override | 現況解析 | 風險 |
|---|---|---|---|
| 21 | `"postcss": ">=8.5.23"` | 8.5.26 | 低（patch 線） |
| 24 | `"minimatch": ">=9.0.7"` | — | 中 |
| 27 | `"fast-xml-parser": ">=5.10.1"` | — | 中 |
| 28 | `"brace-expansion": ">=5.0.9"` | — | 中 |
| 44 | `"@google/adk": ">=1.6.1"` | 2.0.0 | **已跨 major** |
| **58** | **`"vitest": ">=4.1.11"`** | **5.0.1** | **已跨 major**（4→5） |
| 69 | `"sharp": ">=0.35.0"` | 0.35.4 | 中（0.x 語意下 minor 即 breaking） |
| 78 | `"mysql2": ">=3.23.1"` | 3.23.1 | 低 |

`vitest` 這條最值得注意：**它正是本次 12 critical 的同一個套件**，
而 override 已無聲地把它推到 5.0.1（跨 major）。建議補上 `>=4.1.11 <5` 或 `>=5.0.1 <6`，
否則未來 vitest 6 出來時會自動跳過去。

---

## 7. 執行順序建議

```
1. P2  對齊 9 個 packages/* vitest 宣告 + 刪 libs/incremental/pnpm-lock.yaml
        → critical 由 12 降至 2，零安裝風險
2. P0  my-worker/pnpm-workspace.yaml + fast-uri override
        → 4 筆 production SSRF 歸零
3. P1  apps/learning-center/pnpm-workspace.yaml + hono override
        → 7 筆 worker runtime 告警歸零
4. P3  oa-swarm 結構決策（A1 / A2 / B）+ vitest 宣告更新
        → 最後 1 critical + 6 moderate 處理
5.  修補 pnpm-workspace.yaml 裸 >= 上界（§6）
```

每一步的本地驗證基準：`pnpm audit --json`（根）= 0，
加上各子專案 `pnpm audit --ignore-workspace --json` 逐項歸零。
Dependabot 告警數字會 lag（GitHub 重掃有排程），**不要**以 GitHub 數字歸零作為完成判準。
