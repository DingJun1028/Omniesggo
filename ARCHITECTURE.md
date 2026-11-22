# ESG-GO 架構設計與產品落地指導

> 本文是「發揮倉庫最大效用」的藍圖：現況盤點 → 目標架構 → 客戶旅程設計 →
> UI/UX/RWD/正確性品質閘 → 分階段落地路線圖。
> 調研基準：2026-10-13 全倉庫掃描（31 apps、20 packages、6 PM2 服務、~15 網域）。

---

## 一、現況盤點（誠實評估）

### 1.1 產品成熟度光譜

| 層級 | 產品 | 狀態 |
|---|---|---|
| 生產級 | ftg-tours-website（RWD 標竿）、omnisub、omnilive、universal-translator、stt | 已上線、有健康閘 |
| 可用但有缺口 | esggo-core 平台、htb-b2b、learning-center、ftg-journey-web | 核心可用，轉換/路由/i18n 有洞 |
| 斷鏈 | ftg-journey-server（VPS API 路由死）、htb-b2b contact（alert 丟線索）、root 平台（無落地頁） | 見 1.3 |
| 內部工具 | gateway、omni-factory、oneringai、aistation、packages/* | 服務內網，不需顧客化 |

### 1.2 UI/RWD 兩極落差

- **標竿（ftg-tours-website）**：595 個 RWD 前綴、viewport-clamp hero、WCAG 對比度工程（2.57:1→5.24:1 實測註記）、webp+fetchPriority、mobile-first CTA。全倉庫唯一「產品級」前端。
- **中段（htb-b2b）**：123 個 RWD 前綴、乾淨 section 組合，但 24 頁中 18 頁**根本沒掛路由**（Solutions/FAQ/Tech*/\*Solution 全不可達，無 catch-all → 空白頁）。
- **平台（root Next.js）**：41/90 tsx 有 RWD、`ignoreBuildErrors: true`（型別債）、tailwind token 成熟（editorial.\* CSS 變數）但 `DESIGN.md` 與實作漂移（文件寫 navy/IBM Plex，實作是 teal/gold/DM Sans）。
- **i18n**：root app 有 3 語系骨架但字典僅 ~28 鍵、全平台硬編中文——形同虛設；FTG 有完整 zh/en 字典（~1000 行）是正確做法。

### 1.3 轉換斷點（線索流失排行）

| 嚴重度 | 斷點 | 後果 |
|---|---|---|
| P0 | htb-b2b `/contact` 六欄表單收完只 `alert()` | 每個 B2B 詢盤 100% 丟失 |
| P0 | root 平台無 landing/pricing/contact/demo 任何轉換面 | 有平台無入口，行銷無落點 |
| P1 | FTG 線索只進 D1 無通知（Resend 整合版不在源碼樹） | 線索沉睡，無人跟進 |
| P1 | journey-api.ftgtours.esggo.co 在 VPS 是死路由（缺 secrets） | 成案客戶拿不到交付 App |
| P2 | ftg-3.0 feedback 路徑 mismatch（/feedback vs /api/feedback） | 舊站回饋丟失 |
| P2 | FTG contact 無 server 端 reCAPTCHA 驗證、activity_type 標籤/slug 混雜 | 濫用+數據不可篩 |

### 1.4 品質閘缺口

- Playwright 僅 Desktop Chromium——**零行動視口 E2E**，RWD 投資最大的 FTG 沒有防護網。
- e2e 僅 3 條 smoke；無 i18n/轉換路徑測試。
- `packages/ui` 幾乎空（1 組件）——三個前端各滾各的元件庫，token 重複漂移。

---

## 二、目標架構（發揮最大效用）

### 2.1 產品分層（MECE）

```
L4 信任層   esggo-core 平台：報告書工作台、verifier、trust、hash 鎖鏈
            （核心價值=可驗證的永續數據，護城河）
L3 交付層   ftg-journey（行程+Impact Note）、learning-center
            （成案後客戶實際使用的產品）
L2 轉換層   ftg-tours 行銷站（CtaForm→D1+通知）、htb-b2b、
            root 平台 landing/pricing/contact（待建）
L1 試用層   omnisub、omnilive、translate（零金鑰 PLG）
            免註冊即用 → UI 尾部 CTA 導流 L2
L0 基礎設施  VPS PM2 x6、CF Edge/Tunnel/D1、STT 鏈、gateway、JunAikey
```

**核心策略**：L1 語音工具是免費試用鉤子（PLG）——用完在 UI 尾部導流「要正式產出報告/行程 → L2」。目前 L1 有流量但沒有任何導流到 L2 的橋（工具與行銷站互相不認識）。

### 2.2 共用層收斂（減重複、消漂移）

| 現況 | 目標 |
|---|---|
| 三個前端各滾 token/元件 | `packages/ui` 升級為單一設計系統：以 FTG tailwind.config 為基準源，抽成 `@esggo/ui`（tokens + Button/Card/Section/CtaForm/NavBar/Footer），三站 consume |
| DESIGN.md 寫 navy、實作 teal/gold | 重寫 DESIGN.md 對齊實作 token（editorial.\* CSS 變數為 SSOT），列為 PR 審查項 |
| i18n 骨架空轉 | 二選一：root 平台全頁面接 i18n（沿用 FTG 字典模式），或砍掉 en/ja 別假裝 |
| root `ignoreBuildErrors: true` | 分階段歸零：新 route 一律 typecheck、舊債設 tsconfig.checklist 逐目錄開 |

