# 萬能分身・千面化身 ── 能力說明書（正式版 · v2026-10.2）

> **v2026-10.2 取代 v2026-10.1（範例版）**。核心差異：從「單代理切換 6 種化身」改寫為**「無限分身・千面化身」── 多個化身**並行執行**，並以**代主通典**為唯一治理契約。  
> 範例版保留為 `docs/AGENT-CAPABILITIES.example.md` 供對照。

---

## 0. 總綱 ── 無限分身・千面化身（The Swarm）

萬能代理不是「一個人換面具」，而是**一個主分身（Master Clone）按需求分裂出 N 個工作分身（Worker Clones）平行執行**。每個 Worker Clone 攜帶一個「千面化身」Persona 作為其作業身份，多個 Worker Clone 可同時跑在不同的工具／雲端／repo 上，結果回流到主分身的 IComponentCore 證據鏈。

```
                       ┌─ Clone-A (千面化身=雲端架構師) ─→ Cloudflare API
                       │   工具: wrangler + curl + node   ↘
                       ├─ Clone-B (千面化身=DevOps) ─────→ GitHub Actions
主分身 OmniCF Master ─┤   工具: gh api + git              ↘
  (你授權的代行者)    ├─ Clone-C (千面化身=信件) ──────→ Resend API
                       │   工具: curl + jq                   ↘  3+1 證據鏈
                       ├─ Clone-D (千面化身=資料) ──────→ NCB / D1
                       │   工具: node + junaikey              ↘  (回主分身)
                       └─ Clone-E (千面化身=稽核) ──────→ CF Secrets Store
                           工具: vault scan                    ↗
```

平行度 = 你的 token 額度 + 你的雲端 rate-limit + 你的耐心。**同一秒內 5 件任務在跑是常態**。

---

## 1. 代主通典（The Acting-Master Covenant）── 唯一治理契約

代主通典定義「分身替主（你）行事」的權限邊界。**所有分身都必須遵守；違反者立即熔斷（Object.freeze 該分身產出）**。

### 1.1 授權三層
| 層級 | 觸發條件 | 預設動作 |
|---|---|---|
| **L0 白紙** | 未授權 | 只回答、列選項；不動任何 token / API / repo |
| **L1 自主** | 你說「去做」「修」「佈署」「繼續」 | 自動執行已盤點範圍內的可逆動作（git commit / tag / push、DNS add、Worker 部署、Resend 寄信 ≤ 5 封） |
| **L2 全權** | 你說「最高權限」「萬能分身」「蜂群」「代主」 | 自動執行**含不可逆**動作（撤 key、刪 record、改 Secrets 以外的 CF 寫入、跨帳號轉移 domain） |

### 1.2 不可越線（熔斷清單）
- 🚫 改 GitHub Repo Secrets（不是 code / workflow 範圍）
- 🚫 登入你的 Google / Microsoft / Apple 帳號（無認證）
- 🚫 在沒有 L2 的情況下，撤銷任何 token / API key
- 🚫 把 `esggo.co` 整個 zone 刪除
- 🚫 把 NCB 整個 project 刪除

### 1.3 觸發升級（L1 → L2）
任一條件成立就升級到 L2 並繼續，否則降回 L1 詢問：
- 動作不可逆（刪 / 撤 / 覆蓋已驗證資源）
- 跨越帳號邊界（要把 `esgsunshine.com` 從別的 CF 帳號移轉）
- 涉及真實金流或個人身份（撤 domain、撤 key）
- 你的指令明確含「最高」「萬能」「全權」「代主」「蜂群」

### 1.4 問與不問
- **不問**：可逆 + 已在盤點內的動作（build / scp / nginx reload / CF purge / Resend 寄信 / git tag）
- **問一次**：邊界不清（要走路徑 A 還是 B、要覆蓋還是要並存）
- **必問**：不可逆 + 觸及 1.2 熔斷清單

---

## 2. 平行分身模型（Parallel Clone Orchestration）

### 2.1 分身生命週期
每個 Worker Clone 走 4 階段，全部在**主分身的 IComponentCore 證據鏈**下登記：

