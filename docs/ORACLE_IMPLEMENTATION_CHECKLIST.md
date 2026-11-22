# Oracle 實作檢查清單

本文件提供 Oracle Autonomous DB 整合的最小實作檢查，與 `ORACLE_INTEGRATION.md` 搭配使用。
請依序核對，避免把 OCI 憑證、wallets、密碼帶進前端。

---

## 0. 先備確認

| 核對項目 | 建議檢查點 | 通過 |
| --- | --- | --- |
| 前端分流開關 | `.env` 有 `VITE_USE_ORACLE` 且預設為 `false` | ☐ |
| proxy base URL | `.env` 有 `VITE_ORACLE_API_BASE`（僅在 `VITE_USE_ORACLE=true` 時使用） | ☐ |
| 既有流程保留 | 無 proxy 時，Admin 匯出與紀錄處理仍走現有 Firestore 流程 | ☐ |
| 密碼管理 | OCI 帳號、密碼、wallet 只出現在 proxy 的祕密管理（不在 repo、build artifact） | ☐ |

---

## 1. 代理程式設計

- [ ] proxy 服務只包含 Oracle sidecar 程式碼，不必耦合前端 bundle。
- [ ] `GET /health`：
  - 至少驗證 proxy service 存活；
  - 建議另外暴露 readiness（OCI 連線測試）可作為 Chap 部署/探針，但不要洩露憑證細節。
- [ ] `POST /exports`：
  - `body: { records, locale? }`
  - 回傳統一的 `{ status, data?, error? }`，避免直接暴露 stack trace。
  - 做好 rate limit / payload size / timeout 設定，防止 Always Free 資源被壓垮。

---

## 2. Firestore 與 Oracle 同步策略

本方案檔案以 **Firestore 為主，Oracle 為補充/匯出目標**。
不要在 proxy 內把 Firestore 作為 Oracle 的唯一同步機制，除非清楚資料一致性需求。

- [ ] 可以同步：
 - 定期批次匯出（Admin 頁面由前端觸發，或 background job）。
 - 以 DB transaction 為單元，每 batch 紀錄 commit position / timestamp。
- [ ] 不要同步：
 - 把 Firestore listener 直接寫成 Oracle trigger 的雙向同步。
 - 未處理 Conflict 的全量 overwrite。
- [ ] 最少欄位對應：
 - `records.id` / `records.locale` / `records.createdAt` / status。
 - 任何 Oracle schema 變更，都要回到這份文件更新欄位說明。
- [ ] 失敗重試：
 - 可重試的情況下保留冪等 `exportId` 或 `requestId`；
 - 不可重試的失敗要寫入 proxy log，並由後續批次補匯。

---

## 3. 安全性

- [ ] proxy 對外連線掛在 VPC / 私人網路（或 reverse proxy）。
- [ ] CORS 只允許 Firebase Hosting domain，不要用 `*`。
- [ ] Oracle wallet / connect string 由 secrets manager / env file 注入，不要 commit。
- [ ] proxy 輸出 log 不印出 `records` 的完整內容；必要時只印 `recordIds`。

---

## 4. 部署與監控

- [ ] CI：
 -  lint / test / build 至少跑過。
 - proxy 與前端共同發佈 pipeline（先確認 Firebase Hosting 的 rewrite/redirect）。
- [ ] Hosting：
 - 若無 proxy，`VITE_USE_ORACLE=false` 時不得呼叫 Oracle API。
 - 確認 Hosting fallback 與 proxy health endpoint 齊全。
- [ ] 監控：
 - proxy `request count` / `error rate` / `latency`；
 - Oracle DB 的 CPU/storage/backlog 告警；
 - frontend 在 `VITE_ORACLE_API_BASE` 失敗時回退到 Firestore 流程。

---

## 5. 前端整合

- [ ] 讀 `VITE_USE_ORACLE` 與 `VITE_ORACLE_API_BASE` 的地方改為共用 util；
- [ ] 在元件內標註哪個頁面/按鈕走 proxy；
- [ ] proxy 失敗時，顯示「無法使用 Oracle，已回退儲存至 Firestore」凍結 message；
- [ ] 不要為了切換資料庫而重寫業務邏輯；把 side effect 收斂在 repo / hook。

---

## 6. 後續維護

- [ ] 每次變更 Oracle schema，一併更新：
 - `docs/ORACLE_INTEGRATION.md`
 - `docs/ORACLE_IMPLEMENTATION_CHECKLIST.md`
 - 若有的話，對應的 OpenAPI / proxy contract
- [ ] proxy 與 frontend 版本至少在 Charter 同一分段發佈；
- [ ] Always Free 資源到期前 30 天發出提醒，避免 sidecar 斷線無預警。