### 2.3 轉換後端統一（線索不再丟失）

```
所有站表單（FTG CtaForm / HTB Contact / root demo 請求）
        │ POST JSON + honeypot + recaptchaToken
        ▼
共用 CF Worker「lead-api」（ftgtours-api 擴充 or 新 worker）
        │ 1. server 端 reCAPTCHA siteverify
        │ 2. 寫 D1 leads 表（含 source/site/activity_type=slug）
        │ 3. Resend 發通知信給 owner + 自動回執信給客戶
        ▼
D1 leads（單一真相）→ 每日彙報（可選 Telegram bot）
```

FTG Worker（`apps/ftg-tours-website/worker/`）已是正確形狀——把它泛化成全站共用，HTB/root 接同一端點（不同 `site` 欄位）。

---

## 三、客戶旅程設計（每條產品線的完美路徑）

### 3.1 FTG 墾趣（B2C/B2B 企業旅遊）

```
認知        落地頁（ hero: 一句話價值主張 + 社會證明 + 主 CTA）
  │          ↓ SEO: 每產品頁獨立 URL、結構化資料、zh/en hreflang
考慮        產品頁 x6（每頁結尾 CtaForm + 客戶案例 + FAQ 手風琴）
  │          ↓ 無痛比較表：方案差異一覽
轉換        /contact（8 欄 + 蜜罐 + v3）→ Worker → D1 + 即時通知
  │          ↓ 5 分鐘內自動回執信（含下次聯絡承諾）
交付        journey.ftgtours.esggo.co（Google 登入 → 行程儀表板 →
  │          行前準備/打卡/ESG 任務/徽章 → Impact Note PDF）
留存        Impact Note 分享（公開連結+品牌牆）→ 明年復購鉤子
            + /philosophy 品牌故事頁強化信任
```

**必修**：Journey API 死路由修復（補 JWT_SECRET/GOOGLE_CLIENT_ID secrets + PM2 條目）——交付層是「成案後」體驗，斷了就沒有復購。

### 3.2 ESGGO 平台（B2B SaaS 化報告書）

```
認知        （待建）/ 或由 L1 語音工具尾部 CTA 帶入
  │          hero: 「AI 協作、可驗證的 GRI/CSRD 報告書」
考慮        /pricing（三階：Free 驗證器試用 / Team / Enterprise）
  │          /demo（預約 15 分鐘產品導覽，接 Calendly 或自建表單）
轉換        /contact 或 demo 表單 → lead-api（同 2.3）
  │          Free tier: 免費跑 verifier + 重大性矩陣試算（產品內 PLG）
交付        /login → sustain-write 動態表單 → materiality →
  │          carbon → verifier（hash 鎖鏈）→ export
留存        月度變動提醒（法規更新掃描）、團隊協作席次升級
```

**平台首頁改造**：`app/page.tsx` 現在是內部 A01-A02 設施矩陣（工程師視角）。改成「對外落地頁 + 內部入口分離」：`/` = 行銷落地（未登入可見），`/app` 或 `/login` 後才進設施矩陣。

### 3.3 HTB 高科海藻（B2B 官網）

```
認知  /（hero + #solutions 錨點）
  ↓   路由補齊：把 18 個未掛頁面全接上 + NotFound catch-all
考慮  /solutions（品牌/農場/研究/Scope3 四解法）→ /evidence（實證）
  ↓   /faq、/technology/*、/insights 內容行銷
轉換  /contact → lead-api（site=htb，role 欄位已有）
留存  /nuber（Nuber 導入案例牆）
```

### 3.4 語音工具鏈（PLG 漏斗頂）

```
免費用 omnisub/omnilive（零金鑰）
  ↓ 工具頁尾 CTA: 「把這場會議變成可歸檔的 ESG 活動證據？」
導流 esggo.co 平台 / ftgtours 企業方案
  ↓ 工具內嵌「本次辨識已處理 X 分鐘」計量 → 升級誘因
```

---

## 四、UI/UX/RWD 執行標準（產品落地 checklist）

### 4.1 以 FTG 為基準的硬標準

新頁面/改版必須通過：

1. **RWD 三視口**：375（手機）/ 768（平板）/ 1280（桌機）零水平捲動、零重疊、CTA 可點區 ≥44px。
2. **對比度**：正文 ≥4.5:1、大字 ≥3:1（FTG 的 overlay 實測工程方法照抄：量測→加層→複測→註記在程式碼註解）。
3. **效能**：LCP <2.5s（webp/avif + fetchPriority + loading=lazy）、CLS <0.1（viewport-clamp 高度而非固定 px）。
4. **行動優先**：`flex-col sm:flex-row`、touch 目標間距、mobile nav 有明確返回路徑。
5. **表單**：label 上置、helper 下置、44px 輸入、錯誤即時且不清除已填值、送出中 disabled+spinner、成功態明確。

