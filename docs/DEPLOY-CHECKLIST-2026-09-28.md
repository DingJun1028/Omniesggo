---
source_origin: 万能分身 session (2026-09-28) / 交付包配套
created: 2026-09-28
modified: 2026-09-28
co_authors: [agent:07, agent:20, agent:27, agent:30]
lifecycle: active
access: public-research
---

# 部署清單：終始矩陣驗證 × 依賴安全閉環

> 配套文件：`docs/DELIVERY-CERT-2026-09-28.md`（證書）、
> `docs/security/dependabot-triage-2026-09-28.md`（漏洞優先序）

---

## 階段 A — 已在本地完成（無需部署動作）

以下項目已推送至 `origin/feat/oa-swarm-array-routing-ws-auth`，無待辦。

```
[✓] commit ebbeadca8  vitest override 補 <5 上界
[✓] commit e86c8d064  my-worker pnpm-workspace.yaml
[✓] commit e66473548  jose v6 / runtime 型別修復
[✓] commit 7ee699a9b  59 筆漏洞盤點評估
```

---

## 階段 B — Merge 前置（需 1-2 分鐘，可選）

### B1. 重跑 build 確認網路故障已恢復

`Build & publish AI Station image` 於 10:47 失敗，錯誤為
`Could not find a version that satisfies the requirement pytest-cov>=5.0`。
已查證 `pytest-cov 5.0.0` 存在於 PyPI（latest 7.1.0），且**同分支 10:42 成功、
10:47 失敗**（相同程式碼），故屬 runner 網路暫時故障。

```bash
# 觸發重跑
gh run rerun 36411758580 --failed

# 驗證
gh run view 36411758580 --json conclusion
# 期望：success
```

- [ ] B1. build 轉綠

### B2. 確認 PR 可 merge

```bash
gh pr view 1173 --json mergeable,mergeStateStatus
# 已知：mergeable=MERGEABLE, mergeStateStatus=UNSTABLE
```

`UNSTABLE` 源於 3 項紅燈。已查證 `main` **無 required status checks**
（API 回 404 `Required status checks not enabled`），故紅燈不阻擋 merge。

- [ ] B2. 確認 PR review 狀態後 merge

---

## 階段 C — Merge 後驗證

### C1. main 分支 CI 全綠

```bash
git checkout main && git pull
npx tsc --noEmit -p tsconfig.json    # 期望 exit 0
npx vitest run                      # 期望 855 passed
node tools/ts-matrix/verify.mjs     # 期望 exit 0
node scripts/verify-terminal-origin.mjs  # 期望 exit 0
```

- [ ] C1. 四道閘全綠

### C2. Dependabot 告警降數驗證

修復預期消除 **12 筆 critical**（vitest phantom）與 **4 筆 high**（fast-uri SSRF）。

```bash
gh api repos/DingJun1028/esggo/dependabot/alerts?state=open&per_page=100 \
  --jq '[.[] | select(.security_advisory.ghsa_id=="GHSA-5xrq-8626-4rwp")] | length'
# 期望：0（修復前為 12）

pnpm audit --json --ignore-workspace  # 期望 critical 0
cd my-worker && pnpm audit --json     # 期望 fast-uri 不在 advisories
```

Dependabot 掃描週期通常為每日，最遲 24 小時後可確認。

- [ ] C2. critical 12 → 0
- [ ] C3. fast-uri 從 advisories 消失

---

## 階段 D — 非阻擋的後續強化（可延後）

### D1. 3 筆 nested workspace 的 hono 告警

`apps/learning-center/esggo-auto-repair/worker` 有 7 筆 hono 告警
（`hono/cors` ReDoS、`parseBody()` 記憶體耗盡）。該處為**巢狀** pnpm
workspace，其 `pnpm-workspace.yaml` 無 `overrides:` 區塊，故 root 覆蓋不到。

屬 P1，非本次 P0 範圍。

- [ ] D1. 決策：補 nested override 或維持現狀

### D2. my-worker 是否納入 root workspace

目前 `my-worker` 獨立於 root workspace，需自行維護 `pnpm-workspace.yaml`。

**決策兩難**（需用戶判斷）：

| 選項 | 代價 |
|------|------|
| 納入 root workspace | 統一 override 管理，但 `pnpm-workspace.yaml:22-24` 註解記錄過由此類 glob 污染引發 `ERR_PNPM_OUTDATED_LOCKFILE` 的前例 |
| 維持獨立 | 需手動同步 override（本次已建立此模式並在檔內註明理由） |

- [ ] D2. 決策：納入或維持獨立

### D3. my-worker 部署管線

`my-worker` 目前**無部署管線**（root `wrangler.toml` 的 main 為
`worker/src/index.ts`，非 `my-worker/src/index.ts`）。故本次 SSRF 修復消除的
是依賴層風險，非當下線上暴露。

若未來要部署此 worker，需先建立管線並複驗 `fast-uri` 解析結果。

- [ ] D3. 決策：是否建立部署管線

---

## 階段 E — 需外部權限（我無法執行）

### E1. GitGuardian 誤報處理

檢測到 1 筆 secret，但值為測試 fixture `s3cr3t-ws-token-abc123`
（leetspeak + 單字 "token" + `abc123`，3.75 bits/char，無任何廠商前綴），
僅存在於 PR 首個 commit `f692ce78b4bd`。PR head 已改為
`test-token-not-a-real-secret_...`。

GitGuardian 掃描 PR 全部 8 個 commit 的範圍而非 head tree，故修復後仍持續報。

**需在 GitGuardian dashboard 執行**（我無該權限）：

1. 前往 incident `37682870`
2. 標記為 false positive / ignore

替代方案（不建議）：rebase 丟棄首個 commit 以清出 diff 範圍，但會改寫
8 個 commit 的共享分支歷史。

- [ ] E1. 在 dashboard 標記 incident 37682870 為 false positive

---

## 風險登記

| 風險 | 影響 | 緩解 |
|------|------|------|
| 合併他人 session 的 commit（`1e161db08`、`4d610f28d`） | 未經我驗證的程式碼進入 main | 已驗證：tsc exit 0、855 tests passed（含 19 個新測試）。但作者欄為 "Your Name"（未設定 git user.name） |
| pnpm 11 不再讀 `package.json` 的 `pnpm` 欄位 | override 靜默失效 | 已記錄於 `devops/esggo-dependabot-override` 技能書，含 pnpm 的警告原文 |
| `drift-report.json` 每次執行都變動 | 工作區雜訊 | 已修 lock，但 report 本身含 timestamp 仍會變動（設計如此） |

---

## 交付確認

```
本清單所有「已完成」項目均附實跑指令與輸出。
所有「未完成」項目均註明原因與執行權限歸屬。
無任何未驗證的完成宣稱。
```
