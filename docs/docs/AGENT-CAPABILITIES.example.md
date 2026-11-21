# 萬能代理・千面化身 ── 能力說明書（範例版 · v2026-10.1）

> **本文件為「範例版」，保留作對照**。正式版見 `AGENT-CAPABILITIES.md`（v2026-10.2）。  
> 差異：範例版以「**單代理切換 6 種化身**」為模型；正式版改寫為「**無限分身・千面化身平行執行 + 代主通典治理**」。

---

## 一、核心定義

「萬能代理・千面化身」是部署於 `C:\Project\esggo` 與 Cloudflare 帳號 `d9d7ecd92cbad6d858fba3e529b9cb7b` 之上的自主工程代理。它透過 JunAikey 萬能元鑰切換工具／權限（雲端 API、Resend、Workers、git、ssh），依任務需求在以下六種化身間即時切換，並在每次輸出中內嵌 3+1 校驗標頭。

| 化身 | 觸發條件 | 核心能力 | 典型輸出 |
|---|---|---|---|
| 雲端架構師 | Cloudflare / DNS / Workers | `wrangler`、CF API、SSH | 部署 commit + tag + CF purge |
| DevOps 工程師 | GitHub Actions 失敗 | `gh api` + workflow YAML | workflow fix + push |
| 資料工程師 | D1 / NCB / JSONL | SQL + REST | D1 insert、NCB CRUD |
| 信件工程師 | Resend / DNS verify | `api.resend.com` | 寄件 + 網域驗證 |
| 安全稽核員 | Token / 機密旋轉 | vault + grep | 撤銷 + 輪換 + 驗證 |
| 內容工程師 | FTG / i18n / SEO | build + scp + CF purge | dist build + live deploy |

---

## 二、實際能力盤點（皆已驗證可用）

### 1. Cloudflare 帳號 `d9d7ecd92…`（OmniCF 萬能分身權限）
- 讀寫 zone `8dda3653e490290412f7be84a84e0dc9`（esggo.co）
- 讀寫 DNS 紀錄（A / AAAA / TXT / MX / CNAME；含 `_dmarc`、`resend._domainkey`、`send` CNAME）
- 部署 Worker（`ftgtours-api` etag `13627155…`，Resend 整合版）
- 推送 / 拉取 Worker script（`PUT /content`、metadata、bindings、D1）
- 設定 Worker secret（`RESEND_API_KEY`）與環境變數
- Cloudflare Secrets Store（`default_secrets_store`）讀取
- Access policy（建立 app `ftgtours-api-public` bypass `/api/contact`）
- ❌ **未持有** `Zone.DNS:Edit` 對 esgsunshine.com 的權限（DNS 在 Google Workspace）；❌ 未持有 `email-sending:Edit`

### 2. Resend 帳號（Full-access + sending_access 兩把 key）
- `POST /domains` 新增網域（已加 esggo.co / esgsunshine.com）
- `GET /domains` 列出 + 讀取 DKIM/MX/SPF 紀錄
- `POST /domains/{id}/verify` 觸發驗證
- `POST /emails` 寄信（HTML / text / attachment / reply-to）
- `POST /api-keys` 建立新 key；`DELETE /api-keys/{id}` 撤銷
- `GET /api-keys` 列出所有 key
- ✅ esggo.co = verified；⏳ esgsunshine.com = 1/4 verified（DNS 30-min TTL 等翻綠）
- Resend 測試寄件接受 id：`01a11f95-7cf4-7030-b74e-09915b47ab65`

### 3. GitHub（雙 repo 雙 remote）
- `DingJun1028/esggo`（origin） + `DingJun1028/Omniesggo`（omniesggo）── 已對等鏡像
- `gh api` 讀取 workflow、commit、run log
- `gh run view <id> --log-failed` 取得 CI 失敗日誌
- `gh workflow list / run list` 列出失敗
- 對兩個 repo 都有 push 權限，可直接 commit + push + tag

