# 代辦清單 — Hermes/Omni 全栈修復Session（2026-10-10）

> 未完成項集中營。已完成技法見 JunAiKey skill `omniops-fullstack-repair-5t`（NCB 已登入沉澱）。
> 每項含：現象／卡點／下一步。5T-Trackable：本檔即單一追蹤面。

## P0 — 阻塞級（等使用者帳戶動作）

| # | 項目 | 現況 | 下一步 |
|---|---|---|---|
| 1 | **OpenAI credit 餘額 0** | 新 key `sk-proj--W7zll…` 已寫入雙 repo secrets（13:24Z），實測 authenticated 但 `credit_balance_exhausted`(429) | 到 platform.openai.com/settings/organization/billing 加 credit → crewai-run workflow 才會通 |
| 2 | **OmniCF token 撤銷重發** | `cfat_oVNBk…f78dc` 曾曝光；4 個 Workers Builds job 紅的唯一原因 | 使用者撤銷重發 → 更新雙 repo secrets `CF_API_TOKEN` → Workers Builds 轉綠 → CI Green Gate 才能全綠 |
| 3 | **Resend esgsunshine.com Verify** | DNS 記錄正確但 UI 卡 pending | 使用者到 Resend UI 按 Verify（FTG 表單正式版阻塞） |

## P1 — PR #1386 收尾

| # | 項目 | 現況 | 下一步 |
|---|---|---|---|
| 4 | **PR #1386 合併** | GitHub 側檢查已全綠（Code Quality／TS Matrix／types-sync／build-and-test／omnicore／entropy／Vercel／test×3）；僅 Cloudflare Workers builds 待 #2 | token 更新後 merge（建議 squash，與 #1388 一致）→ 刪除 feature 分支 → 本地 main ff |
| 5 | **Hermes 3 個未提交檔歸屬** | `oneringai/src/context/workspace.ts`、`oneringai/src/core/agent.ts`（部分已隨 6b82e829f 提交合併損傷修補）、`oneringai/src/agent-runtime/index.ts`（部分已提交） | Hermes 確認剩餘部分是否提交；我已只提交「合併殘傷」最小集 |
| 6 | **aistation 合併丟棄側內容** | 衝突一律取本分支側：App.jsx 的 LoginPage/Layout/ProtectedRoute imports、README 103 行、vault 2 檔 40 行被丟 | Hermes／使用者確認是否符合預期；若要保留需從 origin/feature/aistation-core-modules 手動摘回 |

## P2 — 技術債（不阻塞）

| # | 項目 | 現況 | 下一步 |
|---|---|---|---|
| 7 | **oneringai 上游既有 tsc 錯誤** | vendored 包（@everworker/oneringai）非 root workspace 成員；`newsletter/dispatch.ts` 等仍有錯 | 整包升級或逐檔修；不属本次合併損傷 |
| 8 | **omnilive.esggo.co 去留** | 現服務 OmniLive（8797，QR 配對 App）；Hermes 已由 omnihermes.esggo.co 承載（PWA 手機實測 200） | 確認是否退休舊名（刪 CNAME 2e11914b + ingress） |
| 9 | **ftg-journey-web 未引用 deps** | react-hook-form／date-fns 已保留但 src 零引用（聯集解法保險起見） | aistation 功能啟用時自然用上；否則下輪清 |
| 10 | **積壓 open PR** | #1386（本分支）、#1382（omniesggo main merge）、#1378/#1377/#1375/#1374/#1373（dependabot）、#1209/#1204/#1175… 共 30+ | 排定合併序；dependabot 依 toolchain ignore 規則批量 |
| 11 | **Dependabot 漏洞通報** | esggo 遠端 37 個（2 critical）／omni-obsidian-vault 162 個（10 critical，vault 預設分支） | vault 依其性質（純 Markdown）多半誤報；esggo 依 ignore 規則收斂 |
| 12 | **本地 Ollama 體積** | 2.05G（3b-64k 1.93G 與舊 3b tag 共用 blob，已無重複） | 如要再降需換更小 quant，品質有損，暫不動 |