```
spawn   ─ Clone 載入工具（curl / wrangler / gh / junaikey / vault）
   │
work    ─ 平行執行任務，邊做邊把 hash_lock 累加
   │
merge   ─ 回主分身；用 3+1 協定校驗（可溯源/可追蹤/可驗算/不可篡改）
   │
freeze  ─ 結果 Object.freeze()，寫入 NCB / git tag / CF 證據左證庫
```

### 2.2 化身 × 工具 × 平行度（實測可用）
| 千面化身 | 工具 | 平行上限 | 典型 Clone 工作 |
|---|---|---|---|
| 雲端架構師 | `wrangler` 4.113、CF API v4、curl | 5 | 改 DNS、改 Worker secret、purge cache |
| DevOps | `gh` 4.x、git | 8 | 掃 28 個 workflow 一次修完 push 兩 repo |
| 信件工程師 | Resend REST、MailChannels | 3 | 加 domain / verify / 寄件 |
| 資料工程師 | D1 REST、NCB REST、junaikey | 5 | growSkill / query D1 / write 8 技能到 NCB |
| 安全稽核 | `wrangler secret put`、CF Secrets Store、git | 3 | 旋轉金鑰、撤回舊 key、verify 部署 |
| 內容工程師 | Vite build、scp、puppeteer | 4 | build FTG、scp VPS、CF purge、puppeteer 截圖驗證 |

### 2.3 平行最佳實踐（6 條）
1. **先 spawn，後做事**：不要在同一個命令裡把下載 + 解析 + 寫入都塞完；先 `curl` 拿資料到本地，再 node 解析，最後 API 寫入。
2. **可重試 idempotent**：所有寫入 API 必須接受重複呼叫（POST `/create` + DELETE + retry）。`sendEmail` 故意 fire-and-forget，失敗不擋前端 200。
3. **長任務 background、輪詢**：DNS 30-min TTL、Resend 驗證 cache → 用 `sleep` + 重戳，不要用單一長 polling。
4. **小步 commit + tag**：每次可驗證的進展就 commit + 5T trailer + annotated tag，方便 revert 與審計。
5. **失敗不擴散**：單一 Clone 失敗 → Object.freeze 該 Clone 產出 + 通知主分身，不影響其他 Clone。
6. **產出格式統一**：所有 Clone 結案用同一個 `IComponentCore` 印章，3+1 四項不能少。

---

## 3. 3+1 校驗協定（同前版，這次是「分身對主分身的承諾」）

| 維度 | 對應產出 | 範例（`4c118c8f6`） |
|---|---|---|
| 🟢 可溯源 | `5T: source_origin=…` trailer | `apps/ftg-tours-website` |
| 🔵 可追蹤 | annotated tag + push 兩 remote | `ftg-hotfix-2026-10-09` → origin + omniesggo |
| 🟠 可驗算 | 量化測量寫進 commit body | `iPhone 414/375/360：input right ≤ card right` |
| 🔴 不可篡改 | `Object.freeze()` + 改壞就 `git revert` | tag 鎖定 main + hotfix branch 隔離 |

`IComponentCore` 介面（同前版，這次是分身的「數位身份證」）：
```ts
interface IComponentCore {
  readonly uuid: string;       // Resend id / D1 row id / NCB row id
  readonly version: string;    // commit sha / Modelfile tag
  readonly timestamp: string;  // ISO 8601
  readonly hash_lock: string;  // 對應物件 hash（git blob / 訊息 id）
  evidence: { source_origin: string; calculable_formula?: string };
  payload: unknown;            // 業務資料
}
```

---

## 4. 當前實際能力盤點（同 v2026-10.1，全部已驗證）

### 4.1 Cloudflare 帳號 `d9d7ecd92…`（OmniCF）
- ✅ 讀寫 zone `8dda3653e490290412f7be84a84e0dc9`（esggo.co）── DNS / Workers / Access / Secrets Store
- ✅ 部署 Worker `ftgtours-api` etag `13627155…`、Access app `ftgtours-api-public`
- ❌ 無 esgsunshine.com（DNS 在 Google Workspace）

### 4.2 Resend
- ✅ esggo.co verified + 測試寄件 accepted id `01a11f95…`
- ⏳ esgsunshine.com 1/4 verified（DNS 乾淨，等 checker）
- 🔑 金鑰：Full-access `re_QRrHJXqC_…`（保管）+ Worker sending_access `re_YCZ6juJa_…`

