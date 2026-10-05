# GitHub CI 全綠閘 (CI ALL-GREEN GATE) — 紅燈不得開下一個 PR

> **source_origin:** 使用者指令 2026-10-04 —
> 「尤其是 github 會跳倉庫通知 如果出現錯誤代碼的提示, 就要自動修復到正確才能進行下一個 PR」

## 規則

**GitHub 上任何紅燈（失敗的 check / check run / 未完成 / 外部服務未通過），
都不得進行下一個 PR。必須自動修復到全綠為止。**

這是**阻塞式**規則，與 [GREEN-GATE.md](GREEN-GATE.md)（本地全綠閘）串聯：

```
本地 gate 全綠 (green-gate.sh exit 0)
   └─▶ push / 開 PR
        └─▶ CI gate 全綠 (ci-gate.sh exit 0)
             └─▶ 才可進行下一個 PR
```

任一環節 `exit != 0` → **停在當前步驟**，修復、重跑，直到 `exit 0`。

## 執行

```bash
# 檢查當前 HEAD 的所有 GitHub checks（自動等待 in_progress）
.hermes/auto-repair/ci-gate.sh

# 檢查特定 commit
.hermes/auto-repair/ci-gate.sh <sha>

# 只列出狀態，不做判定
.hermes/auto-repair/ci-gate.sh --list <sha>
```

環境變數：
- `GREEN_GATE_REPO` — 指定 repo（預設自動偵測）
- `GREEN_GATE_WAIT` — 等待 in_progress 的上限秒數（預設 900）

## 判定分類（實測驗證）

| check 結論 | 分類 | 是否阻擋 |
|---|---|---|
| `success` / `neutral` / `skipped` | PASS | 否 |
| `failure` / 其他失敗 | **FAIL** | **是** |
| `cancelled` / `timed_out` / `action_required` / `stale` | **ASK**（人工） | **是** |
| `in_progress` / `queued` / `pending` / `waiting` | WAIT | 等待上限後阻擋 |

Exit code 是唯一判準：

- `exit 0` → **全綠** → 可開下一個 PR
- `exit 1` → **非全綠** → **不得前進**

### 為何 `cancelled` 歸為人工而非自動修復

**實測證據**（Omniesggo commit `fbfdfd78` 與 `2cc5a6bd`）：

```
FAIL  (無)
ASK   SonarCloud Code Analysis    cancelled (外部服務，需人工 re-run)
```

SonarCloud **在 repo 沒有 workflow 檔**（只有 `sonar-project.properties`），
由外部 GitHub App（slug `sonarqubecloud`）建立，獨立於 GitHub Actions 之外。

而既有的 `.github/workflows/auto-repair.yml` 只在
`github.event.workflow_run.conclusion == 'failure'` 時觸發 ——
**抓不到 `cancelled`**。

若把 `cancelled` 當成一般 FAIL 丟給自動修復，
會進入一個永遠贏不了的迴圈（沒有 workflow 可以觸發它）。
分類為 ASK 才能誠實反映「自動修復觸及不到，需人工 re-run」。

> **更正（2026-10-05 複驗）**：本節初版斷言 SonarCloud「從未在此 repo 成功過」。
> **該宣稱已被證偽** —— commit `2cc5a6bd`（分支 `verify/ci-green-gate-e2e`）
> 的 SonarCloud check 結論為 **`success`**。正確敘述是「**在 main 上不穩定**」，
> 見下方白名單章節的重新實測證據。

## 已驗證行為（實測，非推測）

| 情境 | 實測結果 |
|---|---|
| SonarCloud `cancelled` | `待人工確認 ⚠`，**exit 1** |
| 分類正確性 | `FAIL` 清單為空、`ASK` 正確捕捉 SonarCloud |
| 本地 `apps/aistation` 56 測試 | `全綠 ✅` exit 0 |
| 注入 `assert 1 == 2` | `非全綠 ❌` exit 1（負向測試證明會擋） |

## 與既有 auto-repair.yml 的關係

repo 已有 `.github/workflows/auto-repair.yml`，內含：
`analyze`（Analyze CI Failure）、`repair-typescript`、`repair-eslint`、
`repair-build`、`repair-dependency`、`repair-docker`、`repair-prisma`。

**本 gate 不重複造輪子** — 它是**前置守門員**：
判斷「是否全綠」並擋下，auto-repair.yml 負責「怎麼修」。

### 已知的既有缺口（如實記錄，未修）

`auto-repair.yml` 的 `if` 條件只比對 `conclusion == 'failure'`，
因此以下結論**不會**觸發自動修復：
`cancelled`、`timed_out`、`skipped`、`action_required`、`stale`。

這是 workflow 層的缺口，修它需改 `auto-repair.yml` 的 `if` 條件
（`failure` → `failure || cancelled || timed_out` 等）。
**本文件只記錄，未修改** — 避免在未經驗證的情況下改動 CI 觸發條件。

## known-flaky 白名單（條件式放行，非全綠）

`ci-gate-known-flaky.txt` 允許特定 check 由 ASK 降級為 WARN。
**降級不等於綠燈** — verdict 會明確輸出「條件式放行 ⚠」並列出例外項，
只有完全沒有例外時才會輸出「真全綠 ✅」。

語法：`<check 名稱>|<允許的結論>|<理由與證據>`（第三欄必填，須附實測證據）。

### 例外會自動失效（已實測驗證）

`flaky_reason()` 同時比對 check 名稱**與** live conclusion。
結論一旦改變（例如服務真的修好了、回傳 `success`），
白名單立即失效，該 check 重新被判為 ASK 並以 `exit 1` 阻擋。

實測證據（2026-10-05，8/8 通過）：