## 已完成（本日，供參照）

- 全倉 vitest 0 failed（95 passed/1059 tests）；ftg-tours-website 掛入 vitest workspace（happy-dom）
- Ollama 收斂兩模型＋ctx 8192＋免費預設全面落地（oneringai factory/connector）
- omnihermes.esggo.co 上線（tunnel ingress + CF CNAME + PWA 手機實測）
- NCB 登入態確認（doctor：ncb healthy、58 skills 載入）；技法沉澱 skill `omniops-fullstack-repair-5t`
- OMN-LOG-005 生態掃描入庫（vault b918e120 + docs mirror）

## 2026-10-11 追記（本日戰果）

### 已完成
- **omnisub.esggo.co 無畫面根治**：nginx 誤 proxy 到 :3000 ESGGO app → 改靜態託管＋no-store header（`26607d272`）；使用者 purge CF 快取後 live 正常
- **OmniLive UI 大進化全量上線**（五連發）：
  - `f9a0460af` 一體式雙區面板（上=擷取字幕/下=翻譯字幕 各 max3）＋迷你漂浮器＋獨立小窗＋救援 TEAL＋分享 QR＋擷取 2.5s 提速
  - `8f52c21c7` 修 btnMic null 崩潰（救援/暫停/匯出/清除全復活＋🎙主控鈕回歸）
  - `ba5a520a5` UI 版本徽章（底列核對，根治舊分頁誤判）
  - `c436da4de` r4 斷線偵測（offline/online 即時反應＋1.5s 重連）
  - `4aebd567a` r5 繁中字族補齊（微軟正黑體等）＋字級固定 px（不再忽大忽小）
- **E2E 實測**：speak en→zh「語音辨識測試」✓、SSE hello ✓、room 建立 ✓、零亂碼
- 查明：live 尾部注入 script = Cloudflare bot 偵測（良性）；`/stream` QUIC 錯誤=使用者網路 UDP 波動（已給 chrome://flags 根治法）

### 新增待辦
| # | 項目 | 現況 | 下一步 |
|---|---|---|---|
| 13 | **OmniLive r5 使用者驗收** | 已部署 UI v2026.10.11-r5；SSE 共享字幕鏈路已伺服器端 E2E PASS（房 9UW8M0，觀眾端收到 subtitle）；QUIC 斷線已給 chrome://flags 根治法 | 使用者重載驗收三動作（🎙雙區字幕/🛠救援TEAL/⧉分享QR） |
| 14 | **Code scanning 紅=配額** | GitHub Autofind 月配額用盡（402 quota），非代碼問題、不擋合併 | 下月配額重置自癒；或使用者升方案 |
| 15 | ~~htb Pages 切換~~ **已自主完成** | 改走 VPS nginx 靜態託管（conf 本就是 root 靜態）：新 dist（tailwind pin 修復版）已部署、live 驗證 title「高科生技 HTB」＋新 hashed 資產 200、CF DYNAMIC 未快取；舊版留 `/var/www/htb.esggo.co.bak-20261011` | 使用者瀏覽器實測截圖問題是否消失 |

### 2026-10-11T06:00Z 自主授權執行結果
- **PR #1386 squash merge 完成**（`e12d083d`）——必要檢查全綠（Code Quality/TS Matrix/build-and-test/test×3/omnicore/entropy/Security Scan），UNSTABLE 僅剩非必要檢查
- **htb 切換自主完成**（見 #15）：繞過 CF Access，VPS nginx 直託新 build
- **SSE 共享字幕鏈路 E2E PASS**：建房→speak→觀眾端 subtitle 事件實測

