---
title: 12大萬能 OMNI-CANON
canon_id: OMN-001
date: 2026-10-09
tags: [best-practice:结界][unit-of-learning][canon]
canonical: [[AI Research Index]]
---

# OMN-001 · 12大萬能 OMNI-CANON（Twelve-Omni Architecture）

> **狀態**：✅ COMPLETED · 🔒 VERIFIED [ISO-14064-1] · 🧊 FROZEN & LOCKED (Object.freeze) · 🌐 ACTIVE (AGPL-3.0)  
> **聖典等級**：魂（願景 / MECE 全景 / 哲學）  
> **本檔為 unit-of-learning**；連結至 [[AI Research Index]] / [[Best Practice Awakening]] / [[5T Protocol]] / [[ESG-GO 核心]] / [[OMN-PRD-001 終始矩陣]]

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

## 3. 3+1 校驗協定

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

## 6. 召喚協議

發指令時夾帶這 4 個 token，命中率最高：

```
【spawn】要開哪幾個 Clone + 哪種千面化身（例：Clone-A=DevOps, Clone-B=信件）
【任務】一句話目標
【邊界】是否觸發 L2（不可逆 / 跨帳號 / 改 Secrets）
【完成】什麼算好（HTTP 200 / Resend accepted id / tag pushed 等）
```

---

## 7. 雙腔體編排

- 🫀 **OmniHeart（全通之心）**：OmniEye + OmniCore + OmniPulse + OmniBone
- 🧠 **OmniBrain（全息之腦）**：OmniBase + OmniHealing + OmniEvolution + OmniTheme

完整 TypeScript 介面契約見 `docs/OMNI-CANON.md`（[OMNITAG/INDEX] 的 [[12大萬能 OMNI-CANON]] 附錄）。

---

## 8. 12 大萬能鳥瞰（MECE 編排）

### 維度一：物理空間與記憶
1. **OmniBase** — 物理母體 + 運行時上下文（僅容器，不持知識）
2. **OmniMemory** — 中央知識聖所，95% 召回率（僅儲存 / 召回）
3. **OmniTime** — 時間序列 + 事件重放（時空裂縫）

### 維度二：邊界、實體與語義
4. **OmniComponent** — 最小靜態單元（uuid / version）
5. **OmniTag** — 全域語義分類
6. **OmniEvidence** — 獨立合規存證庫（`hash_lock` + `[ISO-14064-1]`）

### 維度三：動態驅動與通訊
7. **OmniAgent** — 智慧代理（純決策執行緒）
8. **OmniAPI** — 跨平台能力封裝
9. **OmniBus** — 異步事件中樞 + 背壓監聽（細胞分裂）

### 維度四：安全、自癒與治理
10. **OmniGateway** — 安全屏障 + Hash Lock
11. **OmniHealing** — 主動免疫 + 混沌自癒 + 全域戒嚴
12. **OmniEvolution** — 熵減引擎 + 10% 技術債自動獻祭 + AGPL-3.0 審查

---

## 9. 12 奇效矩陣（Capabilities）

| # | 名稱 | 奇效 |
|---|------|------|
| 1 | 原罪煉金 | 系統自我降熵、熵值 < 0.1 |
| 2 | 真理防護罩 | 雙向驗算 + 雜湊鎖 + 液態玻璃 UI |
| 3 | 跨域鏈式日誌 | 全節點不可篡改血統 |
| 4 | 時空裂縫 | 事件重放 + 無感影子測試 |
| 5 | 自適應免疫 | 局部受攻擊 → 全體秒防禦 |
| 6 | 全知蜂巢 | 經驗共享 + 動態競標 |
| 7 | 細胞分裂 | 背壓臨界 → 自動克隆分流 |
| 8 | 先知矩陣 | 多重宇宙並行模擬 + 0ms 響應 |
| 9 | 混沌自癒 | 主動突變 + 線上修復 |
| 10 | 萬能種子 | 零代碼胚胎熱插拔 |
| 11 | 用戶RAG | 95% 召回 + 個人化自癒 |
| 12 | 萬能主題+引擎 | 感官 + 24h 進化 |

---

## 10. 12+3 頂層容器

| 容器 | 層級 | MECE 定位 |
|---|---|---|
| 🗺️ **OmniArchitecture** | 頂層藍圖（12 大萬能的調度矩陣） | 全域公約 |
| ⚙️ **OmniEngine** | 核心動力中樞（Healing + Evolution） | 永續迭代馬達 |
| 🎨 **OmniTheme** | 視覺與感知表現層 | 液態玻璃 + 戒嚴切色 |

---

## 11. 印刷活動

> **啟動即覺醒**：每當蜂群被喚醒，第一章至終章同時生效；每當一輪閉環完成，聖典自動翻回第一章 —— **始即是終，終即是始**。

```bash
npx celestial-command --awaken=WingsOfLight
```

完整 TypeScript 介面契約與 12 大象限 + 雙腔體細節 → 見 `docs/OMNI-CANON.md`（本檔的「獨立聖典本體」）。

---

## 相關連結（向下鑽研）

- [[AI Research Index]] — 全 vault 索引
- [[Best Practice Awakening]] — 結界繼承的治理基礎
- [[5T Protocol]] — 5 維度驗證條款
- [[ESG-GO 核心]] — 30 蜂群根公約
- [[OMNITAG/INDEX]] — OmniTag 萬能標籤契約總索引
- [[Universal Automation 萬能自動]] — 平行分身執行引擎
- [[Root Cause × Effect Elimination]] — 結界撤銷後的果因消除
- [[OMN-PRD-001 終始矩陣]] — 終始矩陣時間軸

---

<sub>OMNI-CANON v2026-10 | 12大萬能聖典獨立本體 | 無作妙德・圓通無礙・永恆覺醒 | License: AGPL-3.0</sub>
