# AGENTS.md

## 📚 平台最佳實踐總集

> **整合文檔**：[docs/ESGGO_PLATFORM_BEST_PRACTICES.md](docs/ESGGO_PLATFORM_BEST_PRACTICES.md)
> 包含驗證、部署、CI/CD、安全、VPS 運維、Cloudflare 設定、故障排除等完整最佳實踐。
> 適用於所有在 ESGGO 生態系統中工作的開發者、運維工程師、部署工程師。

## 專案脈絡

- **目標平台**：Firebase Hosting（`firebase.json` 為單一可信來源）。
- **技術棧**：Vite + React + Tailwind + Vitest。
- **目前分支**：`main`（實查 2026-07-25；AGENTS.md 舊版曾寫 `i18n-full-translation`，已更正）。目標為完整繁體中文在地化，不接受英文 fallback。
- **使用者偏好**：繁體中文。

## 驗證順序

 modernity first，在宣傳任何變更前一律執行：

```
npm run test
npm run build
```

改動 i18n 字串、元件行為、路由或 Firebase 對應時，尤其不可跳過。

## Lint 約定

- 專案已啟用 ESLint（flat config：`eslint.config.js`），script：`pnpm run lint` / `pnpm run lint:fix`。改碼後應跑 lint，目標 **0 errors / 0 warnings**。
- **repositories 與 db.js 的 Firestore import 刻意保留**：`doc`/`setDoc`/`getDoc`/`query`/`where`/`getDocs`/`serverTimestamp`/`writeBatch` 在 local 降級模式用不到，但 Firebase 模式（`if (useFirebase && db)`）必須用到。因此 `eslint.config.js` 對 `src/repositories/**` + `src/db.js` 關閉 `no-unused-vars`——這是設計意圖，不是未清的死碼，勿擅刪這些 import（會讓 Firebase 部署炸）。
- **i18n locale 表**（`src/i18n/`）各 locale 區塊（zh-TW / zh-CN）內部的同名 key 是正常結構（不同父物件），`no-dupe-keys` 對該目錄關閉以避誤報。真正的同區塊重複 key 屬獨立 i18n 清理任務。
- **`no-empty` 允許空 catch**（如 `catch {}` 吞掉 `delete window[cbName]` 可能的錯誤），屬合理寫法。
- 修程式碼問題優先於調 config：遇 `react-hooks/rules-of-hooks` 等 error 級問題，修碼而非關規則。

## 報告與步驟缺口約定

- 執行任何有編號的驗證/流程（如 pre-commit review 的 Step 1–8）時，**每一個步驟編號都要交代**：被正確跳過的步驟（例如無失敗故跳過 auto-fix、無 linter 故跳過 lint）必須顯式標註「Step N：skipped（原因）」，不得讓編號從 N 直接跳到 N+2。
- **禁止用理由把缺口合理化掉**：不得以「不需要」「skill 沒要求」等說法繞過缺口。跳過或漏做的步驟就照實報「skipped / missed + 原因」，永遠不要狡辯。
- 報告缺口是誠實問題，不是格式問題：即便跳過本身是對的，不說出來也視為報告缺陷。

## Firebase 部署

- **安全預設**：使用 combined 部署。
  ```bash
  firebase deploy --only hosting,firestore:rules
  ```
- **hosting-only 快速路徑**：僅在確認 `firebase.json` 與 `.firebaserc` 完整、且本次無修改 `firestore.rules` 時使用。
- **驗證**：部署後必須重新跑一次 `npm run build` 並確認無連動回歸。

## 這個 repo 的路徑與環境

- 工作區在 `C:\\Project\\esggo-learning-center`（hyphen、無空白）；請在 tool call/script 中使用 POSIX/MSYS 風格路徑，例如 `/c/Project/esggo-learning-center`。
- URL 與 Firebase config 以 `.env` 為唯一可信來源，勿在元件內硬編碼目標網址。
- `.env` 不得讀入也不得出現在任何輸出中。

## i18n 約定

