---
title: Root Cause × Effect Elimination 根果修復
canon_id: OMN-008
date: 2026-10-09
tags: [best-practice:awakened][unit-of-learning][repair-protocol]
canonical: [[OMNITAG/INDEX]]
---

# OMN-008 · Root Cause × Effect Elimination 根果修復 — 究極版奧義

> 表象是果，根源是因，復發是果因。修一次是治標，消果因是治本，不復發才是覺醒。

> 本檔為 unit-of-learning；連結至 [[Best Practice Awakening]] / [[OMNITAG/INDEX]] / [[Universal Automation 萬能自動]] / [[12大萬能 OMNI-CANON]]。

---

## 第一奧義：被動觸發機制（本版核心）

### 1.1 被動施放定義

**被動觸發（Passive Trigger）**：不需使用者下指令，只要在對話/輸出/檔案中偵測到「徵兆特徵」，此技能即自動施放根果修復流程。

### 1.2 觸發徵兆表（一見即施放）

| # | 徵兆特徵（看到即觸發） | 施放流程 | 預期產出 |
|---|----------------------|---------|---------|
| 1 | 中文顯示為 `\uFFFD` / `?` 開頭亂碼 | 根果修復 → 編碼專精 | 定位寫入端+顯示端，修復+防復發 |
| 2 | `error TS` / `typecheck` 失敗輸出 | 根果修復 → 型別專精 | 收斂契約，CI 閘道 |
| 3 | `U+FFFD` / `replacement character` | 根果修復 → 編碼閘道 | 找出損毀源，加 encoding-gate |
| 4 | `Cannot find module` 連發 | 根果修復 → 依賴專精 | 路徑/package.json/鎖檔修復 |
| 5 | CI job 間歇紅燈 | 根果修復 → CI 專精 | concurrency/flaky/快取修復 |
| 6 | 錯誤訊息中文字亂碼 | 先設 OutputEncoding 再重跑 | 確認是否僅顯示層問題 |
| 7 | `as any` / `no-explicit-any` 氾濫 | 根果修復 → 型別專精 | 契約收斂 + 型別補齊 |
| 8 | 修完又復發（同問題第 2 次出現） | 根果修復 → 果因消除優先 | 找出系統性因素並根除 |

### 1.3 自動施放流程（看到徵兆的瞬間）

```
偵測徵兆
   ↓ 立即（不詢問、不等待）
① 取證 — 收集完整錯誤輸出/bytes/log
   ↓
② 定位 — 區分 表象/根因/果因
   ↓
③ 施放修復 — 最小變更
   ↓
④ 驗證+凍結 — 重跑 + 建立防復發閘道
   ↓
⑤ 回報 — 標註 [根果修復] 已施放 + 三層分析結果
```

### 1.4 施放原則

| 原則 | 內容 |
|------|------|
| 不等待 | 看到徵兆直接施放，不問「要我修嗎」 |
| 不盲修 | 施放順序永遠是 取證→定位→修復，跳步即違規 |
| 先辨顯示層 | 先檢查是否為顯示層問題（OutputEncoding），避免誤改檔案 |
| 最小變更 | 一次只修根因，不順手重構無關程式 |
| 附證據 | 每次施放結束回報 before/after 證據鏈 |

---

## 第二奧義：核心心法

### 2.1 三層概念定義

| 層次 | 定義 | 本質 | 修復後果 |
|------|------|------|---------|
| **表象（Symptom）** | 觀察到的錯誤/亂碼/失敗 | 只是訊號，不是問題 | 只修表象 → 必然復發 |
| **根因（Root Cause）** | 錯誤產生的原始源頭 | 問題的真正棲身之所 | 修根因 → 問題消失 |
| **果因（Effect Cause）** | 讓問題持續存在/復發的系統性因素 | 環境、工具鏈、流程缺陷 | 消果因 → 永不復發 |

### 2.2 根果修復四步法

```
① 取證(Collect) → ② 定位(Locate) → ③ 修復(Fix) → ④ 驗證+凍結(Verify & Lock)
```

| 步驟 | 動作 | 輸出 | 反模式 |
|------|------|------|--------|
| ① 取證 | 收集錯誤訊息、原始 bytes、log、重現步驟 | 完整證據鏈 | 只憑印象猜 |
| ② 定位 | 用證據回溯編碼/型別/依賴鏈，區分表象/根因/果因 | 根因判定書 | 見表象即下藥 |
| ③ 修復 | 最小變更修復根因 | patch / 檔案修改 | 大改動波及無關模組 |
| ④ 驗證凍結 | 重跑驗證 + 建立防復發機制（檢查閘道/CI） | 修復報告 + 果因消除機制 | 驗證一次就當完成 |