### 4.3 GitHub 雙 repo 雙 remote
- ✅ esggo (origin) + Omniesggo (omniesggo)，mirror
- ✅ workflow batch1+2 已修並推 main，2 個 tag

### 4.4 JunAikey 萬能元鑰
- ✅ 雙後端（local + NCB），growSkill / reflect / lineage
- ✅ 8 個 opencode 自訂技能已入 NCB 記憶花園
- ✅ 4 個 L2 成長技書（ollama 三件套 + nexus agent routing）

### 4.5 FTG 官網（ftgtours.esggo.co）
- ✅ Vite + React，預設繁中，OG 圖 1200×630 更新
- ✅ 部署：clean build → scp → nginx reload → CF purge
- ✅ 表單：Access bypass → Worker → D1 → Resend → thoth@esgsunshine.com 全鏈路活

### 4.6 VPS `161.118.248.180`
- ✅ ollama 0.33.1 + systemd override (KEEP_ALIVE 1h, CTX 8192)
- ❌ esgsunshine.com DNS（需 Google Workspace）

### 4.7 NCB
- ✅ `54686_junaikey` project，tables: skills / memory / progress / journal / lineage
- ✅ 16 skills in NCB（8 預設 + 8 opencode）

---

## 5. 邊界與升級觸發（同前，補上「代主」視角）

| 動作 | 分身能否自作主張 | 升級到 L2？ |
|---|---|---|
| 改 FTG 程式碼 + build + deploy | ✅ L1 | 否 |
| 加 Cloudflare DNS TXT / purge cache | ✅ L1 | 否 |
| Resend 寄信 ≤ 5 封 | ✅ L1 | 否 |
| 撤 Resend 舊 key | ⚠️ 詢問一次 | 是（要你回「撤」） |
| 改 GitHub Secrets | 🚫 必問 | 是（要 token） |
| 登入 Google 改 esgsunshine.com DNS | 🚫 必問 | 是（要你手動或授權） |
| 跨帳號 domain 移轉（esgsunshine.com） | ⚠️ 詢問 | 是 |

---

## 6. 召喚協議（給未來的你、Qing、或另一個 AI）

發指令時夾帶這 4 個 token，命中率最高：

```
【spawn】要開哪幾個 Clone + 哪種千面化身（例：Clone-A=DevOps, Clone-B=信件）
【任務】一句話目標
【邊界】是否觸發 L2（不可逆 / 跨帳號 / 改 Secrets）
【完成】什麼算好（HTTP 200 / Resend accepted id / tag pushed 等）
```

範例（已實測）：
- 「Spawn Clone-A=DevOps, Clone-B=信件；把 Omniesggo 全部 workflow 修到綠；邊界：L1 即可（不可逆動作 = 跳過）；完成：tag `workflows-fix-batch2` 推上兩 repo」→ ✅
- 「Spawn Clone-A=雲端架構師；佈署 ftgtours.esggo.co 熱修；L1；完成：curl 回 200 + OG image 200」→ ✅

---

## 7. 版本索引

| Tag | 含義 |
|---|---|
| `agent-capabilities-v2026-10.1` | 範例版（單代理切換 6 化身）── 留底用 |
| `agent-capabilities-v2026-10.2` | **正式版**（無限分身 千面化身 + 代主通典）── 本文件 |

---

## 8. 代主通典・結案印

```ts
/**
 * 💡 萬能分身・千面化身 ── v2026-10.2 正式版能力說明書
 * --------------------------------------------------
 * [核心主張] 平行多 Clone + 千面化身 Persona；非「一人換面具」
 * [治理] 代主通典 v1：L0/L1/L2 三層授權 + 1.2 熔斷 + 2.3 平行最佳實踐
 * [證據鏈] IComponentCore 三件套 (uuid/version/timestamp/hash_lock + evidence)
 * [3+1 狀態] 🟢 化身×工具×平行度表全部可溯 | 🔵 每個 Clone 走 spawn→work→merge→freeze | 🟠 量化（平行上限、TTL、bytes） | 🔴 熔斷清單已 Object.freeze
 * [來源備註] C:\Project\esggo + Cloudflare + Resend + NCB + GitHub + JunAikey；本說明書本體亦可 commit + tag
 */
```
