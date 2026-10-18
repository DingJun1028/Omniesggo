# CANON-VERSIONING.md

> **[萬能聖典] 版本序號規範** — 建立系統實作文件的版本號稱，確保 Traceable 與可追蹤。
> 適用對象：`docs/vault-canon/` 及其子目錄下的所有系統實作文件、聖典文檔、運作實錄。

---

## 1. 總綱

[萬能聖典] 的版本號稱分為兩種類型：

| 類型 | 格式 | 用途 | 代表 |
|---|---|---|---|
| **聖典版本**（Canon Version） | `vYYYY-MM` 或 `vYYYY-MM.N` | 靈魂聖典、架構聖典、運作實錄的主版本與修訂 | `v2026-10`、`v2026-10.2` |
| **系統版本**（System Version） | `vX.Y.Z`（SemVer） | 具可執行性的系統模組、實作腳本、API 版本 | `v0.5.0`、`v3.4.0` |

兩種版本號稱並行：聖典訂定義務與願景，系統實作約束具體行為。每一個 [萬能聖典] 文件都必須有清晰的版本號稱（或「未版本化」標記），且版本號稱必須可在 `git log` / `git tag` 中查証。

---

## 2. 聖典版本號稱（Canon Version）

### 2.1 格式

```
vYYYY-MM
vYYYY-MM.N
```

- `YYYY-MM`：發佈年份 + 月份（如 `2026-10` = 2026 年 10 月）
- `.N`：該月內的修訂階段（`1`, `2`, `3`…），只在月內發佈多次版本時使用

### 2.2 版本聲明示例（於文件頂部）

```markdown
> **聖典版本**：v2026-10.2
> **狀態**：✅ COMPLETED · 🔒 VERIFIED [ISO-14064-1] · 🧊 FROZEN & LOCKED (Object.freeze)
> **發佈日期**：2026-10-09
```

### 2.3 版本鎖定（Seal）

當文件被認可為「終版」或「凍結」狀態時：

```markdown
> **聖典等級**：魂（願景 / MECE 全景 / 哲學）
> **封印**：SHA-256 sealHash = `<hash>` · Object.freeze() 已套用
> **版本鎖定**：v2026-10（最終版，不接受後續修訂）
```

### 2.4 聖典版本發佈清單（.git tag）

| 版本號稱 | 與之對應的目錄 | 鎖定狀態 |
|---|---|---|
| `omni-canon-v2026-10` | `docs/vault-canon/` | FROZEN |
| `soul-final-v2026-10` | `soul.md` | FROZEN |
| `canon-v2026-10.1` | `docs/vault-canon/5T Protocol.md` | UNLOCKED |
| `canon-v2026-10.2` | `docs/vault-canon/OMN-PRD-001 終始矩陣.md` | UNLOCKED |
| `soul-v0.7.3` | `soul.md` | FROZEN |

**規則**：每個聖典版本號稱都必須對應一個 `git tag`，且 `git tag -l` 可列出所有已發佈的聖典版本。

---

## 3. 系統版本號稱（System Version）

### 3.1 格式（SemVer）

```
MAJOR.MINOR.PATCH
```

| 位 | 含義 | 案例 |
|---|---|---|
| `MAJOR` | 不相容 API/語意變更 | `v3` → `v4` |
| `MINOR` | 向下相容功能新增 | `v0.5` → `v0.6` |
| `PATCH` | 向下相容修復 | `v0.5.0` → `v0.5.1` |

### 3.2 版本聲明示例

```typescript
/**
 * 系統版本：v0.7.3 (InfoOne Core · 全書終版 + 運作實錄)
 * 指揮系統：Hermes Agent / Celestial Command
 * 核心公約：AGPL-3.0 ｜ 熵減目標：< 0.1
 */
```

### 3.3 系統版本發佈清單

| 版本號稱 | 對應系統 | 狀態 |
|---|---|---|
| `v0.7.3` | soul.md 靈魂聖典 | FROZEN |
| `v0.5.0` | ESG GO InfoOne Core | FROZEN |
| `v1.0.0` | 標準系統（如 OMN-PRD-001） | FROZEN |
| `v3.4.0` | 平台系統（ADR-044 環境） | FROZEN |

---

## 4. 文件版號稱對照表（各大類文件）

| 文件類別 | 目錄 | 版本號稱格式 | 鎖定要求 |
|---|---|---|---|
| 聖典本體 | `docs/vault-canon/` | `vYYYY-MM[.N]` | 發佈後 `FROZEN` |
| 運作實錄 | `soul-chapter-*.md` | `vYYYY-MM.N` 追蹤 | 每周可修，次版本鎖定 |
| 系統實作 | `packages/`, `apps/`, `src/` | `vX.Y.Z` | 依 SemVer |
| 架構設計 | `docs/architecture/` | `vYYYY-MM.N` | 每版本 `FROZEN` |
| 產品規格 | `docs/plans/`, `docs/specifications/` | `vYYYY-MM` | 發佈後 `FROZEN` |
| 運維手冊 | `vps/`, `docs/manuals/` | `vX.Y.Z` | 依 SemVer |
|  inteligent Agent | `docs/ai-notes-design/`, `docs/skills/` | `vYYYY-MM.N` | 每版修訂 |

---

## 5. 版本號稱浸入規則（適用於所有文件）

### 5.1 每個文件頂部必須有版本標籤