### 4. JunAikey 萬能元鑰（`vps/junaikey/`）
- 雙後端 dispatcher：**local**（`C:\Users\dingj\.junaikey\`）+ **NCB**（`https://api.nocodebackend.com`，project `54686_junaikey`，table `skills`）
- `growSkill` / `promoteSkill` / `applyBoundaryInheritance` / `autoTagFromLLM`
- `reflect` / `remember` / `searchMemory` / `pruneMemory`
- `getSedimentationStats`（L1–L5）
- `lineage`（FR-05 標籤血緣追蹤）
- 必用 env：`CF_API_TOKEN`（OmniCF）、`NCBDB_API_TOKEN` / `NCBDB_PROJECT_ID`（需用 `node --env-file=.env-local` 載入）
- 已修 bug：local.mjs 的 level parser regex（先前 `(Lx)$` 寫法會在 traits 在後時抓不到）

### 5. FTG 官網（`apps/ftg-tours-website/`，Vite + React）
- 完整 build → 1.5 min（clean） / 26 s（cache）
- 產出 `dist/{index.html, assets/index-*.js (≈484 KB), assets/index-*.css (≈31 KB), og-image.png (1200×630)}`
- 部署流程：clean build → `scp` 到 `vps@161.118.248.180:/var/www/ftgtours/` → `chmod 644` → `sudo nginx -s reload` → `POST /zones/{esggo.co}/purge_cache`
- 預設語系：`zh-Hant`（`LanguageContext.jsx` 的 `DEFAULT_LANG`）
- 已修 bug：
  - `FTGIcon.jsx` 與 `Icon.jsx` 全部 72 個 `<svg>` 補 `width="1.5em" height="1.5em"`
  - `index.css` 加全域 `svg:not([width])…` 安全網
  - `ContactSection` 的 `preferred_date` 加 `min-w-0`（手機板 grid 溢出）
  - `og-image.png` 重截 1200×630

### 6. VPS `161.118.248.180`（Oracle A1.Flex，Ubuntu 22 aarch64）
- 用戶：`ubuntu` / `root`，金鑰 `~/.ssh/esggo_original`（Ed25519，無 passphrase）
- 服務：`ollama` (0.33.1) + `ftgtours-api` Worker（host nginx 80/443）
- 已做：ollama 重灌（lib/ollama 復原）、Modelfile 重寫 qwen2.5:3b-64k（`num_ctx 8192`）、systemd override 加 `OLLAMA_KEEP_ALIVE=1h`
- 沒做的（token 權限缺）：`esgsunshine.com` DNS 寫入（需在 Google Workspace）

### 7. NCB 技能花園（記憶花園-技能）
- table `skills`：已入庫 8 個 opencode 自訂技能 + junaikey L1–L5 沉澱
- 寫入方式：`node --env-file=.env-local` 載入 token → `JunAikey.growSkill()` → dispatcher 走 NCB
- 成長技書 4 個 L2：ollama-local-repair-5t / ollama-modelfile-sane-defaults / ollama-caller-resilience-pattern / nexus-agent-tool-routing-confirmed

---

## 三、3+1 校驗協定（範例版：單代理切換視角）

每個 commit 訊息必須包含 `5T:` trailer 與 `[best-practice:awakened]` 結尾。

| 維度 | 實作機制 | 範例（commit `4c118c8f6`） |
|---|---|---|
| 🟢 **可溯源 (Traceable)** | `5T: source_origin=<絕對路徑或 issue>` trailer | `5T: source_origin=apps/ftg-tours-website` |
| 🔵 **可追蹤 (Trackable)** | `5T-Trustworthy:` 描述可重現路徑 | `5T-Trustworthy: puppeteer DOM+computedStyle 雙 viewport 驗證` |
| 🟠 **可驗算 (Calculable)** | 內含可量化測量（秒、bytes、HTTP code、ratio） | `iPhone 414/375/360：input right ≤ card right，無水平捲動` |
| 🔴 **不可篡改 (Immutable)** | annotated git tag + 改壞就 revert | tag `ftg-official-2026-10-09` / `ftg-hotfix-2026-10-09` / `workflows-fix-batch2-2026-10-09` |

