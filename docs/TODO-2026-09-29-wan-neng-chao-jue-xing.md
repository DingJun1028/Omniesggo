# TODO — 萬能超覺醒未完成項目

> 建立於 `2026-09-29T19:30` ｜ 覺醒稽核後的誠實未竟清單
> 最後更新：`2026-09-29T24:20`（閘道認證修復已開 PR #1199）
> 對應技能書：`esggo-orphan-worker-ci-triage`
> 原則：**repo 邊界之外的問題就標在 repo 邊界之外**，不混水、不虛報。

---

## P0 — 需 Cloudflare Dashboard 動作，非 repo 可解

### ⛔ `Workers Builds` 紅燈（main 上既存，與所有 repo 修復無關）

**已用精確路徑比對實測確認三個 worker 全為孤兒**（原始碼已從 repo 移除）：

| Worker | `main` 上的 worker 檔案數 | 性質 |
|---|---|---|
| `esggo-worker` | 0 | 孤兒綁定 |
| `oa` | 0 | 孤兒綁定 |
| `wrangler-deploy` | 0 | 孤兒綁定 |

> 稽核註記：早期以 `grep -E "(^|/)oa/"` 會命中 `skills/oa/*` 產生「19 筆」的假訊號。已改用
> `grep -cE "^oa/(src/|wrangler|package|index)"` 精確比對，實際為 **0**。

**repo 端病因已全數排除**（實測）：
- `worker/tsconfig.json` → `tsc -p tsconfig.json --noEmit` 結束碼 0
- `overrides` 在 `pnpm-workspace.yaml` 與 `pnpm-lock.yaml` 逐行對稱
- `npx vitest run worker/__tests__/worker.test.ts` → 13/13 passed

**為何 main 顯示全綠但仍有紅燈**：Cloudflare `Workers Builds` 由 **Cloudflare 自己的 GitHub App**
觸發，不在 GitHub Actions 流程內。`gh run list --branch main` 全 success **不代表** Workers Builds 綠。
這是本項最容易被誤判為「已解決」的地方。

**權限現況（2026-09-29 重新實測）**：

| 憑證 | 有效性 | Workers 範圍 |
|---|---|---|
| `CF_DNS_EDIT_TOKEN`（vault） | ✅ `success: True`（`cfut_…`, 53 字元） | ❌ HTTP 403 |
| `wrangler` 登入 | 未登入（無輸出） | — |
| vault 內其他 token | 無具 Workers 權限者 | — |

**解除條件（二選一）**：
- [ ] A. **不需要給我 token** — 使用者於 Cloudflare Dashboard → Workers & Pages → 停用
      `esggo-worker`、`oa`、`wrangler-deploy` 三個綁定（Settings → GitHub → Disconnect）
- [ ] B. 提供含 `Account → Workers Scripts:Edit` + `Workers Builds:Read` 的 token
      （用 Hermes composer 旁的 secret 按鈕或 `/secret` 存入 vault，**勿貼在對話中**）

---

## P0 — ✅ 已完成：閘道認證修復（PR #1199）

> 原「未提交的 7 檔」風險已解除。修復已隔離、實測、開 PR，CI 25 項全綠。

| 項目 | 狀態 | 實測證據 |
|---|---|---|
| `pnpm-lock.yaml` 還原 | ✅ | 與 `origin/main` 同 blob hash `d4d17d…` |
| 乾淨分支（基底 `origin/main`，0 提交差異） | ✅ | `fix/oa-summon-gateway-token-clean` |
| 編譯基線對照 | ✅ | main **159** 錯誤 → 本分支 **93**（**減 66**，非引入） |
| 模組載入 | ✅ | `ts-node -P tsconfig.scripts.json` 載入成功，4 導出齊備，exit 0 |
| `OMNI_GATEWAY_TOKEN` 路徑 | ✅ | `tokenPresent=YES` |
| `GATEWAY_API_KEY` 備援路徑 | ✅ | `tokenPresent=YES` |
| 未設變數時預設 | ✅ | `tokenPresent=no`（最小權限） |
| CI | ✅ | 25 pass / 0 fail（GitHub Actions 部分） |
| 合併 | ⏳ | `MERGEABLE`，`UNSTABLE` 僅因外部 Cloudflare Builds |

