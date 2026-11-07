---
name: encoding-forensics
category: debugging
description: 根因分析 · 果因消除 · 亂碼修復（Encoding Forensics）究極版奧義 — 從亂碼跡象逆向推斷編碼路徑，精準定位根因並消除，一次性修復不復發
tags: encoding, forensics, debugging, root-cause, utf8, remediation
load: on_match
title: 編碼取證
version: 1.0.0
title: 編碼取證
version: 1.0.0
---

# 根因分析 · 果因消除 · 亂碼修復 — 究極版奧義

> 不只看亂碼的表象，要追到編碼鏈的源頭。
> 不只修這一次，要消除讓亂碼反覆發生的果因。

---

## 第一奧義：核心心法

### 1.1 根因 vs 果因

| 概念 | 定義 | 範例 |
|------|------|------|
| 根因（Root Cause） | 亂碼產生的原始源頭 | write tool 使用非 UTF-8 編碼寫入檔案 |
| 果因（Effect Cause） | 讓亂碼持續存在的系統性因素 | PowerShell 主控台預設 code page 950 |
| 亂碼（Encoding Error） | 可觀察到的字元顯示錯誤 | 最佳實踐覺變成亂碼 |

### 1.2 三層修復策略

| 層級 | 策略 | 目標 |
|------|------|------|
| L1 | 表象修復 | 讓當前亂碼顯示正常 |
| L2 | 根因消除 | 修正寫入/讀取編碼鏈的斷裂點 |
| L3 | 果因消除 | 建立防止復發的系統性機制 |

---

## 第二奧義：編碼鑑識四步法

### Step 1: 觀察跡象

亂碼樣式 → 推斷編碼路徑

- UTF-8被Big5解讀的字節分布
- Latin-1解讀UTF-8的常見樣式

### Step 2: Byte 取證

讀取原始位元組並檢查BOM：
- EF BB BF = UTF-8 with BOM
- FF FE = UTF-16 LE
- FE FF = UTF-16 BE

### Step 3: 編碼還原

用正確編碼重新讀取檔案內容，檢查是否為有效UTF-8。

### Step 4: 驗證與凍結

驗證關鍵字是否存在，確認無U+FFFD replacement character。

---

## 第三奧義：Windows 編碼修復工具箱

### 主控台編碼設定

```
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

### 檔案寫入正確方式

正確：指定 UTF-8 編碼
- $content | Set-Content -Path file.md -Encoding UTF8
- [File]::WriteAllText(file.md, content, [Encoding]::UTF8)

錯誤：依賴預設編碼
- $content | Out-File file.md 可能用 Big5
- $content | Set-Content file.md 可能用 ANSI

### 檔案讀取正確方式

正確：明確指定 UTF-8
- Get-Content -Path file.md -Encoding UTF8
- [File]::ReadAllText(file.md, [Encoding]::UTF8)

錯誤：依賴自動偵測

### 批次修復既有檔案

遍歷目錄下所有.md檔案，以UTF-8重新讀取並寫入。

### Native 指令輸出落檔（PowerShell 5.1 重災區）

根因：PS5.1 的 `>` 與管道對 native 指令（gh/git/node…）輸出**轉碼成 UTF-16LE**，
下游 node `JSON.parse` 吃到 FF FE 開頭即炸 `Unexpected token '[U+FFFD]'`。
（跡象：檔案 20KB 內容正常卻 parse 失敗；`[Text.Encoding]::UTF8.GetString` 讀出全空格交錯＝UTF-16LE 特徵。）

根果消除（一次修復不復發）：
- **落檔給程式讀：一律 `cmd /c "命令 > file"`**（cmd 不轉碼、原位元組直通，BOM 都不會加）
- 人讀的輸出：`| Out-File -Encoding utf8`
- node 側防禦：`readFileSync(...,'utf8').replace(/\uFEFF/,'')` 且先 sniff `buf[0]===0xFF&&buf[1]===0xFE` 判 UTF-16 直接改用 `'utf16le'`
- 已知不可靠：`gh --jq` 在 PS 內嵌雙引號會被剝 → 落 JSON 檔 + 本地 node 解析

### Native→Native 管道 BOM 注入（第八奧義，2026-10-13 實證）

根因：PS 5.1 **native→native pipe** 寫入下游 stdin 時，在串流開頭**必定注入 `EF BB BF`**（curl/gh 來源皆中，JSON.parse 炸 `Unexpected token '﻿'`）。

鑑識實證（三分法 Byte 取證）：
- 源頭全淨：`curl -o file`＝`7B22...`、cmd 位元組重導向＝淨、node `child_process.spawn` 捕 pipe＝淨、PS 字串擷取（decode path）＝無 BOM → **BOM 只在 PS pipe 寫入層誕生**
- **進程內無法掐死**：`[Console]::OutputEncoding` 與 `$OutputEncoding` 都設 `UTF8Encoding($false)` 仍照噴（T1 實證）；執行期改編碼無效
- 疊加規律：固定 1 個 BOM ＋ 若 `$OutputEncoding` 有 preamble 再 +1（雙 BOM 實證）
- `cmd /c "more"` 中轉救不了（BOM 在第一跳已注入）；`| Out-File`/`>` 寫檔則轉 UTF-16LE（見上節）

根果消除：
- **PS 內禁止 `JSON.parse(<native pipe>)`**；程式要吃管道資料一律 `curl/api -o file` → node `readFileSync`
- node 探針寫成檔案（`node probe.js`）避免 PS 吃內嵌引號（`node -e "..."` 內 `"` 會被剝，另案已知）
- 防禦層：`content.replace(/^\uFEFF/,'')` 當保險，但屬 L1，不可當解法