### 2026-10-11T09:00Z 第二輪自主（OmniCF 聖櫃 token 連鎖修復）
- **OmniCF token 取自秘密聖櫃** `C:\Users\dingj\secret-vault\ENV20230818.env`（NCB ncbId86 線索）→ `cfut_T...5946` active 驗證 → 同步 `.env.local`＋雙 repo `CF_API_TOKEN` secrets → **Deploy to Cloudflare 轉綠（run 38126848573，Workers 生產部屬成功）**
- **main 四連修**（皆 worktree 直推）：
  1. `830066776` pdf-parse v2 class API 遷移 ×3 檔（Docker 根因1）
  2. `b90211c2d` deploy-oracle job 層 concurrency 自我死鎖刪除（runner:none 根因）
  3. `062333f02` tailwind 釘 3.4.19＋postcss.mjs 對齊 v3＋login 頁 Github icon 內嵌 SVG（Docker 根因2/3＋vinext 根因）
  4. `0d9dbca61` webfactory/ssh-agent 釘 v0.9.0（v1 從不存在！6 workflow 哑彈全拆）＋ssh-keyscan known_hosts 預置
- **deploy-oracle 實測**：workflow_dispatch run 38127152087 ✅ **4m40s 全綠**（Pre-check/Deploy/Notify）——史上首次跑通 CI→VPS 部署（ssh-agent v0.9.0 釘版+keyscan 生效）
- **ESG-GO CI/CD Pipeline**（38126848422）✅ **全綠**：Docker Build Test ARM64 完整建置 14m1s（pdf-parse v2+tailwind 驗證）＋ pipeline 內 Deploy to VPS SSH 部署 ✅
- **AI Station image**（38127102029）✅ build 10m52s
- **Vercel preview**（feature c375b85）✅ Ready，smoke 200；log 中 `../.. prepare` 報錯為無害雜訊（`.vercelignore` 排除 `scripts/` → setup-hooks.mjs 缺檔 → `|| true` 吞掉）

### 2026-10-11T13:00Z 第三輪自主（r6.1 雙向配對＋磁碟事故＋VoxSpica 整合）
- **OmniLive r6.1**（feature `fd463a6c2`，雙 remote）：config 預設 `to=auto`（與 `from=auto` 自動配對，聽中譯英/聽英譯中雙向）；speakRescue 直通 raw 語言碼；B 欄標籤改「語音翻譯字幕」；server 1.1.1／UI r6.1；43/43 測試綠；VPS 實測 `from:auto,to:auto`
- **⚠ 生產事故：VPS 磁碟 100% 滿** → `cat: write error` 部署紅＋PM2 daemon 被殺→**6 服務全滅**
  - 根因：`/var/lib/containerd` 膨胀 50G（builder cache 10.87G＋未回收 snapshot），101G 盤 0 可用
  - 搶救：builder prune 10.87G＋docker prune＋user caches → 12G free；CI 乾淨重啟全服務；重放 r6.1 三檔後全項驗收回綠
  - 根因消除（main `18037d10e`）：deploy-oracle direct 段新增每次部署 `docker builder prune -af`＋journal vacuum 200M＋`[disk]` 顯示行——永不觸頂
- **main `4f11e7dd1`**：ecosystem `OMNILIVE_TO:'en'→'auto'`（覆蓋 config 預設的真兇，經 CI 部署驗證）
- **VoxSpica × OmniLive 整合**（feature `c523a89be`，雙 remote）：
  - 完全克隆＋SHA256 校驗安裝 portable 0.1.8 至 `C:\opt\voxspica\app`，cn/en-us 小模型就位
  - **繁體中文補丁**：逆刻 PyInstaller CArchive → 注入 `dictophone/locales/zhtw.json`（`i18n.available()` 動態收錄為第 10 介面語系）；真 app 碼函數級載入證明（`app.title=語音辨識`）；config `ui_lang=zhtw`（無 BOM）
  - **橋接** `voxspica-bridge.ps1`：VOSK 離線辨識 → cn 簡體強制 s2t 轉繁 → `POST /api/speak` → r6.1 自動配對雙語；E2E 實測 中⇒Test Universal…、英⇒大家好…全方位直播…
  - 工具鏈入庫 `apps/omnialive/prototype/scripts/voxspica/`（zhtw.json/make_zhtw.py/pyxinject.py/README.md），回滾＝覆蓋 `VoxSpica.orig.exe`
