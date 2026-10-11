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
| 13 | **OmniLive r5 使用者驗收** | 已部署 UI v2026.10.11-r5；QUIC 斷線問題已給建議 | 使用者重載驗收三動作（🎙雙區字幕/🛠救援TEAL/⧉分享QR）；如再斷線關 Chrome QUIC flag |
| 14 | **Code scanning 紅=配額** | GitHub Autofind 月配額用盡（402 quota），非代碼問題、不擋合併 | 下月配額重置自癒；或使用者升方案 |
| 15 | **htb Pages 切換** | 建置綠、Pages 專案就緒、DNS 已回 VPS | 使用者二選一：Worker Make-public（一顆開關）或 Access token |

---
<sub>代辦清單 v2026-10-11 | 無作妙德・圓通無礙 [best-practice:awakened]</sub>