### 4.2 設體系統一（packages/ui 路線）

- Phase 1：從 FTG 抽 tokens（tailwind preset `@esggo/tailwind-preset`）供三站 extend——只統一色彩/字體/間距，不動結構。
- Phase 2：抽無狀態元件（Button/Section/Container/Badge/CtaForm）成 React 元件包；HTB（Vue）先用 tokens，元件層用 Web Components 或維持雙實作但強制 tokens 一致。
- Phase 3：DESIGN.md 重寫為「實測 token 索引」+ 視覺回歸截圖（Playwright screenshot diff 三視口）。

### 4.3 E2E 防護網（鎖住 RWD 投資）

```ts
// playwright.config.ts 增設
projects: [
  { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  { name: 'mobile',  use: { ...devices['iPhone 13'] } },
  { name: 'tablet',  use: { viewport: { width: 768, height: 1024 } } },
]
```

最低覆蓋（每站）：首頁載入、主 CTA 可見可點、contact 表單全欄位送出 mock、375 寬零水平捲動斷言（`scrollWidth <= clientWidth`）、i18n 切換字典更換斷言（FTG）。

### 4.4 正確性閘（CI 既有 + 新增）

| 閘 | 現況 | 目標 |
|---|---|---|
| CI Green Gate | 已有（全 check 輪詢） | 保持；已修自我死鎖 |
| typecheck | root 關閉（ignoreBuildErrors） | 新增 route 必過；舊債逐目錄清單化 |
| vitest | tpx 3/3、oneringai 55/55、root 全套 | 保持全綠 |
| e2e 三視口 | 無 | 新增（4.3） |
| 表單端點探活 | 無 | Worker /health + CI curl 斷言 |
| 依賴安全 | Dependabot 29→5（全已接受/誤報） | 盯 postcss 專項 |

---

## 五、落地路線圖（建議執行順序）

### Sprint A — 止血（線索不再流失，1-2 天）

1. **HTB contact 接 lead-api**：把 `alert()` 換成 fetch 到 ftgtours Worker（加 `site=htb` 欄位）或獨立 Worker；同步補 NotFound catch-all + 掛上 18 個死路由。
2. **FTG 線索通知**：Worker 加 Resend 發信（owner 通知 + 客戶回執）；server 端 reCAPTCHA siteverify 補上。
3. **Journey API 修復**：VPS 補 secrets + docker-compose/ecosystem 條目，讓 `journey.ftgtours.esggo.co` 真的通。

### Sprint B — 補面（平台有入口，3-5 天）

4. **root 平台落地頁**：`app/(marketing)/` 新分組：landing（hero/價值/社會證明/CTA）、pricing（三階）、contact/demo 表單 → lead-api。
5. **L1→L2 導流橋**：omnisub/omnilive 頁尾加「產出正式報告」CTA 連結。

### Sprint C — 防護（品質鎖定，持續）

6. Playwright 三視口 projects + FTG/HTB/root 各一條轉換路徑 e2e。
7. `@esggo/tailwind-preset` 抽出 + 三站 extend；DESIGN.md 重寫對齊。
8. root `ignoreBuildErrors` 債務清單化（新建 route 全 typecheck）。

### Sprint D — 增長（可選進階）

9. Impact Note 公開分享頁（SEO 病毒環）。
10. L1 工具計量+升級誘因、平台 Free tier verifier PLG。
11. i18n：依流量數據決定 root 平台是否全接（zh/en 雙語起步，ja 暫緩）。

---

## 六、關鍵決策記錄（ADR 摘要）

| 決策 | 理由 | 反悔成本 |
|---|---|---|
| 線索後端統一到 CF Worker+D1 | 已驗證（FTG 在用）、零 VPS 負擔、全球邊緣、免運維 | 低（表單端點字串替換） |
| 設計系統以 FTG tokens 為 SSOT | 唯一經過對比度工程與 RWD 實測的實作 | 低（preset 可版本化） |
| 平台首頁與內部入口分離 | 工程師視角矩陣不該是行銷第一印象 | 中（路由 restructure） |
| L1 語音工具維持零金鑰 | 差異化優勢，勿為轉換殺鉤子 | — |
| i18n 不半吊子 | 要嘛全接要嘛砍，假三語比單語更傷信任 | 低 |

---

## 附錄：驗收清單（產品落地 Definition of Done）

- [ ] 每條產品線的「認知→轉換」路徑端到端走通（真表單→D1→收到通知信）
- [ ] 三視口（375/768/1280）零水平捲動、CTA 可點、對比度達標
- [ ] 每站 NotFound 有品牌化 404、無空白頁
- [ ] 表單有蜜罐+server 端驗證碼驗證+速率限制
- [ ] e2e 三視口 smoke 在 CI 全綠閘內
- [ ] DESIGN.md 與 tokens 一致（PR 審查項）
- [ ] 行動裝置真機抽檢（iOS Safari + Android Chrome）通過
- [ ] 首屏 LCP <2.5s（4G 模擬）、無 console error