- 使用者在這個專案里要求繁體中文；閱讀、輸出、錯誤訊息、UI 文案均使用繁體中文。
- 新增或修改字串時，請同步補上對應 i18n key，不要殘留未翻譯的硬編碼英文字串。

## 已知 bug 狀態（2026-07-20 實查）

以下曾列於開發者 memory 的「待修 5 個 runtime bug」經實際讀取 main 分支程式碼後確認**已全部修復**，勿重複修：

- `pairing.repository.js` 缺 `getDoc` import → 已 import（第 10 行）且使用（第 65 行）。
- `submission.repository.js` 缺 `emitTelemetry` import → 已 import（第 15 行）且使用（第 70 行）。
- `App.jsx` 用 `s.timestamp` 而非 `createdAt` → 已改為防禦寫法 `(s.createdAt || s.timestamp)`（第 1011 行）。
- `App.jsx` `setSubmissions` 未宣告 → 已宣告（第 402 行 `const [submissions, setSubmissions] = useState([])`）。
- `AttachmentUploader` 缺 `t` prop → 元件定義於 App.jsx 內，2 個 call site（677、762 行）皆傳 `t={t}`。

驗證基準：PR#3 合併後 `main` 分支 `npm run test` 8/8 通過、`npm run build` 成功（exit=0）。
動手修任何「已知 bug」前，先以當前程式碼為準確認其仍存在，勿依賴過期 memory。

## 編輯與重構原則

- 小範圍修正使用 `patch`。
- 重寫整檔前先 read back 確認目前內容，避免遺漏 stale literal。
- Windows CJK 工作區以 read back 結果為準；write/patch 回報成功不構成最終答案，build 也不會發現殘留字串問題。

## Hermes Agent 協作慣例

- 本 repo 的專案規則以本 AGENTS.md 為準（cwd-only，僅在 cwd 為此專案時自動載入）。從其他目錄呼叫 Hermes 處理此專案時，請先讀本檔或 load 對應 skill（`esggo-learning-center-verify-deploy` 等）。
- **環境健康**：定期跑 `hermes doctor`；npm workspace 有 audit 警告（web/ui-tui）屬已知非阻斷性，可 `hermes doctor --fix` 或 `npm audit fix` 處理。
- **排程監控**：已設 cron 每日 09:00 跑 `scripts/esggo_healthcheck.sh`（test + build 健康檢查），失敗才告警；用 `hermes cron list` / `cronjob action=list` 查結果。
- **平行子任務**：要對本專案跑長時間或平行探索時用 `delegate_task`；會改碼的子 agent 加 worktree（`-w`）避免 git 衝突。
- **profile**：本機另有 `oa-team` profile（poolside/laguna-s-2.1:free）；預設 profile 為 `default`，切換用 `hermes profile use <name>`。
- **實戰最佳實踐（10 條，從真實踩坑歸納）**：完整版見 skill `esggo-learning-center-best-practices`（Hermes 自動載入）。重點：
  1. AGENTS.md 是 cwd-only，勿加根 `.hermes.md`（會遮蔽本檔）。
  2. verify order：改完跑 `npm run test` → `npm run build` → `pnpm run lint`（目標 0/0）。
  3. 刪「未用碼」前先 `grep -nw` 全檔核實（lint 報 unused 可能是遮蔽/遞迴隱患，如 `deleteSubmission`）。
  4. 升級依賴前先備份 `pnpm-lock.yaml`；跨 major 風險高。
  5. 勿用 pnpm `overrides` 強升傳遞依賴（undici 強升會破壞 jsdom 測試環境）。
  6. 用 `pnpm audit` 看漏洞，不是 `npm audit`（npm 工具讀不懂 pnpm 隔離結構會誤報）。
  7. 部署無關的 dev-only 漏洞（undici=Node-only、brace-expansion=dev 工具鏈）可接受，別為綠燈強升破壞鏈。
  8. 一目的一 commit，改完即 push。
  9. cron 監控用 watchdog 模式（成功靜默、失敗才告警）。
  10. `.env` 快照存 repo 外並鏡像 OneDrive，絕不進 git。
