# 萬能架構設施 — 範圍界定與實作路徑（Scoping Memo）

**Status**: Discovery complete — term analysed; implementation NOT yet started.
**Date**: 2026-11-15
**Source**: `docs/FACILITIES_RECONSTRUCTION_PLAN.md` · `docs/architecture/ESGGO-OMNI-ARCHITECTURE.md` · `soul.md`

---

## 1. 術語界定

"萬能架構設施" 為本倉庫**非字面搜尋命中的自造合稱**（grep 未命中任何含 `萬能架構設施` 的檔案）。其可被穷尽回溯至兩個實體清單：

| 片語 | 語義 | 來源文件 | 清單長度 |
|---|---|---|---|
| **萬能架構** | 系統模組化架構 — Genius 全 22 成個 Omni 模組，依「架構關注點」分為 4 個互斥層次（治理 / 資料 / 智慧 / 呈現） | `docs/architecture/ESGGO-OMNI-ARCHITECTURE.md` | 22 模組 |
| **設施** | 全系統設施功能重構 6 個設施模組，對齊 ESG 國際規範（GRI / CSRD / ESRS / ISO 14064-1 / SBTi / CSDD） | `docs/FACILITIES_RECONSTRUCTION_PLAN.md` | 6 設施 |

因此 "萬能架構設施" 最精確的對應是：**屬於「萬能架構」之 6 個「設施」模組**；而 "22 Omni 模組" 是更上層的「萬能架構」整體，不是「設施」清單。

## 2. 6 個設施（設施實作對象）查明清單

| # | 設施模組 | 來源文件 | 官方狀態 | 5T 標準 |
|---|---|---|---|---|
| 1 | ESG 報告中心 & 表單引擎 | `reports/ESGReportsCenter.tsx` + `reports/DynamicFormEngine.tsx` | **缺失**（未在倉庫發現） | 5T 密碼學封印 / GRI 2024 / CSRD ESRS |
| 2 | PDF 自動解析設施 | `app/parser/page.tsx` （392 行） | 存在（需 5T 升級） | ISO 14064-1 / 批量隊列 / OCR |
| 3 | 雙重重大性矩陣 | `app/materiality/page.tsx` （557 行） | 存在（需 5T 升級） | EU CSRD / GRI 3 |
| 4 | 供應鏈盡職調查 | `app/supply-chain/page.tsx` （339 行） | 存在（需 5T 升級） | EU CSDD / 德國 LkSG |
| 5 | 淨零路徑與 MACC 規劃 | `app/roadmap/page.tsx` （493 行） | 存在（需 5T 升級） | SBTi 1.5°C / MACC |
| 6 | 5T 防偽驗證與信任中心 | `app/verifier/page.tsx` （421 行） | 存在（需 5T 升級） | 5T Hash Lock / ZKP |

**現況摘要**：5 個設施頁面已存在（位於 `app/`）、2 個「報告與表單」檔案缺失（需要從頭建構）。

## 3. 實作順序（依 FACILITIES_RECONSTRUCTION_PLAN 第 3 節官方路線）

1. **第一梯隊**：報告與表單核心（`reports/` 新增 — 兩檔案已缺失，須建立）
2. **第二梯隊**：重大性評估與供應鏈（`materiality/` + `supply-chain/` 5T 升級）
3. **第三梯隊**：減碳路徑與防偽確信（`roadmap/` + `verifier/` 5T 升級）

## 4. 與 22 個 Omni 模組的關係（邊界說明）

`docs/architecture/ESGGO-OMNI-ARCHITECTURE.md` 定義的 **22 個 Omni 模組** 是「萬能架構」整體（含 `src/lib/omni-core/`、`omni-factory`、`omni-note` 等底層模組）。「設施」是這個架構**上層的可交付功能模組**。二者不是同層清單，不可混淆；本檔以「6 個設施」為實作邊界。

---

## 下一步（待使用者確認後執行）

- 確認「6 個設施」為實作範圍。
- 從第一梯隊（`reports/` 兩檔案缺失 → 建立 + 5T 封印）開始，逐設施推進。
