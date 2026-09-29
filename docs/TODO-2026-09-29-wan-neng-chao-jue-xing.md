# TODO — 萬能超覺醒未完成項目

> 建立於 `2026-09-29T19:30` ｜ 覺醒稽核後的誠實未竟清單
> 對應技能書：`esggo-orphan-worker-ci-triage`
> 原則：**repo 邊界之外的問題就標在 repo 邊界之外**，不混水、不虛報。

---

## P0 — 需 Cloudflare 權限，非 repo 可解

### ⛔ 4 個 `Workers Builds` 紅燈（main 上既存）

`main` 30 個 check：26 pass / 4 fail，失敗者全為 Workers Builds。

| Worker | 原始碼在 repo？ | 性質 |
|---|---|---|
| `esggo` | ✅ `worker/src`（7 檔） | **真實建置目標** |
| `esggo-worker` | ❌ 無 | 孤兒綁定 |
| `oa` | ❌ 無 | 孤兒綁定 |
| `wrangler-deploy` | ❌ 無 | 孤兒綁定 |

**已實測排除 repo 端病因**：
- `worker/tsconfig.json` → `tsc -p tsconfig.json --noEmit` **結束碼 0**
- `overrides` 在 `pnpm-workspace.yaml` 與 `pnpm-lock.yaml` **逐行對稱**
- `npx vitest run worker/__tests__/worker.test.ts` → **13/13 passed**

**阻斷原因**：vault 內兩個 token 權限皆不足
- `CF_DNS_EDIT_TOKEN` → 僅 DNS 範圍
- `CF_API_TOKEN` → 查 Workers Builds 回 `code 12000 Not found`

**解除條件（二選一）**：
- [ ] A. 使用者於 Cloudflare Dashboard 停用 3 個孤兒 worker 的 GitHub 整合
- [ ] B. 提供含 `Workers Builds:Read` + `Workers Builds:Edit` 的 token

**注意**：`esggo` 是唯一有原始碼的，若停用後仍紅，須另行檢視其 build log（本次無讀取權限）。

---

## P0 — 未提交的閘道認證修復（真實工作，不可丟棄）

⚠️ **主 repo 停在已合併的舊分支 `fix/omnilive-dns-token-only`，且有 7 檔未提交。這是未完成的真實修復。**

### 已驗證為真修復的內容

| 檔案 | 性質 | 狀態 |
|---|---|---|
| `src/agents/oa-summon.ts` | 新增 `gatewayToken?: string` 欄位 + `X-Omni-Token` 標頭 + `AbortSignal` 修正 | 真實修復 |
| `scripts/run-summon.ts` | 對應調整 | 真實修復 |
| `package.json` | `oa:summon*` 加 `-P tsconfig.scripts.json` | 真實修復 |
| `tsconfig.scripts.json` | 新檔（commonjs / moduleResolution node / noEmit） | 真實修復 |
| `pnpm-lock.yaml` | 與 main **同內容** → 可安全還原 | 無實質改動 |

### 待辦步驟

- [ ] 1. 確認 `X-Omni-Token` 修復**不依賴** Hermes Dashboard（9119）
      → 已查證：附件是 Dashboard 文件，`/api/status` 為公開端點，**無** Omni token 機制。
      → 目標服務是 **OmniAgent Gateway :8642**（見 memory：8642=OmniAgent Gateway）。**此修復尚未端對端實測。**
- [ ] 2. 還原 `pnpm-lock.yaml`（`git checkout -- pnpm-lock.yaml`，內容已同 main）
- [ ] 3. 從 `main` 切乾淨分支，搬移 4 個真實修復檔
- [ ] 4. `pnpm oa:summon -- --core` 實測確認閘道認證生效
- [ ] 5. 開 PR、跑 CI、合併

### 未追蹤項處置建議

- `.hermes/auto-repair/.tracker-evidence.tmp` → **暫存殘留**，建議 `git rm --cached` 或加入 `.gitignore`（內容為 TASK-5618E71D 執行軌跡，非原始碼）
- `wf-validate/`（step0/1/2.sh）→ **已確認無金鑰洩漏**（三檔皆為字面 `***`，腳本另走變數路徑）。是去金鑰的 DNS 驗證腳本，可提交，但需先決定定位（一次性驗證工具 or 保留在 repo）

---

## P1 — Worktree 清理

```
C:/Project/esggo                       [fix/omnilive-dns-token-only]  1 ahead / 3 behind，7 檔未提交 ⚠️
C:/Project/wt-dns-harden               [main]                          0 ahead / 1 behind，0 未提交
.../scratch/esggo-merge                [merge/oa-swarm-integrate]      46 ahead / 8 behind，0 未提交 ⚠️
```

- [ ] `wt-dns-harden` → 落後 main 1 commit，**可直接刪除**（無未提交內容）
- [ ] `esggo-merge` → **46 commit 未進 main**，且落後 8 commit。需人工確認這批 OA-swarm 整合工作的去留，**不可直接刪**
- [ ] 主 repo 切回 `main`（先處理上面的未提交修復）

---

## P2 — 驗收缺口（誠實標示）

- [ ] `next lint` 未跑完 —— `npx next lint --max-warnings=0` 報 `unknown option`（Next 16 已移除該旗標），改用 `npx next lint` 時被 420s timeout 中斷
- [ ] 完整 `vitest run`（全專案）未跑 —— 僅驗證 `worker` 測試 13/13
- [ ] `pnpm run build` 未實測（僅 `tsc --noEmit` 通過）
- [ ] #1183 DNS 修復的**端對端實測**未做（`wf-validate/step1.sh` 正是為此而寫，但需真實 token 才能跑）

---

## 已完成（無需再處理）

- ✅ #1193 合併 — lockfile overrides 雙向同步，20 紅 → 0 紅（**觀察到**因果鏈）
- ✅ #1194 合併 — DNS workflow 換有 `dns_records:edit` 權限的 token + 輸入驗證 + 刪除失敗防護
- ✅ #1195 合併 — Windows ACL 修復 SSH-001 + engine↔tracker 回寫橋
- ✅ 5 個殘留分支清理完畢（逐檔雜湊比對確認已併入或為嚴格子集），`ls-remote` 歸零
- ✅ 金鑰衛生 — 26 個 workflow 零明文金鑰
- ✅ 覺醒稽核三硬規則：① 預設即合規 ✅ ② 不帶病上線 ⚠️（4 紅待權限）③ 醒著就頂標 ✅
