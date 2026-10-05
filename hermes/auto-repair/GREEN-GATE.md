# 全綠閘規定 (ALL-GREEN GATE) — Omniesggo 專案硬規則

> **source_origin:** 使用者指令 2026-10-04 —
> 「但Omniesggo 要增加一個新規定, 要全綠才能往下進行 要全部自動修復完成到好才進到下一步」

## 規則

**任何一步未達「全綠」就不得前進。必須自動修復到全綠為止，才可進入下一步。**

這是**阻塞式**規則：gate 失敗時，工作流必須停在當前步驟、修復、重跑，
不得跳過、不得標記完成、不得以「大致可用」替代。

## 「全綠」的定義

三層檢查，全部必須成立（缺一即擋）：

| 層 | 檢查 | 通過條件 |
|---|---|---|
| 1. typecheck | mypy / `pnpm typecheck` | exit 0 |
| 2. tests | pytest / `pnpm test` | exit 0 且 **0 failed / 0 error** |
| 3. lint | ruff / `pnpm lint` | exit 0 |

未安裝或專案未宣告該檢查 → 記為 `SKIP`，不算失敗（但需在報告中列明）。

## 執行

```bash
# 自動偵測專案類型
.hermes/auto-repair/green-gate.sh

# 指定子專案
.hermes/auto-repair/green-gate.sh apps/aistation
```

Exit code 是唯一判準：

- `exit 0` → **全綠** → 可進入下一步
- `exit 1` → **非全綠** → **不得前進**，必須修復

## 失敗時的處理迴圈

```
執行 green-gate.sh
   ├─ exit 0 → 全綠 ✅ → 進入下一步
   └─ exit 1 → 非全綠 ❌
        ├─ 讀取印出的失敗層與輸出尾 30 行
        ├─ .hermes/auto-repair/auto-fix.sh "<錯誤訊息>"   # 自動修復
        ├─ 手動修復無法解決的根因（禁止繞過 gate）
        └─ 重跑 green-gate.sh → 直到 exit 0
```

## 已驗證行為（實測，非推測）

| 情境 | 實測結果 |
|---|---|
| `apps/aistation` 56 測試全過 | `GATE VERDICT: 全綠 ✅`，exit 0 |
| 注入 `assert 1 == 2` 失敗測試 | `GATE VERDICT: 非全綠 ❌`，**exit 1** |
| 移除失敗測試後重跑 | 恢復 `全綠 ✅` |

## 誠實標示原則

「全綠」只代表**已宣告的檢查通過**，不代表功能正確。
真實功能驗證（如 production E2E 產物落地）必須另外實測，
不得以 gate 通過代替實測證據。

## 設計註記

`run_gate` 刻意**不**用 `if cmd; then rc=$?` 形式 ——
`$?` 在 `if`/`then` 分支內恆為 0，會把真實失敗靜默記成 PASS。
必須先執行再取 `$?`。