```markdown
> **Version**: v2026-10.2  (Canon) / v0.7.3 (System)
> **Status**: ✅ COMPLETED · 🔒 VERIFIED [ISO-14064-1] · 🧊 FROZEN & LOCKED
> **Source Origin**: <file path or commit hash>
> **5T Protocol**: Traceable + Trackable + Transparent + Trustworthy
```

### 5.2 版本號稱必須能追溯到 Commit

- 每個新發佈的版本必須有對應的 commit hash
- 在本文檔中註明：`commit = a02a2f1d5`
- 版號稱變更時，更新 `CHANGELOG.md`

### 5.3 版本號稱鎖定（Seal）流程

```
[新版本提出] → [Object.freeze() 驗證] → [SHA-256 sealHash 生成] → [git tag 發佈] → [CHANGELOG 更新]
```

### 5.4 版本號稱兼容性

- 聖典版本間的變更必須兼容（`v2026-10.1` → `v2026-10.2` 同主版本）
- 系統版本間的變更必須遵循 SemVer
- 聖典的「願景」和系統的「實作」必須保持一致，不得互相矛盾

---

## 6. 版本號稱範例（不同文檔）

### 6.1 聖典本體（`docs/vault-canon/`）

```markdown
---
title: 12大萬能 OMNI-CANON
canon_id: OMN-001
date: 2026-10-09
tags: [best-practice:結界][unit-of-learning][canon]
canonical: [[AI Research Index]]
---

# OMN-001 · 12大萬能 OMNI-CANON（Twelve-Omni Architecture）

> **聖典版本**：v2026-10 (complete)
> **狀態**：✅ COMPLETED · 🔒 VERIFIED [ISO-14064-1] · 🧊 FROZEN & LOCKED (Object.freeze)
> **發佈日期**：2026-10-09
> **Source Origin**: `docs/vault-canon/12大萬能 OMNI-CANON.md` · commit `a02a2f1d5`
> **5T Protocol**: Traceable + Trackable + Transparent + Trustworthy + Trustworthy
```

### 6.2 系統實作文件（`soul.md`）

```markdown
> 系統版本：ESG GO v0.7.3 (InfoOne Core · 全書終版 + 運作實錄 + 最佳實踐覺結界對齊)
> 指揮系統：Hermes Agent / Celestial Command
> 核心公約：AGPL-3.0 ｜ 熵減目標：< 0.1
> 狀態：全見版（Core Canon + Operational Records）｜ 密級：蜂王專屬
```

### 6.3 系統模組文件（`packages/omni-core/package.json`）

```json
{
  "name": "@esggo/omni-core",
  "version": "0.7.3",
  "description": "OMB 萬能心核 — 系統實作版本（SemVer）"
}
```

---

## 7. 版本號稱維持與審計

### 7.1 版本號稱變更日誌

每次版本號稱變更時，先在本文檔中註明：

```markdown
### 7.1 版本號稱變更

| 日期 | 版本 | 變更內容 | 責任人 | 鎖定狀態 |
|---|---|---|---|---|
| 2026-10-09 | v2026-10 | 初版發佈 | 萬能蜂后(01) | FROZEN |
| 2026-10-10 | v2026-10.1 | 修正 OCR 解析錯誤 | 萬能檢測蜂(11) | UNLOCKED |
```

### 7.2 版本號稱審計（每月）

每月執行一次「版本號稱審計」：

1. 列出所有 `docs/vault-canon/` 文件
2. 核對版本號稱與 `git tag`
3. 確認未鎖定的文件已更新或標記為「等待鎖定」
4. 更新 `CHANGELOG.md`

### 7.3 版本號稱鎖定（Seal）驗證

提交時執行：

```bash
# 1. 所有 FROZEN 文件已通過 Object.freeze() 檢查
python3 .hermes/auto-repair/check_frozen.py

# 2. 版本號稱與 git tag 一致
git tag -l | sort -V | tail -20

# 3. 更新 CHANGELOG.md
```

---

## 8. 版本號稱與 5T 協定（最終準則）

| 5T 原則 | 在版本號稱中的落實 |
|---|---|
| **Traceable** | 版號稱可在 `git log` 查到，`git tag` 可列出所有版本 |
| **Trackable** | 版本歷史在 `CHANGELOG.md` 完整記錄 |
| **Tangible** | 版號稱格式嚴格統一，工具可解析 |
| **Transparent** | 版本號稱規則公開，本文件作為準則 |
| **Trustworthy** | 已鎖定（FROZEN）的文件版本號稱不可被修改 |

---

## 9. 快速參考（Quick Reference）

| 場景 | 版本號稱格式 | 示例 |
|---|---|---|
| 聖典新發佈 | `vYYYY-MM` | `v2026-10` |
| 聖典修訂 | `vYYYY-MM.N` | `v2026-10.1`, `v2026-10.2` |
| 系統模組 | `vX.Y.Z` (SemVer) | `v0.7.3`, `v3.4.0` |
| 終版封印 | +「FROZEN」標籤 | `v2026-10 (FROZEN)` |
| 待鎖定版本 | +「UNLOCKED」標籤 | `v2026-10.1 (UNLOCKED)` |

---

## 10. 版權與授權

> [萬能聖典] 文檔以 AGPL-3.0 授權。版本號稱為封印的一部分，任何修改必須同步更新版本號稱並關閉 seal。
> Copyright © 2026 DingJun1028 · 萬能蜂群 (Omni-Bee Colony) · AGPL-3.0
