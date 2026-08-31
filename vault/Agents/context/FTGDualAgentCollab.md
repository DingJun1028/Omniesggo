---
tags: [ftg, dual-agent, collaboration, swarm, 5t, oa-twins]
created: 2026-08-29
source_origin: oa-knowledge-avatar
co_authors: [QueenBee, OA-Twins]
---

# FTG 雙分身協作經驗

> 兩個萬能分身平行開發 FTG Journey App 的協作模式與經驗教訓。

## 背景

任務：將 FTG 官網 6 大服務對映到 App 功能。

兩個分身同時進行：
- **分身 A**（本體）：負責缺口分析、設計系統、Dashboard、JourneyDetail、ImpactNotePage
- **分身 B**（子代理）：負責 FamilyDay、Wellbeing、Executive、後端強化

## 協作模式

### 1. 分工策略

| 分身 | 負責內容 | 完成狀態 |
|------|---------|---------|
| A | 缺口分析 + 設計系統 + 核心頁面 | ✅ 完成 |
| B | 三大功能頁面 + 後端補強 | ✅ 完成 |

### 2. 整合方式

- 分身 B 完成後，分身 A 核實產出
- 確認可部署後，取代舊版
- 最後寫 README/API 文件

### 3. 遇到的問題

1. **匯出名稱不一致**：FamilyDay vs FamilyDayFeature
   - 解決：使用 `as` 重新匯出
2. **Git 衝突**：兩個分身同時修改 App.jsx
   - 解決：手動合併，保留雙方功能
3. **DNS 指向問題**：ftgtours.esggo.co 指向 GitHub Pages 而非 VPS
   - 解決：更新 DNS 至 VPS IP

## 經驗教訓

### ✅ 成功之處

1. **平行開發加速**：兩個分身同時進行，時間減半
2. **互補專長**：A 擅长分析與設計，B 擅长功能實作
3. **5T 治理**：每個檔案都標註 `source_origin`，可追溯

### ⚠️ 需注意

1. **命名慣例**：兩個分身的命名習慣不同，需事先協調
2. **檔案衝突**：同時修改同一檔案需手動合併
3. **DNS 與部署**：開發完成後需手動更新 DNS

## 最佳實踐

### 分身協作 SOP

1. **任務拆分**：按功能模組拆分，避免檔案衝突
2. **命名協定**：事先約定命名慣例（如 `Feature` 後綴）
3. **整合測試**：分身完成後，本體需核實產出
4. **文件化**：立即寫 README 與 API 文件

### 適用場景

- 大型功能開發（多頁面、多模組）
- 前後端分離開發
- 設計與實作並行

## 相關檔案

- `vault/Agents/context/FTGJourneyApp.md`
- `vault/Agents/context/SelfHealingEngine.md`
- `docs/ftg-journey-gap-analysis.md`