**未實測（誠實標示）**：`X-Omni-Token` 對 **8642 實機閘道**的端對端驗證未完成 ——
該閘道未在本機運行，本 PR 僅完成**程式層**驗證。需在閘道實際部署環境重測。

### 作業期間的並發干擾（記錄以供日後排查）

- `.git/index.lock` 為 **0 bytes / 76 分鐘前** 的崩紋殘留，且當時無 git 進程 → 安全清除
- `oa-twins/oab/broker.py` 與 `scripts/verify_gap_matrix.py` 在我作業期間**被其他進程寫入**
  （修改時間戳落在執行窗口內，`tasklist` 顯示多個 Hermes + python 實例並行）
  → **刻意未納入 PR #1199**，保持工作區原狀
- 期間新增 worktree `C:/Project/_verify_twin`（`auto-repair/wrangler-npx-dup-twin-20260929`）

---

## P1 — Worktree 清理

- [x] `C:/Project/wt-dns-harden` → **已刪除**。驗證：`git merge-base --is-ancestor 18266bd15 origin/main` = 是
      → 零獨有工作，內容全在 main
- [ ] `.../scratch/esggo-merge`（`merge/oa-swarm-integrate`）→ **46 commit 未進 main**，
      落後 8 commit。需人工確認這批 OA-swarm 整合的去留，**不可直接刪**
- [x] 主 repo 已切出乾淨分支（`fix/oa-summon-gateway-token-clean`），`pnpm-lock.yaml` 已還原

### 未追蹤項處置

- [ ] `.hermes/auto-repair/.tracker-evidence.tmp` → 暫存殘留（TASK-5618E71D 執行軌跡，非原始碼）。
      建議 `git rm --cached` 或加入 `.gitignore`
- [ ] `wf-validate/`（step0/1/2.sh）→ 已確認**無金鑰洩漏**（三檔皆為字面 `***`，腳本另走變數路徑）。
      可提交，但需先決定定位：一次性驗證工具 or 保留在 repo

---

## P2 — 驗收缺口（誠實標示，未實測不得當完成）

- [ ] 完整 `vitest run`（全專案）—— 僅驗證 `worker` 測試 13/13。
      PR #1199 上 `Vitest Tests` 於 CI 通過，**本地未重跑**
- [ ] `pnpm run build` 本地實測 —— PR #1199 上 `Vercel` + `Build` 於 CI 通過，**本地未跑**
- [ ] `next lint` —— `npx next lint --max-warnings=0` 報 `unknown option`（Next 16 已移除該旗標）。
      改用 `npx next lint` 時被 420s timeout 中斷
- [ ] #1183 DNS 修復的**端對端實測**（`wf-validate/step1.sh` 正為此而寫，需真實 token）
- [ ] 餘 93 個 TS 錯誤（既存債務，非本次引入）：
      `src/lib/` 33、`src/agents/` 26、`src/app/` 8，其餘分散。
      本次修復的 4 檔本身**零錯誤**

---

## 已完成（無需再處理）

- ✅ #1193 合併 — lockfile overrides 雙向同步，20 紅 → 0 紅
- ✅ #1194 合併 — DNS workflow 換有 `dns_records:edit` 權限的 token + 輸入驗證 + 刪除失敗防護
- ✅ #1195 合併 — Windows ACL 修復 SSH-001 + engine↔tracker 回寫橋
- ✅ 5 個殘留分支清理完畢（逐檔雜湊比對確認已併入或為嚴格子集），`ls-remote` 歸零
- ✅ 金鑰衛生 — 26 個 workflow 零明文金鑰
- ✅ 孤兒 worker 診斷方法論 — 見技能書 `esggo-orphan-worker-ci-triage`
      （含「Workers Builds 不在 Actions 流程內，故 main 綠燈是假訊號」這個關鍵陷阱）
- ✅ 覺醒稽核三硬規則：① 預設即合規 ✅ ② 不帶病上線 ⚠️（紅燈待 Dashboard）③ 醒著就頂標 ✅