| 情境 | 預期 | 實測 |
|---|---|---|
| 名稱+結論都相同 | 放行 | ✅ 放行 |
| 結論改為 `success`/`failure`/`skipped` | 失效 | ✅ 失效 |
| check 名稱不同 | 失效 | ✅ 失效 |
| 僅前綴相同（`Widget` vs `Widget Check`） | 失效 | ✅ 失效 |
| 僅大小寫不同 | 失效 | ✅ 失效 |
| 白名單檔不存在 | 不報錯 | ✅ 不報錯 |

端到端反向驗證：移除白名單檔後重跑 gate，
`SonarCloud Code Analysis (cancelled)` 立即回到 ASK 且 `exit 1`。

## fail-closed：API 查詢失敗 ≠ 紅燈 check（實測 2026-10-05）

**這是本 gate 最危險的假綠來源，已修復並實測。**

### 根因

`gh api` 的**錯誤 JSON 主體寫在 stdout（rc=1）**，只有一行人類訊息在 stderr。
原本的 `2>/dev/null` 只蓋掉訊息，錯誤 JSON 直接流入 parser，被讀成一筆名為
`{"message":"No commit found...` 的紅燈 check —— **API 查詢失敗被洗成「合法失敗」**。

更隱蔽的一層：poll 迴圈原本寫 `while :; do ... done < <(fetch_checks)`，
`fetch_checks` 被**二次呼叫**，使得任何加在它上面的 rc 守衛都是死碼。

### 修復

- 拆出 `fetch_checks_raw` / `fetch_checks`；rc≠0 時輸出 `CIGATE-FETCH-ERROR` 並**拒絕判定**
- 迴圈改為**單次擷取** `checks_raw` + herestring 消費（rc 守衛真正生效，且省一次 round-trip）
- `--list` 路徑同樣補 rc 檢查
- 新增 **exit 2** 語意：無法取得資料時用 2 區隔於「確定非全綠」的 1

### 實測（全部真跑）

| 情境 | 期望 | 實測 |
|---|---|---|
| bogus SHA（gate 模式） | 拒絕判定 | `rc=2`，印「拒絕判定，不輸出任何綠燈結論」✅ |
| bogus SHA（`--list`） | 不印 JSON 當 check 列 | `rc=2`，無偽造 check 行 ✅ |
| 真實 commit | 正常判定 | 19 checks、去重後正常輸出 ✅ |
| WSL（無 `gh`） | 拒絕判定 | `rc=2` ✅ |

### ⚠️ 使用陷阱：ref 名稱不是任意合法路徑

實測差異：

```bash
gh api repos/…/commits/main/check-runs        # ✅ 200，15 checks
gh api repos/…/commits/origin/main/check-runs # ❌ 422 "No commit found for SHA: origin/main"
```

所以 `ci-gate.sh origin/main` 會 **fail-closed（rc=2）**。
**要查遠端最新狀態請傳 `main`，不要傳 `origin/main`。**
（這是 API 路徑限制，非 gate 缺陷；但第一次踩到時會誤以為 gate 壞掉。）

## 強制執行的誠實邊界（實測複驗 2026-10-05）

**此 gate 目前不會真的擋住 GitHub merge。** 複驗結果：

```
GET /repos/DingJun1028/Omniesggo/branches/main/protection
→ 403 {"message":"Upgrade to GitHub Pro or make this repository public to enable this feature."}
```

這是**方案層限制**（private repo + free plan），不是設定錯誤 —— 無法靠重試或改設定解決。
因此現況為：**紅燈訊號 + 流程紀律**，而非技術強制。不得宣稱它會阻擋合併。

已實證它**確實會在 `pull_request` 事件觸發**並可轉紅（開 PR #4 實測：
2 個 check 未跑完 → `未完成 ⚠` → exit 1）。但 merge 仍需人手不點。

**升級為真強制的前提**：repo 轉為 public，或升級 GitHub Pro/Team 後才能設 required checks。

### 目前唯一例外：SonarCloud Code Analysis

實測根因（2026-10-05）：

1. SonarCloud 由**外部 GitHub App**（slug `sonarqubecloud`）建立 check，
   repo 內 `.github/workflows/` **無** sonar workflow。
2. SonarCloud 端**從未註冊此專案**：查詢 `esggo_esggo-monorepo` 回
   `Component key not found`。App 卻已綁定此 repo（共 26 個 check-suite app），
   因此 App 建了 check 卻無從執行 → `cancelled`。
3. `sonar-project.properties` 宣告 `sonar.projectKey=esggo-monorepo`
   與 org `esggo`，但 repo 內**沒有任何 `SONAR_TOKEN` secret**（58 個 secret 中無），
   無法在本 repo 觸發分析。
4. `POST /check-runs/{id}/rerequest` 回 `{}` 但狀態不變 — GitHub API
   無法單獨重啟外部 App 的分析。

此 check **不阻擋 GitHub merge**：branch protection 不可用
（private repo + free plan，API 回 403），SonarCloud 非 required check。

### 真正解除條件（非白名單繞過）

必須讓 SonarCloud 回傳真實結論，而非靠白名單放行：

- 在 SonarCloud 建立 `esggo` org 底下的對應專案，且 `projectKey` 與 repo 對應；或
- 移除 SonarCloud App 對此 repo 的綁定（若不再需要該服務）；或
- 在 repo 內建立 sonar workflow 並注入 `SONAR_TOKEN` secret。

在此之前，gate 一律以「條件式放行 ⚠」誠實標示，不宣稱全綠。

## 誠實標示原則

「CI 全綠」只代表 **GitHub checks 全部通過**。
它不代表：功能正確、產物落地、部署成功、回歸無誤。
真實功能驗證必須另外實測，不得以 gate 通過代替實測證據。