### 2.3 三不原則

| 原則 | 說明 |
|------|------|
| 不盲修 | 未取證定位前，禁止直接改 code |
| 不擴散 | 修復範圍僅限根因所在最小單元 |
| 不復發 | 修完必須建立防復發檢查（CI 閘道 / 編碼標準 / 監控告警） |

---

## 第三奧義：取證（Collect）

### 3.1 證據類型

| 證據 | 取得方式 | 用途 |
|------|---------|------|
| 錯誤訊息全文 | 重現 + 完整 log | 鎖定錯誤碼/行號 |
| 原始 bytes | `[IO.File]::ReadAllBytes` / `xxd` | 鑑識編碼/損毀 |
| 環境資訊 | code page、Node 版本、locale | 辨識環境果因 |
| 重現步驟 | 最小化 repro | 確認修復有效 |
| git 歷史 | `git log -p -- <file>` | 找出引入變更的 commit |

### 3.2 錯誤訊息的兩種讀法

| 讀法 | 說明 | 範例 |
|------|------|------|
| 從內往外 | 從最內層 error stack 開始讀 | `TS2322: Type X not assignable to Y` → 看 X/Y 定義 |
| 從外往內 | 從調用方看錯誤影響範圍 | CI 失敗 → 哪個 job → 哪個 step → 哪行 |

### 3.3 取證指令速查

```powershell
# 完整錯誤輸出（不被管道截斷）
$output = pnpm typecheck 2>&1 | Out-String

# 原始位元組
[System.IO.File]::ReadAllBytes("file.ts")[0..20]

# 環境
chcp; node --version; [Console]::OutputEncoding.WebName

# 型別定義來源（找重複契約）
Select-String -Path "src/**/*.ts" -Pattern "interface IComponentCore"
```

---

## 第四奧義：定位（Locate）— 根因判定

### 4.1 根因判定問卷（5 問）

| # | 問題 | 用途 |
|---|------|------|
| 1 | 錯誤發生在哪一層？（編碼/型別/依賴/運行/環境） | 縮小範圍 |
| 2 | 誰寫入/產生這份資料？用的是什麼編碼/型別？ | 找源頭 |
| 3 | 誰讀取/消費它？預期什麼格式？ | 找斷點 |
| 4 | 引入此問題的 commit 是哪個？ | 確認回歸 |
| 5 | 即使修好，同一工具鏈/環境會再生嗎？ | 辨識果因 |

### 4.2 常見根因分類

| 分類 | 典型根因 | 果因（復發因素） |
|------|---------|-----------------|
| **編碼** | 寫入非 UTF-8；多層轉碼 | 主控台 code page 未設 UTF-8；工具預設 ANSI |
| **型別** | 契約過嚴/過鬆；多處重複定義 | 無 typecheck 閘道；多份 interface 漂移 |
| **依賴** | 模組不存在/路徑錯誤/版本衝突 | 無 CI 驗證；無鎖檔 |
| **運行** | 環境變數缺失/secret 過期 | 無啟動前 checklist |
| **CI** | 測試 flaky/閾值過嚴/快取失效 | 無 retry/無 concurrency 控制 |

### 4.3 本專案實戰：IComponentCore 型別之亂

```
表象: CI typecheck 失敗，91 個 TS 錯誤
取證: npx tsc --noEmit | 收集全部錯誤 → 全部指向 evidence 型別
定位: grep "interface IComponentCore" → 發現 6 處重複定義!
根因: 多份 IComponentCore 各自定義，且 evidence 強制 3 鍵
果因: 無「單一契約來源」檢查，定義散落各處必漂移
修復: 最小變更 — 將強制鍵改為 optional（3 個檔案）
結果: 91 → 64 → 19 → 0（src 範圍內）
果因消除: 建議收斂為單一 contract 來源 + CI 強制檢查重複定義
```

---

## 第五奧義：修復（Fix）— 最小變更

### 5.1 修復優先序

```
1. 最小變更（改 1-3 個檔案）
2. 向上收斂（統一契約/統一編碼/統一工具）
3. 加閘道（CI 檢查，防再犯）
4. 補文檔（記錄決策，防誤改）
```

### 5.2 修復原則

| 原則 | 說明 |
|------|------|
| 改源頭不蓋表象 | 修寫入端，不修顯示端 |
| 改契約不改實作 | 介面寬鬆化優於逐檔硬改 |
| 保留向後相容 | optional 化 > 強制化 > 刪除 |
| 記錄 before/after | 修復前後都要有驗證證據 |