---

## 第四奧義：常見亂碼模式速查

| 樣式 | 推斷根因 | 修復 |
|------|---------|------|
| 最佳實踐覺變亂碼 | UTF-8被Big5解讀 | 改用UTF-8寫入 |
| 字元變Latin風格 | UTF-8被Latin-1解讀 | 改用UTF-8寫入 |
| 中文字全變問號 | 編碼遺失或截斷 | 重新以UTF-8寫入 |
| Unicode取代字元 | 多重轉碼 | 重新以UTF-8寫入 |
| 方塊空白符號 | 字型不支援 | 安裝對應字型 |

---

## 第五奧義：果因消除防止復發

### 編碼標準

預設編碼: UTF-8 (without BOM)
行尾: LF
工具規範: write工具改用[File]::WriteAllText with UTF-8

### CI Pipeline 編碼閘道

CI應檢查所有.md/.ts檔案的UTF-8有效性，發現replacement character即阻斷。

---

## 第六奧義：本對話實戰案例

### 場景
opencode write tool 寫入含中文的SKILL.md，結果中文全部變亂碼。

### 根因分析
1. write tool 預設使用非UTF-8編碼寫入
2. 中文字的UTF-8位元組被以Big5(CP950)解讀
3. 檔案寫入時即已損壞

### 修復步驟
1. 取證：讀取原始位元組確認內容
2. 以UTF-8重新寫入：[File]::WriteAllText with UTF-8
3. 驗證：確認無U+FFFD且關鍵字正常
4. 建立此技能作為果因消除機制

---

## 速查表

| 情況 | 處理方式 |
|------|---------|
| 中文變成亂碼 | Byte取證→確認UTF-8→重新寫入 |
| 不確定檔案編碼 | 看BOM+byte分布 |
| 批次修復亂碼 | PowerShell重新以UTF-8寫入 |
| 要防止復發 | 建立CI encoding check |
| 程式寫入亂碼 | 改用[File]::WriteAllText with UTF-8 |

---

究極版奧義 v1.0 | Encoding Forensics Ultimate Edition
根因分析 · 果因消除 · 編碼鑑識 | License: AGPL-3.0


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| encoding-forensics | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：encoding-forensics 並查詢目前狀態
{
  triggers: ["encoding-forensics", "query"],
  actions: ["awaken()", "query()"],
  priority: ["encoding-forensics", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | encoding-forensics, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | encoding-forensics, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：encoding-forensics
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 encoding-forensics 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 encoding-forensics 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