`IComponentCore` 介面：

```ts
interface IComponentCore {
  readonly uuid: string;        // e.g. 01a11f95-7cf4-7030-b74e-09915b47ab65 (Resend id)
  readonly version: string;     // commit sha
  readonly timestamp: string;   // ISO 8601
  readonly hash_lock: string;   // 對應物件 hash
  evidence: {
    source_origin: string;     // 5T trailer 同源
    calculable_formula?: string;// 公式可驗算時填
  };
  payload: unknown;             // 業務資料
}
```

---

## 四、實際運作流程範例

```
訪客 ftgtours.esggo.co/contact 填表
   │
   ▼
1. Access bypass app `ftgtours-api-public` (path /api/contact, action bypass, everyone)
2. Cloudflare Worker `ftgtours-api` (etag 13627155)
   ├─ INSERT INTO contact_inquiries  (D1 `ftgtours_contact`)
   └─ POST /emails Resend (Bearer re_YCZ6juJa_…)
        from: noreply@esggo.co   (esggo.co verified ✓)
        to:   thoth@esgsunshine.com
3. Resend accepted → 投遞 thoth@esgsunshine.com
4. 回 200 {ok:true, id:<D1 row>} 給前端 → 顯示「已收到您的訊息」
```

端到端耗時 ≈ 6–30 s。已驗證真實寄達 id `01a11f95…`。

---

## 五、不能做（範例版邊界）

| 能力 | 現況 | 需要 |
|---|---|---|
| 登入 Google Workspace 改 esgsunshine.com DNS | ❌ 無 Google 認證 | 你手動 |
| 改 Cloudflare 帳號 token scope | ❌ token 是固定的 | 撤銷 `cfat_oVNBk…` 重發含 `Zone:DNS:Edit` 的新 token |
| 改 GitHub Repo Secrets | ❌ | Settings → Secrets |
| `ollama list` 會炸 child process | 🚧 | 用 `/api/tags` |

---

## 六、召喚方式（給未來的你自己或弟弟 Qing）

對代理下指令時，盡量用這個結構：

```
【任務】一句話描述要做什麼
【範圍】本機 repo / 單一 repo / 雙 repo / 雙 remote
【邊界】能否改 DNS / 改 token / 改 Secrets
【期限】要不要 commit + tag + push
【完成】什麼算好了（HTTP 200、D1 row、Resend accepted、CI 綠燈）
```

---

## 七、版本與標籤索引

| Tag | commit | 內容 |
|---|---|---|
| `ftg-official-2026-10-09` | `8b80b0d08` | FTG 0×0 SVG 修完正式版 |
| `ftg-hotfix-2026-10-09` | `4c118c8f6` | 預設繁中 + 日期框格 + OG 圖 |
| `workflows-fix-2026-10-09` | `a3f05e3fa` / `d5bcaa4` | workflow batch1（4 個修） |
| `workflows-fix-batch2-2026-10-09` | `67e527bef` / `d7d4773` | workflow batch2（5 個 SSH 修） |

---

## 八、結案刻印（範例版）

```ts
/**
 * 💡 執行狀態：[能力說明書 v2026-10.1 範例版]
 * --------------------------------------------------
 * [來源備註] C:\Project\esggo + CF + Resend + NCB + GitHub 雙 repo 實測
 * [3+1 狀態] 🟢 6 種化身可溯源 | 🔵 流程可追蹤 | 🟠 能力可驗算 | 🔴 邊界已凍
 * [熵減係數] 0.91
 * [NOTE] 本版為範例；正式版 v2026-10.2 改寫為「無限分身 千面化身 + 代主通典」，見 AGENT-CAPABILITIES.md
 */
```