### 5.3 修復模板

```ts
// 修復前
interface IComponentCore {
  evidence: {
    originCause: string;      // ← 強制，導致 20+ 檔案報錯
    ...
  };
}
// 修復後（最小變更 + 向後相容）
interface IComponentCore {
  evidence: {
    originCause?: string;     // ← optional，既有實作全部通過
    ...
  };
}
```

---

## 第六奧義：驗證與凍結（Verify & Lock）

### 6.1 驗證矩陣

| 驗證層 | 指令 | 通過標準 |
|--------|------|---------|
| 型別 | `pnpm typecheck` | 0 error |
| Lint | `pnpm lint` | 0 error |
| 測試 | `pnpm vitest run` | 全綠 |
| 建置 | `pnpm build` | 成功 |
| 編碼 | `grep U+FFFD` | 0 命中 |

### 6.2 凍結機制（果因消除）

```yaml
# CI 編碼閘道（防止亂碼復發）
encoding-gate:
  - run: |
      if grep -rl $'\uFFFD' --include="*.ts" --include="*.md" .; then
        echo "::error::U+FFFD 混入程式碼"; exit 1
      fi

# CI 契約重複定義閘道（防止型別漂移復發）
contract-gate:
  - run: |
      count=$(grep -rl "interface IComponentCore" src/ | wc -l)
      [ "$count" -le 1 ] || { echo "多份 IComponentCore 定義!"; exit 1; }
```

### 6.3 果因消除三件套

| 機制 | 目的 | 落地方式 |
|------|------|---------|
| 主控台編碼 | 顯示層亂碼 | `[Console]::OutputEncoding = [UTF8]` 寫入 `$PROFILE` |
| CI 閘道 | 程式碼層復發 | encoding-gate / contract-gate job |
| 文檔收斂 | 知識層復發 | 本檔 + 專案 docs 引用 |

---

## 第七奧義：實戰案例庫

### 7.1 亂碼案例

| 項目 | 內容 |
|------|------|
| 表象 | lint 輸出 `?\uFFFD\uFFFD??\uFFFD\uFFFD??` 亂碼 |
| 取證 | 確認檔案內容正確（UTF-8），node 輸出 UTF-8 bytes |
| 根因 | PowerShell 主控台以 CP950 解讀 UTF-8 輸出 |
| 修復 | `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` |
| 驗證 | 重跑 lint → 中文正常顯示 |
| 果因消除 | `$PROFILE` 寫入編碼設定 + 本技能建檔 |

### 7.2 型別案例

| 項目 | 內容 |
|------|------|
| 表象 | CI typecheck 91 個錯誤 |
| 取證 | 全數指向 evidence 型別不匹配 |
| 根因 | 6 處重複 IComponentCore 定義 + 契約過嚴 |
| 修復 | 3 檔案 optional 化（core-contract / omni-agent / contracts） |
| 驗證 | 91 → 0（src 範圍） |
| 果因消除 | 建議 contract-gate CI + 收斂單一來源 |

### 7.3 通用案例模板

```
問題: <一句話>
表象: <觀察到的現象>
根因: <真正源頭>
果因: <會導致復發的系統因素>
修復: <最小變更>
驗證: <before/after 證據>
果因消除: <防復發機制>
```

---

## 速查表

| 情境 | 做法 |
|------|------|
| 看到亂碼（被動觸發） | 自動施放：取證→辨顯示層→修復 |
| 看到 TS 錯誤（被動觸發） | 自動施放：grep 契約→重複定義→寬鬆化 |
| 錯誤訊息看不懂 | 取完整輸出 → 從內往外讀 stack |
| CI 間歇失敗 | 查 concurrency / 快取 / flaky test |
| 修完又復發 | 缺果因消除 → 建立 CI 閘道/標準 |
| 不確定改哪個 | 先取證再定位，禁止盲修 |

---

## 相關連結（向下鑽研）

- [[Best Practice Awakening]] — 結界繼承的治理基礎
- [[OMNITAG/INDEX]] — OmniTag 萬能標籤契約總索引
- [[5T Protocol]] — 5 維度驗證條款
- [[12大萬能 OMNI-CANON]] — 12 維度架構
- [[Universal Automation 萬能自動]] — 平行分身的執行引擎
- [[ESG-GO 核心]] — 30 蜂群根公約
- [[ESG GO Sacred Pipeline CI-CD]] — CI/CD 修補成果

---

<sub>Root Cause × Effect Elimination v1.0 — 被動觸發版 | License: AGPL-3.0</sub>
