---
source_origin: apps/learning-center (pnpm audit 實測)
created: 2026-09-28
modified: 2026-09-28
co_authors: 萬能分身 (Hermes Agent)
lifecycle: active
access: public
---

# 依賴安全稽核 — 實測報告

> 5T-Transparent: 本報告區分「實測數據」與「無法驗證項」，
> 不用推測填補空缺。

## 1. 核心結論：GitHub 的 59 與本地掃描不一致

GitHub push 訊息報告 default branch 有 **59 vulnerabilities
（12 critical / 13 high / 31 moderate / 3 low）**。

**本地雙工具實測無法重現這個數字。**

| 掃描方式 | 指令 | 結果 |
|---|---|---|
| 根 workspace | `pnpm audit` | **No known vulnerabilities found** |
| 根 workspace | `npm audit` | metadata 為空 |
| `cli/oa-cli` | `pnpm audit` | No known vulnerabilities |
| `oa-swarm` | `pnpm audit` | No known vulnerabilities |
| `esggo-auto-repair/worker` | `pnpm audit` | No known vulnerabilities |
| **`apps/learning-center`** | `pnpm audit` | **21（7 high / 13 moderate / 1 low / 0 critical）** |

**推論（5T-Transparent：此為推論，非實測）**：GitHub 掃描的是
default branch (`main`) 的 dependency graph，其範圍與解析方式與
單一 workspace 的 `pnpm audit` 不同，故數字不可直接比較。本報告
**無法確認** GitHub 那 12 critical 的具體內容。

## 2. 為何無法直接取得 GitHub 的 12 critical 明細

`GET /repos/DingJun1028/esggo/dependabot/alerts` 回 **HTTP 404**：
```
{"message": "Not Found", "documentation_url": "https://docs.github.com/rest", "status": "404"}
```
Dependabot alerts API 需 repo admin scope，現有 token 無此權限。
**未升級 token 權限**（屬憑證操作，須維護者執行）。

## 3. learning-center 實測漏洞明細（7 high）

| 套件 | 弱點 | 修補版本 |
|---|---|---|
| `brace-expansion` | DoS via unbounded expansion length | >=1.1.17 |
| `brace-expansion` | DoS via unbounded intermediate array | >=1.1.18 |
| `undici` | cross-user information disclosure | >=7.29.0 |
| `js-yaml` | Quadratic CPU consumption in `!!omap` | >=4.3.1 |
| `js-yaml` | `maxTotalMergeKeys` 不限制 CPU | >=4.3.2 |
| `nanoid` | custom generators 可無限迴圈 | >=3.3.18 |
| `sharp` | libheif 漏洞 GHSA-g89c-p67h-r4 | >=0.35.4 |

另有 13 moderate + 1 low（明細未展開）。

## 4. 明確不做的事：對 undici 強升

`apps/learning-center/AGENTS.md` 第 5 條明載：

> 勿用 pnpm `overrides` 強升傳遞依賴（undici 強升會破壞 jsdom 測試環境）

且第 7 條：部署無關的 dev-only 漏洞（undici=Node-only、
brace-expansion=dev 工具鏈）可接受，**別為綠燈強升破壞鏈**。

**本次未對 undici 套用 overrides** —— 依專案既有規範。

## 5. 建議處理次序（需維護者決定）

| 優先 | 項目 | 理由 |
|---|---|---|
| 1 | 以 admin scope 取 Dependabot alerts | 先拿到真實清單再談修復 |
| 2 | `sharp` >=0.35.4 | 影像處理套件，libheif 屬原生解析路徑 |
| 3 | `js-yaml` >=4.3.2 | 兩項 CPU DoS，合規面向 |
| 4 | `brace-expansion` >=1.1.18 | dev 工具鏈，低風險 |
| 5 | `undici` | **需先建 jsdom 回歸測試**，不可盲升 |
| 6 | `nanoid` >=3.3.18 | 確認是否實際使用 custom generator |

## 6. 本次產出

- `scripts/audit-jwt-secret-exposure.sh` — JWT_SECRET 四段稽核（實跑 EXIT=0）
- 本報告

**已驗證**：typecheck 0 錯誤、vitest 855 passed（87 檔案）