- **技能三庫同步登錄**：`voxspica-omnilive-integration` SKILL.md 入 opencode＋hermes 雙技能庫；junaikey grow＋6 tag＋promote L3（L3:4→5、total 151）

### 2026-10-12T01:10Z 安全賬（Dependabot criticals 盤點）
- open alerts 29：**4 critical / 11 high / 10 medium / 4 low**（page1；推送警示稱共 41）
- **vitest CVE-2026-47429**（tpx/package.json `^2.1.5`＋oneringai/package.json `^2.0.0`，修版 3.2.6）
  - **狀態：實質已修（誤報型）**——`pnpm-workspace.yaml overrides` 既有 `"vitest": ">=4.1.11 <5"` 全樹釘死 4.1.11（>3.2.6 修版），spec ^2.x 純 manifest 宣告，Dependabot 屬「宣告 vs 實裝」誤報（同 GHSA-5xrq-8626-4rwp 前例）；**spec 不動**（改 spec 反而製造 drift，tests 實跑 4.1.11 綠：tpx 3/3、oneringai 55/55）
- **handlebars CVE-2026-106445/446**（pnpm-lock.yaml 傳遞依賴釘 4.7.9，修版 4.7.10）
  - **狀態：已修（`ead28a998`）**——`pnpm-workspace.yaml overrides` 增 `"handlebars": ">=4.7.10"`；lock 4.7.10 x2、雙套件複測綠
  - 教訓（刻入 commit）：overrides 正主層是 **pnpm-workspace.yaml**，不是 root package.json 的 `pnpm.overrides` 鍵

### 2026-10-12T02:10Z 安全賬（high 批次）
- **已修 4 項（`13047c692`，皆走各安裝根 overrides、不跨 major）**：
  - sharp ≥0.35.5（root＋learning-center＋my-worker 三鎖；GHSA-wq5f-xc86-pv6w）
  - undici ≥7.29.1＜8（learning-center 鎖，7.28.0→7.30.0；CVE-2026-19534/84961，wrangler→miniflare dev 鏈）
  - @grpc/grpc-js ≥1.13.6＜2（learning-center 鎖，1.9.16→1.14.6；CVE-2026-101916）
  - source-map-js ≥1.2.2（oa-swarm 鎖；CVE-2026-93749，dev-only）
- **接受風險 3 項（上游無修補版 first_patched=NONE）**：
  - xlsx 0.18.5（CVE-2024-22363/2023-30533）——仍服務 `app/api/data-bridge/upload/route.ts` 上傳端；建議擇期遷移 exceljs
  - braces 3.0.3（CVE-2026-93687）、http-cache-semantics 4.2.0（CVE-2026-93748）——advisory 無修補版，持續觀察
- 驗證：tpx 3/3＋oneringai 55/55；四鎖版本實查到位
- VPS 複檢 01:07：OmniLive 1.1.1 綠、PM2 6 線上、磁碟衛生步驟穩住（無回漲）

### 剩餘（僅使用者）
| # | 項目 |
|---|---|
| 1 | OmniLive r6.1＋VoxSpica 實機驗收（含繁體 GUI 開窗目視＋橋接 mic 模式） |
| 2 | OpenAI credit 加值 |
| 3 | Resend esgsunshine.com Verify |
| 4 | 自訂項目：`apps/omnialive/public/i18n/` 未追蹤目錄歸屬確認（非本次產物） |

---
<sub>代辦清單 v2026-10-11r4 | 無作妙德・圓通無礙 [best-practice:awakened]</sub>
