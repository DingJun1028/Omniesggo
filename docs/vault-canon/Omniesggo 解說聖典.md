# Omniesggo 解說聖典

> 萬能 ESG-GO 積體系列（Omni ESG-GO Unified Series）的官方解說與指引。
> 涵蓋名詞定義、場景應用、範例項目、延伸用途、創意集成、維運須知與特別注意。

---

## 目錄

1. [系統概覽](#1-系統概覽)
2. [名詞定義](#2-名詞定義)
   - [2.1 核心系統](#21-核心系統)
   - [2.2 技術術語](#22-技術術語)
   - [2.3 技術工具](#23-技術工具)
3. [使用場景](#3-使用場景)
4. [範例項目](#4-範例項目)
5. [延伸用途](#5-延伸用途)
6. [創意集成](#6-創意集成)
7. [維運須知](#7-維運須知)
8. [特別注意](#8-特別注意)
10. [神器目錄與核實狀態（2026-11-11 增補）](#10-神器目錄與核實狀態2026-11-11-增補)

---

## 1. 系統概覽

**Omniesggo**（萬能 ESG-GO）是綜合 ESG 報告、智能代理、自動化任務、知識管理、語音處理與 30 代理蜂群協作的整合平台。

### 1.1 系統架構

```text
┌──────────────────────────────────────┐
│  智庫聖所 (01-06)                    │
│  記憶召回 >95%，向量知識檢索          │
│  適用：RAG、QA、知識庫管理           │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│  符文契約 (07-12)                    │
│  API 鑄造，TypeScript 型別安全        │
│  適用：API 開發、型別安全、契約管理   │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│  光之羽翼 (13-18)                    │
│  自動化背景任務，ADK 調度             │
│  適用：自動化、排程、背景任務         │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│  煉金熵減 (19-24)                    │
│  重構，熵值 -3%/週                   │
│  適用：重構、最佳化、技術債清理       │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│  5T 驗算 (25-30)                     │
│  ISO 規範驗算，Hash Lock            │
│  適用：合規、審計、安全驗證           │
└──────────────────────────────────────┘
```

### 1.2 5T 協定

| 5T | 中文 | 含義 | 應用 |
|----|------|------|------|
| Traceable | 可溯源 | 每筆輸出可追蹤來源 | 代碼提交、任務記錄 |
| Trackable | 可追蹤 | 全生命週期狀態記錄 | 監控、日誌、審計 |
| Tangible | 可感知 | 使用者可見、可操作 | UI/UX、儀表板 |
| Transparent | 可透明 | 演算邏輯公開 | 決策過程、算法透明 |
| Trustworthy | 不可篡改 | Hash Lock + freeze | 產物驗證、安全 |

---

## 2. 名詞定義

### 2.1 核心系統

#### 1. Omniesggo

**- 名詞定義**  
Omniesggo（萬能 ESG-GO）是綜合 ESG 報告、智能代理、自動化任務、知識管理、語音處理與 30 代理蜂群協作的整合平台。

**- 使用場景**  
- ESG 報告產生與自動化  
- 智能代理協作與行程調度  
- 知識管理與記憶召回  
- 多語音處理與翻譯  

**- 範例項目**  
- ESG 報告自動生成系統  
- 30 代理蜂群行動日誌  
- 知識庫召回系統  
- 語音轉錄與翻譯  

**- 延伸用途**  
- 跨部門協作平台  
- 企業 ESG 數據中樞  
- 多代理協同決策  
- 企業知識管理  

**- 創意集成**  
- 智庫聖所 + 語音合成：語音查詢知識庫  
- 符文契約 + 圖像生成：生成 ESG 報告封面  
- 5T 驗算 + 電子報：週報自動推送  

**- 維運須知**  
- 所有金鑰均需存放在 `secret-vault/` 或 `.env.local`  
- 環境變數使用 `.env.local`（本地）或 `secret-vault/`（生產）  
- 檔案權限 600，僅所有者可讀寫  

**- 特別注意**  
- 禁止將真實金鑰寫入程式碼  
- 覆蓋寫入或刪除前應先作備份  
- 自動化任務可能觸發意外行為，請先測試  

**- 延伸資源**  
- [Omniesggo 官方 GitHub](https://github.com/DingJun1028/Omniesggo)  
- [Omniesggo 架構圖](docs/soul.md)  
- [Omniesggo 技能書](.agents/skills/)
#### 2. 30 人蜂群

**- 名詞定義**  
30 人蜂群是 5 大陣列 × 6 代理的 MECE 分工協同體，包含智庫聖所、符文契約、光之羽翼、煉金熵減、5T 驗算 5 個陣列。

**- 使用場景**  
- 複雜任務分配與同步  
- 全自動化工作流  
- 跨部門協作  
- 系統自動化與治理  

**- 範例項目**  
- 每日麻雀：日報自動生成  
- 週燃：週熵減重構  
- 季度治理：月度安全審計  
- 跨部門專案：AI Station  

**- 延伸用途**  
- 企業全自動運營系統  
- 跨部門協作平台  
- 智慧決策系統  
- 知識管理系統  

**- 創意集成**  
- 智庫聖所 + 5T 驗算：自動化報告驗證  
- 光之羽翼 + 煉金熵減：自動化重構流程  
- 時間柱 + 空間柱：跨伺服器同步  

**- 維運須知**  
- 每日蜂后晨會：盤點 P0 阻斷  
- 每週煉金委員會：熵減儀式  
- 每月治理會議：RACI 覆核  
- 每季戰略評議：M1-M7 閉環覆盤  

**- 特別注意**  
- 系統熵值 > 0.1 時要優先處理  
- 安全事件時停止自動化並調用 Kill Switch  
- 覆蓋寫入或刪除前應先作備份  

**- 延伸資源**  
- [30 人蜂群矩陣](docs/soul.md)  
- [5T 協定](docs/vault-canon/5T Protocol.md)  
- [進化路線圖](docs/soul.md)
#### 15. 5T 協定

**- 名詞定義**  
5T 協定是 Traceable / Trackable / Tangible / Transparent / Trustworthy 的 5 條合約，規定開發與運營的基本原則。

**- 使用場景**  
- 開發流程規範  
- 作業執行標準  
- 品質檢查  
- 安全存取  

**- 範例項目**  
- 每日麻雀：5T 儀式  
- 週燃：5T 熵減  
- 季度治理：5T 審計  

**- 延伸用途**  
- 企業開發流程  
- 品質檢查  
- 安全驗證  
- 合規管理  

**- 創意集成**  
- 5T 協定 + 電子報：自動推送週報  
- 5T 協定 + 智庫聖所：自動化知識庫  
- 5T 協定 + 5T 驗算：自動化驗證  

**- 維運須知**  
- 每日執行 5T 儀式  
- 每週檢查 5T 實施狀況  
- 每月審計 5T 合規  
- 每季評估 5T 效果  

**- 特別注意**  
- 5T 儀式不可跳過  
- 5T 驗算結果不可篡改  
- 5T 覆蓋寫入不可逆  
- 5T 執行記錄不可刪除  

**- 延伸資源**  
- [5T Protocol](docs/vault-canon/5T Protocol.md)  
- [soul.md](docs/soul.md)
#### 16. 結界六柱

**- 名詞定義**  
結界六柱是記憶 / 時間 / 空間 / 因果 / 不朽 / 圓通 6 個邊界柱，構成系統的完整框架。

**- 使用場景**  
- 系統架構設計  
- 資源分配  
- 時間管理  
- 因果分析  
- 蜂王職責  

**- 範例項目**  
- 記憶柱：記憶召回  
- 時間柱：熵管理  
- 空間柱：空間同步  
- 因果柱：因果追蹤  
- 不朽柱：不朽驗證  
- 圓通柱：圓通開啟  

**- 延伸用途**  
- 系統架構設計  
- 資源分配  
- 時間管理  
- 因果分析  
- 蜂王職責  

**- 創意集成**  
- 結界六柱 + 5T 驗算：系統驗證  
- 結界六柱 + 智庫聖所：記憶管理  
- 結界六柱 + 光之羽翼：任務調度  

**- 維運須知**  
- 每日檢查 6 柱狀態  
- 每週檢查 6 柱協作  
- 每月審計 6 柱穩定性  
- 每季評估 6 柱效能  

**- 特別注意**  
- 結界六柱不可破壞  
- 6 柱協作需同步  
- 6 柱狀態應記錄  
- 6 柱異常需立即處理  

**- 延伸資源**  
- [Soul Canon](docs/soul.md)  
- [OmniTag 契約](docs/vault-canon/OmniTag Universal Labeling Contract.md)
| **魂堂** | 系統的靈魂公約中心，通常指 `soul.md` |
| **OmniTag** | 全域語義分類標籤 |
| **Hash Lock** | 資料寫入後的 SHA-256 鎖定機制 |
| **Entropy** | 系統熵值，衡量系統混亂程度（目標 < 0.1） |
#### 3. 智庫聖所

**- 名詞定義**  
智庫聖所（01–06）是記憶召回模組，提供向量知識檢索，召回率 >95%，使用 BM25 + 向量 hybrid 模式。

**- 使用場景**  
- 知識庫質問回答（QA）  
- 文件檢索與推薦  
- 智能代理記憶  
- 資料庫查詢與檢索  

**- 範例項目**  
- 客服知識庫問答  
- 文件搜尋與推薦  
- 代理記憶儲存  
- 企業內部知識庫  

**- 延伸用途**  
- 個人知識管理系統  
- 企業內部文件搜尋  
- 智能客服機器人  
- 資料庫查詢系統  

**- 創意集成**  
- 智庫聖所 + 語音合成：語音查詢知識庫  
- 智庫聖所 + 電子報：週報推送  
- 智庫聖所 + 5T 驗算：自動化報告驗證  

**- 維運須知**  
- 每日蜂后晨會：盤點 P0 阻斷  
- 每週知識分享：分享新知識  
- 每月安全審計：檢查權限設置  
- 每季戰略評議：調整知識庫架構  

**- 特別注意**  
- 記憶資料應加密存儲  
- 權限控制：僅授權使用者可訪問  
- 資料備份：定期備份記憶庫  
- 資料刪除：保留審計記錄  

**- 延伸資源**  
- [tencentdb-memory 專案](apps/tencentdb-memory)  
- [omni-memory 模組](packages/omni-memory)  
- [OmniNote 知識庫](OmniNote)
#### 4. 符文契約

**- 名詞定義**  
符文契約（07–12）是 API 鑄造模組，提供 TypeScript 型別安全，含完整的契約管理與型別系統。

**- 使用場景**  
- API 開發與設計  
- 型別安全檢查  
- 契約管理  
- 跨服務通訊  

**- 範例項目**  
- API 端點設計  
- TypeScript 型別定義  
- 契約驗證  
- 服務間接口定義  

**- 延伸用途**  
- 微服務架構  
- 跨團隊 API 協作  
- 前後端分離開發  
- 資料管道設計  

**- 創意集成**  
- 符文契約 + 智庫聖所：型別安全知識庫  
- 符文契約 + 5T 驗算：自動化合同驗證  
- 符文契約 + 光之羽翼：自動化 API 生成  

**- 維運須知**  
- 每日檢查 API 可用性  
- 每週檢查合約一致性  
- 每月審計合約變更  
- 每季評估合約性能  

**- 特別注意**  
- API 版本控制：使用 SemVer  
- 錯誤處理：統一錯誤格式  
- 安全審計：檢查認證機制  
- 記錄：所有接口調用都要記錄  

**- 延伸資源**  
- [packages/shared](packages/shared)  
- [packages/omni-core](packages/omni-core)  
- [TypeScript 型別系統](docs/soul.md)
#### 5. 光之羽翼

**- 名詞定義**  
光之羽翼（13–18）是自動化背景任務模組，負責 ADK 調度、背景任務執行與排程管理。

**- 使用場景**  
- 背景任務執行  
- 排程管理  
- 自動化工作流  
- 任務調度  

**- 範例項目**  
- 週報生成  
- 報表生成  
- 資料同步  
- 定時任務執行  

**- 延伸用途**  
- 企業排程系統  
- 自動化報告  
- 數據同步  
- 背景處理  

**- 創意集成**  
- 光之羽翼 + 智庫聖所：自動化知識庫更新  
- 光之羽翼 + 煉金熵減：自動化重構流程  
- 光之羽翼 + 5T 驗算：自動化驗證流程  

**- 維運須知**  
- 每日檢查任務狀態  
- 每週檢查任務執行結果  
- 每月審計任務執行記錄  
- 每季優化任務配置  

**- 特別注意**  
- 任務超時：設定合理超時時間  
- 任務重試：設定重試規則  
- 任務抑制：避免重複任務  
- 資源限制：避免資源耗盡  

**- 延伸資源**  
- [apps/gateway](apps/gateway)  
- [GH Workflows](.github/workflows)  
- [ADK 調度](packages/omni-agent-bus)
#### 6. 煉金熵減

**- 名詞定義**  
煉金熵減（19–24）是重構模組，負責技術債清理與系統最佳化，熵值 -3%/週。

**- 使用場景**  
- 系統重構  
- 技術債清理  
- 性能優化  
- 代碼品質提升  

**- 範例項目**  
- 代碼重構  
- 依賴升級  
- 性能優化  
- 代碼清理  

**- 延伸用途**  
- 技術債清理  
- 系統優化  
- 代碼品質提升  
- 性能提升  

**- 創意集成**  
- 煉金熵減 + 5T 驗算：自動化驗證流程  
- 煉金熵減 + 智庫聖所：智庫數據整理  
- 煉金熵減 + 光之羽翼：自動化任務調度  

**- 維運須知**  
- 每週執行動態熵值檢查  
- 每月審計代碼品質  
- 每季評估技術債  
- 每年大規模重構  

**- 特別注意**  
- 重構前應作備份  
- 測試驗證：確保不破壞功能  
- 版本控制：使用 Git 追蹤變更  
- 性能監控：監控重構後變化  

**- 延伸資源**  
- [ts-matrix 工具](tools/ts-matrix)  
- [drift-report.json](tools/ts-matrix/drift-report.json)  
- [scripts](scripts)
#### 7. 5T 驗算

**- 名詞定義**  
5T 驗算（25–30）是驗證模組，負責 ISO 規範驗算、Hash Lock 和安全驗證。

**- 使用場景**  
- 安全驗證  
- 規範符合性檢查  
- Hash Lock 驗證  
- 產物驗證  

**- 範例項目**  
- ISO 規範驗算  
- 安全合規檢查  
- Hash Lock 驗證  
- 產物驗證報告  

**- 延伸用途**  
- 企業合規系統  
- 安全檢查  
- 風險評估  
- 審計報告  

**- 創意集成**  
- 5T 驗算 + 電子報：自動推送週報  
- 5T 驗算 + 智庫聖所：自動化知識驗證  
- 5T 驗算 + 符文契約：自動化 API 驗證  

**- 維運須知**  
- 每日檢查 5T 驗算狀態  
- 每週檢查合規報告  
- 每月審計安全事件  
- 每季評估品質指標  

**- 特別注意**  
- 安全事件時停止自動化並調用 Kill Switch  
- 覆蓋寫入或刪除前應先作備份  
- 密碼輪替：高風險金鑰每 90 天輪替  

**- 延伸資源**  
- [deploy-gate.ts](packages/omni-agent-bus/src/deploy-gate.ts)  
- [deep-freeze.ts](packages/omni-core/src/deep-freeze.ts)  
- [5T Protocol](docs/vault-canon/5T Protocol.md)

### 2.2 技術術語
### 2.3 技術工具


| 名詞 | 定義 |
|------|------|
#### 8. OmniNote

**- 名詞定義**  
OmniNote 是知識庫/筆記系統，支援 Markdown 格式，提供跨平臺筆記管理與同步。

**- 使用場景**  
- 筆記儲存  
- 知識管理  
- 項目協作  
- 會議記錄  

**- 範例項目**  
- 個人筆記系統  
- 團隊知識庫  
- 會議記錄  
- 项目文檔  

**- 延伸用途**  
- 個人知識庫  
- 團隊協作文檔  
- 項目規劃  
- 會議記錄  

**- 創意集成**  
- OmniNote + 智庫聖所：知識庫索引  
- OmniNote + 5T 驗算：筆記驗證  
- OmniNote + 光之羽翼：自動化筆記同步  

**- 維運須知**  
- 每日備份筆記資料  
- 每週檢查筆記完整性  
- 每月掃描潛在安全風險  
- 每季整理筆記分類  

**- 特別注意**  
- 筆記檔案權限：600  
- 敏感資料：加密存儲  
- 版本控制：使用 Git 追蹤  
- 備份：定期備份筆記  

**- 延伸資源**  
- [OmniNote 模組](OmniNote)  
- [omniscope 工具](omniscope)  
- [知識花園](docs/vault-canon)
#### 9. OmniBitwarden

**- 名詞定義**  
OmniBitwarden 是萬能金庫系統，融合 Bitwarden 的通用憑證存取與安全金鑰管理，專為 Omniesggo 設計。

**- 使用場景**  
- API 金鑰管理  
- 數據庫密碼管理  
- 憑證存取  
- 安全認證  

**- 範例項目**  
- API 金鑰存取  
- 數據庫密碼存取  
- 服務帳號管理  
- 安全認證  

**- 延伸用途**  
- 企業金鑰管理系統  
- 密碼管理  
- 認證管理  
- 安全存取  

**- 創意集成**  
- OmniBitwarden + 5T 驗算：金鑰驗證  
- OmniBitwarden + 光之羽翼：金鑰同步  
- OmniBitwarden + 智庫聖所：金鑰存儲  

**- 維運須知**  
- 每日檢查金鑰狀態  
- 每週檢查金鑰有效期  
- 每月輪替高風險金鑰  
- 每季審計金鑰使用  

**- 特別注意**  
- 金鑰輪替：每 90 天輪替一次高風險金鑰  
- 密碼管理：禁止寫入程式碼  
- 權限控制：secret-vault/ 目錄權限 600  
- 出口清理：程式終止時清理環境變數  

**- 延伸資源**  
- [OmniBitwarden 技能](.agents/skills/omni-bitwarden)  
- [OmniMasterKey](packages/omni-core)  
- [Junaikey](packages/omni-core/src/index.ts)
#### 10. OmniMasterKey

**- 名詞定義**  
OmniMasterKey 是統一憑證存取主鍵，提供通過 `omni_get_secret()` 函數統一存取金鑰。

**- 使用場景**  
- 統一憑證存取  
- 密碼管理  
- 認證檢查  
- 安全檢查  

**- 範例項目**  
- API 金鑰存取  
- 數據庫密碼存取  
- 服務帳號管理  
- 安全檢查  

**- 延伸用途**  
- 企業金鑰管理系統  
- 密碼管理  
- 認證管理  
- 安全存取  

**- 創意集成**  
- OmniMasterKey + 5T 驗算：金鑰驗證  
- OmniMasterKey + 光之羽翼：金鑰同步  
- OmniMasterKey + 智庫聖所：金鑰存儲  

**- 維運須知**  
- 每日檢查金鑰狀態  
- 每週檢查金鑰有效期  
- 每月輪替高風險金鑰  
- 每季審計金鑰使用  

**- 特別注意**  
- 金鑰輪替：每 90 天輪替一次高風險金鑰  
- 密碼管理：禁止寫入程式碼  
- 權限控制：secret-vault/ 目錄權限 600  
- 出口清理：程式終止時清理環境變數  

**- 延伸資源**  
- [OmniBitwarden 技能](.agents/skills/omni-bitwarden)  
- [OmniMasterKey](packages/omni-core)  
- [Junaikey](packages/omni-core/src/index.ts)
#### 11. Junaikey

**- 名詞定義**  
Junaikey 是每個開發者專屬金鑰，提供個別開發者身份識別與權限管理。

**- 使用場景**  
- 開發者身份識別  
- 權限管理  
- 作業執行  
- 安全檢查  

**- 範例項目**  
- 開發者身份驗證  
- 作業權限管理  
- 安全檢查  
- 身份識別  

**- 延伸用途**  
- 企業開發者身份管理  
- 權限管理系統  
- 作業控制  
- 安全檢查  

**- 創意集成**  
- Junaikey + 5T 驗算：金鑰驗證  
- Junaikey + 光之羽翼：金鑰同步  
- Junaikey + 智庫聖所：金鑰存儲  

**- 維運須知**  
- 每日檢查金鑰狀態  
- 每週檢查金鑰有效期  
- 每月輪替高風險金鑰  
- 每季審計金鑰使用  

**- 特別注意**  
- 金鑰輪替：每 90 天輪替一次高風險金鑰  
- 密碼管理：禁止寫入程式碼  
- 權限控制：secret-vault/ 目錄權限 600  
- 出口清理：程式終止時清理環境變數  

**- 延伸資源**  
- [Junaikey 技能](.agents/skills/junaikey)  
- [omni-core](packages/omni-core)
#### 12. OneTimeSecret

**- 名詞定義**  
OneTimeSecret 是一次性密碼分享系統，提供一次性密碼生成與分享功能。

**- 使用場景**  
- 密碼分享  
- 臨時密碼分發  
- 安全溝通  
- 機密文件傳遞  

**- 範例項目**  
- 密碼分享  
- 臨時密碼分發  
- 安全溝通  
- 機密文件傳遞  

**- 延伸用途**  
- 企業機密文件傳遞  
- 臨時密碼分發  
- 安全溝通  
- 敏感資訊傳遞  

**- 創意集成**  
- OneTimeSecret + 5T 驗算：密碼驗證  
- OneTimeSecret + 光之羽翼：密碼同步  
- OneTimeSecret + 智庫聖所：密碼存儲  

**- 維運須知**  
- 每日檢查密碼狀態  
- 每週檢查密碼有效期  
- 每月輪替高風險密碼  
- 每季審計密碼使用  

**- 特別注意**  
- 一次性密碼僅顯示一次，讀取後即失效  
- 密碼加密存儲  
- 權限控制：限制密碼分發對象  
- 準時清理：失效密碼應立即刪除  

**- 延伸資源**  
- [OneTimeSecret 連結](us.onetimesecret.com)  
- [secret-vault/](secret-vault)
#### 13. x-callback-url

**- 名詞定義**  
x-callback-url 是一種跨應用程式回調 URL 協定，用於不同應用程式之間的通信與數據交換。

**- 使用場景**  
- 應用程式間通信  
- 數據交換  
- 跨系統集成  
- 自動化流程  

**- 範例項目**  
- 應用程式間通信  
- 數據交換  
- 跨系統集成  
- 自動化流程  

**- 延伸用途**  
- 跨應用程式內容共享  
- 自動化流程  
- 系統集成  
- 外部服務整合  

**- 創意集成**  
- x-callback-url + 智庫聖所：知識查詢  
- x-callback-url + 5T 驗算：驗證流程  
- x-callback-url + 光之羽翼：自動化流程  

**- 維運須知**  
- 每日檢查 x-callback-url 狀態  
- 每週檢查回調記錄  
- 每月審計使用情況  
- 每季優化性能  

**- 特別注意**  
- 回調 URL 未經驗證時禁止使用  
- 數據加密傳輸  
- 權限控制：限制回調對象  
- 限速：避免過多回調請求  

**- 延伸資源**  
- [x-callback-url 協定](docs/vault-canon/Obsidian Shared Brain x-callback-url Protocol.md)  
- [Obsidian Shared Brain](docs/vault-canon/OBSIDIAN-SHARED-BRAIN-SYNC.md)
#### 14. Shared Brain

**- 名詞定義**  
Shared Brain 是共享大腦，多代理間的知識共享協定，促成跨代理協同運作。

**- 使用場景**  
- 多代理知識共享  
- 協同運作  
- 任務分配  
- 信息傳遞  

**- 範例項目**  
- 多代理協同任務  
- 知識共享  
- 任務分配  
- 信息傳遞  

**- 延伸用途**  
- 跨代理協同運作  
- 知識共享系統  
- 任務分配系統  
- 信息傳遞系統  

**- 創意集成**  
- Shared Brain + 智庫聖所：知識共享  
- Shared Brain + 5T 驗算：驗證流程  
- Shared Brain + 光之羽翼：自動化流程  

**- 維運須知**  
- 每日檢查共享狀態  
- 每週檢查共享記錄  
- 每月審計共享品質  
- 每季優化協作流程  

**- 特別注意**  
- 共享知識應加密存儲  
- 權限控制：限制知識共享對象  
- 知識版本控制：使用 Git 追蹤  
- 備份：定期備份共享資料  

**- 延伸資源**  
- [Obsidian Shared Brain](docs/vault-canon/OBSIDIAN-SHARED-BRAIN-SYNC.md)  
- [x-callback-url 協定](docs/vault-canon/Obsidian Shared Brain x-callback-url Protocol.md)

---

## 3. 使用場景

### 3.1 開發場景

| 場景 | 適用模組 | 說明 |
|------|----------|------|
| 新功能開發 | 2 / 8 / 9 | 符文契約 + 5T 驗算進行開發 |
| 自動化任務 | 13 / 14 / 15 | 光之羽翼執行後台任務 |
| 知識查詢 | 1 | 智庫聖所進行 RAG 記憶召回 |
| 安全審計 | 25 / 26 / 27 / 28 | 5T 驗算進行安全檢查 |
| 系統重構 | 19 / 20 / 21 | 煉金熵減進行技術債清理 |

### 3.2 產品場景

| 場景 | 適用模組 | 說明 |
|------|----------|------|
| ESG 報告產生 | 7 / 8 / 9 | 自動生成 ESG 報告 |
| 客戶支援 | 22 / 23 / 29 | 探路蜂與外交蜂處理請求 |
| 市場分析 | 17 / 18 | 市場蜂與社群蜂進行調查 |
| 產品設計 | 12 | 設計蜂進行 UI/UX 設計 |
| 內容生產 | 14 / 15 | 動畫蜂與文案蜂製作內容 |

### 3.3 自治場景

| 場景 | 適用模組 | 說明 |
|------|----------|------|
| 每日麻雀 | 01 - 30 | 全自動日報生成 |
| 週燃 | 19 - 24 | 週熵減重構 |
| 月度治理 | 27 - 30 | 月度安全與合規審計 |

---

## 4. 範例項目

### 4.1 新功能開發（符文契約 + 5T 驗算）

```bash
# 1. 建立分支
git checkout -b feature/new-feature

# 2. 開發（符文契約模組）
npm run dev

# 3. 5T 驗算
npm run verify

# 4. 提交與合併
git add .
git commit -m "feat: 新功能說明"
git push origin feature/new-feature
```

### 4.2 每日麻雀（自動化）

```bash
# 1. 通知萬能蜂后
echo "開始每日麻雀" | nc localhost 8642

# 2. 代理小隊執行（自動化）
npx celestial-command --awaken=DAILY --protocol=5T

# 3. 生成報告
cat ./reports/daily-report.md
```

### 4.3 週燃（熵減重構）

```bash
# 1. 提交週報
npx ts-matrix/verify.mjs --weekly

# 2. 熵減分析
npm run entropy:analyze

# 3. 重構
npm run refactor

# 4. 提交
git commit -m "refactor: 熵減重構"
```

### 4.4 記憶召回（智庫聖所）

```typescript
// 1. 建立知識庫
const kb = await OmniMemory.create('my-knowledge-base');

// 2. 插入文檔
await kb.insert('file.md', content);

// 3. 查詢
const results = await kb.retrieve('如何查詢記憶?', { topK: 5 });
console.log(results);
```

### 4.5 安全驗證（5T 驗算）

```typescript
// 1. 初始化驗算
const validator = new OmniValidator();

// 2. 驗證簽名
const result = await validator.verifyHashLock(artifacts);

// 3. 產生報告
await validator.generateReport();
```

---

## 5. 延伸用途

### 5.1 跨部門協作

| 部門 | 適用模組 | 協作方式 |
|------|----------|----------|
| 研發 | 2 / 8 / 9 | 符文契約 + 5T 驗算 |
| 設計 | 12 | 設計蜂 |
| 市場 | 17 / 18 | 市場蜂 + 社群蜂 |
| 客服 | 22 / 23 / 29 | 探路蜂 + 外交蜂 + 支援蜂 |
| 測試 | 11 | 測試蜂 |

### 5.2 系統集成

| 系統 | 集成方式 | 說明 |
|------|----------|------|
| Supabase | OAuth / API | 資料庫與認證 |
| Cloudflare | API Token | 靜態資源與 CDN |
| Firebase | API Token | 實時資料庫 |
| Oracle VPS | SSH / PM2 | 線上伺服器 |
| Bitwarden | CLI | 憑證存取 |

### 5.3 知識管理

| 場景 | 適用模組 | 說明 |
|------|----------|------|
| 筆記儲存 | OmniNote | Markdown 筆記 |
| 知識召回 | 智庫聖所 | 向量檢索 |
| 標籤分類 | OmniTag | 全域語義標籤 |
| 版本控制 | Git | 版本歷史 |

---

## 6. 創意集成

### 6.1 多模態整合

| 模組 | 整合方式 | 效果 |
|------|----------|------|
| 智庫聖所 + 語音 | Ollama + edge-tts | 語音查詢 |
| 符文契約 + 圖像 | Pillow + Runway | 圖像生成 |
| 煉金熵減 + 影片 | FFmpeg + n8n | 影片處理 |
| 5T 驗算 + 電子報 | n8n | 週報推送 |

### 6.2 自動化工作流

| 流程 | 順序 | 說明 |
|------|------|------|
| 每日麻雀 | 通知 → 執行 → 收集 → 報告 | 全自動日報 |
| 週燃 | 分析 → 重構 → 提交 → 報告 | 週熵減 |
| 季度治理 | 審計 → 整改 → 核准 → 封存 | 季度安全 |

### 6.3 個人化設定

| 項目 | 可設定值 | 說明 |
|------|----------|------|
| 熵減目標 | 0.05 - 0.3 | 系統熵值目標 |
| 自動化頻率 | 每日 / 每週 / 每月 | 自動化任務頻率 |
| 報告格式 | Markdown / JSON / HTML | 輸出格式 |
| 檢查門檻 | 不同 | 不同任務的門檻 |

---

## 7. 維運須知

### 7.1 每日

| 項目 | 頻率 | 說明 |
|------|------|------|
| 蜂后晨會 | 每日 | 盤點 P0 阻斷、昨日閉環、今日委派 |
| 系統健康檢查 | 每日 | 檢查 30 代理狀態 |
| 熵值監控 | 每日 | 監控系統熵值 |

### 7.2 每週

| 項目 | 頻率 | 說明 |
|------|------|------|
| 煉金委員會 | 每週 | 熵減儀式 + 標籤合約率稽核 |
| 週報生成 | 每週 | 生成週報 |
| 知識分享 | 每週 | 每週知識分享 |

### 7.3 每月

| 項目 | 頻率 | 說明 |
|------|------|------|
| 治理會議 | 每月 | RACI 覆核、Kill Switch 演練 |
| 安全審計 | 每月 | 安全事件審計 |
| 技能聖典修訂 | 每月 | 修訂技能檔案 |

### 7.4 每季

| 項目 | 頻率 | 說明 |
|------|------|------|
| 戰略評議 | 每季 | M1-M7 閉環覆盤、技能聖典修訂 |
| 成熟度模型 | 每季 | 自評並更新 |

---

## 8. 特別注意

### 8.1 安全須知

- **金鑰管理**：所有金鑰均需存放在 `secret-vault/` 或 `.env.local`，禁止寫入程式碼
- **環境變數**：本地開發使用 `.env.local`，生產環境使用 `secret-vault/`
- **權限控制**：`secret-vault/` 目錄權限 600，僅所有者可讀寫
- **密碼輪替**：高風險金鑰每 90 天輪替一次
- ** Sarbanes-Oxley**：所有輸出須通過 Hash Lock 驗證

### 8.2 操作須知

- **提交規則**：功能分支 PR，不得直接推送至 `main`
- **5T 標籤**：每筆代碼提交需標註 `source_origin`
- **衝突處理**：發生版本衝突時，依據 `5T Protocol` 解決
- **退出機制**：任何時候發生緊急，按 `Kill Switch` 操作

### 8.3 限制事項

- **模型限制**：特定模型有輸出字符限制，請注意
- **性能限制**：大規模資料庫查詢可能造成延遲
- **權限限制**：某些雲端服務有配額限制
- **版本限制**：舊版 API 可能不支援新功能

### 8.4 風險提示

- 覆蓋寫入或刪除前應先作備份
- 自動化任務可能觸發意外行為，請先測試
- 系統熵值高於 0.1 時應優先處理
- 安全事件時停止自動化並調用 Kill Switch

---

## 9. 版本歷史

| 版本 | 日期 | 說明 |
|------|------|------|
| 1.0 | 2026-11-03 | 初始版本，建立 Omniesggo 解說聖典 |


| 名詞 | 定義 |
|------|------|
#### 8. OmniNote

**- 名詞定義**  
OmniNote 是知識庫/筆記系統，支援 Markdown 格式，提供跨平臺筆記管理與同步。

**- 使用場景**  
- 筆記儲存  
- 知識管理  
- 項目協作  
- 會議記錄  

**- 範例項目**  
- 個人筆記系統  
- 團隊知識庫  
- 會議記錄  
- 項目文檔  

**- 延伸用途**  
- 個人知識庫  
- 團隊協作文檔  
- 項目規劃  
- 會議記錄  

**- 創意集成**  
- OmniNote + 智庫聖所：知識庫索引  
- OmniNote + 5T 驗算：筆記驗證  
- OmniNote + 光之羽翼：自動化筆記同步  

**- 維運須知**  
- 每日備份筆記資料  
- 每週檢查筆記完整性  
- 每月掃描潛在安全風險  
- 每季整理筆記分類  

**- 特別注意**  
- 筆記檔案權限：600  
- 敏感資料：加密存儲  
- 版本控制：使用 Git 追蹤  
- 備份：定期備份筆記  

**- 延伸資源**  
- [OmniNote 模組](OmniNote)  
- [omniscope 工具](omniscope)  
- [知識花園](docs/vault-canon)  

#### 9. OmniBitwarden

**- 名詞定義**  
OmniBitwarden 是萬能金庫系統，融合 Bitwarden 的通用憑證存取與安全金鑰管理，專為 Omniesggo 設計。

**- 使用場景**  
- API 金鑰管理  
- 數據庫密碼管理  
- 憑證存取  
- 安全認證  

**- 範例項目**  
- API 金鑰存取  
- 數據庫密碼存取  
- 服務帳號管理  
- 安全認證  

**- 延伸用途**  
- 企業金鑰管理系統  
- 密碼管理  
- 認證管理  
- 安全存取  

**- 創意集成**  
- OmniBitwarden + 5T 驗算：金鑰驗證  
- OmniBitwarden + 光之羽翼：金鑰同步  
- OmniBitwarden + 智庫聖所：金鑰存儲  

**- 維運須知**  
- 每日檢查金鑰狀態  
- 每週檢查金鑰有效期  
- 每月輪替高風險金鑰  
- 每季審計金鑰使用  

**- 特別注意**  
- 金鑰輪替：每 90 天輪替一次高風險金鑰  
- 密碼管理：禁止寫入程式碼  
- 權限控制：secret-vault/ 目錄權限 600  
- 出口清理：程式終止時清理環境變數  

**- 延伸資源**  
- [OmniBitwarden 技能](.agents/skills/omni-bitwarden)  
- [OmniMasterKey](packages/omni-core)  
- [Junaikey](packages/omni-core/src/index.ts)  

#### 10. OmniMasterKey

**- 名詞定義**  
OmniMasterKey 是統一憑證存取主鍵，提供通過 `omni_get_secret()` 函數統一存取金鑰。

**- 使用場景**  
- 統一憑證存取  
- 密碼管理  
- 認證檢查  
- 安全檢查  

**- 範例項目**  
- API 金鑰存取  
- 數據庫密碼存取  
- 服務帳號管理  
- 安全檢查  

**- 延伸用途**  
- 企業金鑰管理系統  
- 密碼管理  
- 認證管理  
- 安全存取  

**- 創意集成**  
- OmniMasterKey + 5T 驗算：金鑰驗證  
- OmniMasterKey + 光之羽翼：金鑰同步  
- OmniMasterKey + 智庫聖所：金鑰存儲  

**- 維運須知**  
- 每日檢查金鑰狀態  
- 每週檢查金鑰有效期  
- 每月輪替高風險金鑰  
- 每季審計金鑰使用  

**- 特別注意**  
- 金鑰輪替：每 90 天輪替一次高風險金鑰  
- 密碼管理：禁止寫入程式碼  
- 權限控制：secret-vault/ 目錄權限 600  
- 出口清理：程式終止時清理環境變數  

**- 延伸資源**  
- [OmniBitwarden 技能](.agents/skills/omni-bitwarden)  
- [OmniMasterKey](packages/omni-core)  
- [Junaikey](packages/omni-core/src/index.ts)  

#### 11. Junaikey

**- 名詞定義**  
Junaikey 是每個開發者專屬金鑰，提供個別開發者身份識別與權限管理。

**- 使用場景**  
- 開發者身份識別  
- 權限管理  
- 作業執行  
- 安全檢查  

**- 範例項目**  
- 開發者身份驗證  
- 作業權限管理  
- 安全檢查  
- 身份識別  

**- 延伸用途**  
- 企業開發者身份管理  
- 權限管理系統  
- 作業控制  
- 安全檢查  

**- 創意集成**  
- Junaikey + 5T 驗算：金鑰驗證  
- Junaikey + 光之羽翼：金鑰同步  
- Junaikey + 智庫聖所：金鑰存儲  

**- 維運須知**  
- 每日檢查金鑰狀態  
- 每週檢查金鑰有效期  
- 每月輪替高風險金鑰  
- 每季審計金鑰使用  

**- 特別注意**  
- 金鑰輪替：每 90 天輪替一次高風險金鑰  
- 密碼管理：禁止寫入程式碼  
- 權限控制：secret-vault/ 目錄權限 600  
- 出口清理：程式終止時清理環境變數  

**- 延伸資源**  
- [Junaikey 技能](.agents/skills/junaikey)  
- [omni-core](packages/omni-core)  

#### 12. OneTimeSecret

**- 名詞定義**  
OneTimeSecret 是一次性密碼分享系統，提供一次性密碼生成與分享功能。

**- 使用場景**  
- 密碼分享  
- 臨時密碼分發  
- 安全溝通  
- 機密文件傳遞  

**- 範例項目**  
- 密碼分享  
- 臨時密碼分發  
- 安全溝通  
- 機密文件傳遞  

**- 延伸用途**  
- 企業機密文件傳遞  
- 臨時密碼分發  
- 安全溝通  
- 敏感資訊傳遞  

**- 創意集成**  
- OneTimeSecret + 5T 驗算：密碼驗證  
- OneTimeSecret + 光之羽翼：密碼同步  
- OneTimeSecret + 智庫聖所：密碼存儲  

**- 維運須知**  
- 每日檢查密碼狀態  
- 每週檢查密碼有效期  
- 每月輪替高風險密碼  
- 每季審計密碼使用  

**- 特別注意**  
- 一次性密碼僅顯示一次，讀取後即失效  
- 密碼加密存儲  
- 權限控制：限制密碼分發對象  
- 準時清理：失效密碼應立即刪除  

**- 延伸資源**  
- [OneTimeSecret 連結](us.onetimesecret.com)  
- [secret-vault/](secret-vault)  

#### 13. x-callback-url

**- 名詞定義**  
x-callback-url 是一種跨應用程式回調 URL 協定，用於不同應用程式之間的通信與數據交換。

**- 使用場景**  
- 應用程式間通信  
- 數據交換  
- 跨系統集成  
- 自動化流程  

**- 範例項目**  
- 應用程式間通信  
- 數據交換  
- 跨系統集成  
- 自動化流程  

**- 延伸用途**  
- 跨應用程式內容共享  
- 自動化流程  
- 系統集成  
- 外部服務整合  

**- 創意集成**  
- x-callback-url + 智庫聖所：知識查詢  
- x-callback-url + 5T 驗算：驗證流程  
- x-callback-url + 光之羽翼：自動化流程  

**- 維運須知**  
- 每日檢查 x-callback-url 狀態  
- 每週檢查回調記錄  
- 每月審計使用情況  
- 每季優化性能  

**- 特別注意**  
- 回調 URL 未經驗證時禁止使用  
- 數據加密傳輸  
- 權限控制：限制回調對象  
- 限速：避免過多回調請求  

**- 延伸資源**  
- [x-callback-url 協定](docs/vault-canon/Obsidian Shared Brain x-callback-url Protocol.md)  
- [Obsidian Shared Brain](docs/vault-canon/OBSIDIAN-SHARED-BRAIN-SYNC.md)  

#### 14. Shared Brain

**- 名詞定義**  
Shared Brain 是共享大腦，多代理間的知識共享協定，促成跨代理協同運作。

**- 使用場景**  
- 多代理知識共享  
- 協同運作  
- 任務分配  
- 信息傳遞  

**- 範例項目**  
- 多代理協同任務  
- 知識共享  
- 任務分配  
- 信息傳遞  

**- 延伸用途**  
- 跨代理協同運作  
- 知識共享系統  
- 任務分配系統  
- 信息傳遞系統  

**- 創意集成**  
- Shared Brain + 智庫聖所：知識共享  
- Shared Brain + 5T 驗算：驗證流程  
- Shared Brain + 光之羽翼：自動化流程  

**- 維運須知**  
- 每日檢查共享狀態  
- 每週檢查共享記錄  
- 每月審計共享品質  
- 每季優化協作流程  

**- 特別注意**  
- 共享知識應加密存儲  
- 權限控制：限制知識共享對象  
- 知識版本控制：使用 Git 追蹤  
- 備份：定期備份共享資料  

**- 延伸資源**  
- [Obsidian Shared Brain](docs/vault-canon/OBSIDIAN-SHARED-BRAIN-SYNC.md)  
- [x-callback-url 協定](docs/vault-canon/Obsidian Shared Brain x-callback-url Protocol.md)  

#### 15. 5T 協定

**- 名詞定義**  
5T 協定是 Traceable / Trackable / Tangible / Transparent / Trustworthy 的 5 條合約，規定開發與運營的基本原則。

**- 使用場景**  
- 開發流程規範  
- 作業執行標準  
- 品質檢查  
- 安全存取  

**- 範例項目**  
- 每日麻雀：5T 儀式  
- 週燃：5T 熵減  
- 季度治理：5T 審計  

**- 延伸用途**  
- 企業開發流程  
- 品質檢查  
- 安全驗證  
- 合規管理  

**- 創意集成**  
- 5T 協定 + 電子報：自動推送週報  
- 5T 協定 + 智庫聖所：自動化知識庫  
- 5T 協定 + 5T 驗算：自動化驗證  

**- 維運須知**  
- 每日執行 5T 儀式  
- 每週檢查 5T 實施狀況  
- 每月審計 5T 合規  
- 每季評估 5T 效果  

**- 特別注意**  
- 5T 儀式不可跳過  
- 5T 驗算結果不可篡改  
- 5T 覆蓋寫入不可逆  
- 5T 執行記錄不可刪除  

**- 延伸資源**  
- [5T Protocol](docs/vault-canon/5T Protocol.md)  
- [soul.md](docs/soul.md)  

#### 16. 結界六柱

**- 名詞定義**  
結界六柱是記憶 / 時間 / 空間 / 因果 / 不朽 / 圓通 6 個邊界柱，構成系統的完整框架。

**- 使用場景**  
- 系統架構設計  
- 資源分配  
- 時間管理  
- 因果分析  
- 蜂王職責  

**- 範例項目**  
- 記憶柱：記憶召回  
- 時間柱：熵管理  
- 空間柱：空間同步  
- 因果柱：因果追蹤  
- 不朽柱：不朽驗證  
- 圓通柱：圓通開啟  

**- 延伸用途**  
- 系統架構設計  
- 資源分配  
- 時間管理  
- 因果分析  
- 蜂王職責  

**- 創意集成**  
- 結界六柱 + 5T 驗算：系統驗證  
- 結界六柱 + 智庫聖所：記憶管理  
- 結界六柱 + 光之羽翼：任務調度  

**- 維運須知**  
- 每日檢查 6 柱狀態  
- 每週檢查 6 柱協作  
- 每月審計 6 柱穩定性  
- 每季評估 6 柱效能  

**- 特別注意**  
- 結界六柱不可破壞  
- 6 柱協作需同步  
- 6 柱狀態應記錄  
- 6 柱異常需立即處理  

**- 延伸資源**  
- [Soul Canon](docs/soul.md)  
- [OmniTag 契約](docs/vault-canon/OmniTag Universal Labeling Contract.md)  

#### 17. Memory

**- 名詞定義**  
Memory 是記憶系統，提供向量知識檢索與記憶管理。

**- 使用場景**  
- 記憶召回  
- 知識管理  
- 智能代理記憶  
- 資料查詢  

**- 範例項目**  
- 記憶召回  
- 知識管理  
- 智能代理記憶  
- 資料查詢  

**- 延伸用途**  
- 智能代理記憶系統  
- 知識庫管理  
- 文件搜尋與推薦  
- 個人助理系統  

**- 創意集成**  
- Memory + 智庫聖所：記憶召回  
- Memory + 5T 驗算：記憶驗證  
- Memory + 光之羽翼：記憶同步  

**- 維運須知**  
- 每日檢查記憶狀態  
- 每週檢查記憶完整性  
- 每月審計記憶安全  
- 每季優化記憶效能  

**- 特別注意**  
- 記憶資料應加密存儲  
- 權限控制：限制訪問對象  
- 記憶備份：定期備份  
- 記憶清理：及時刪除過期資料  

**- 延伸資源**  
- [omni-memory](packages/omni-memory)  
- [tencentdb-memory](apps/tencentdb-memory)  
- [OmniNote](OmniNote)  

#### 18. Cloudflare

**- 名詞定義**  
Cloudflare 是雲端邊緣網路平台，提供 CDN、DDoS 防護、DNS 管理與網路安全服務。

**- 使用場景**  
- CDN 加速  
- DDoS 防護  
- DNS 管理  
- 網路安全  

**- 範例項目**  
- CDN 設置  
- DDoS 防護  
- DNS 管理  
- 網路安全  

**- 延伸用途**  
- 企業網路安全  
- 靜態資源加速  
- 優化內容傳遞  
- 保護網路服務  

**- 創意集成**  
- Cloudflare + 智庫聖所：內容加速  
- Cloudflare + 光之羽翼：自動化安全  
- Cloudflare + 5T 驗算：安全檢查  

**- 維運須知**  
- 每日檢查 Cloudflare 狀態  
- 每週檢查安全日誌  
- 每月審計防護設置  
- 每季優化配置  

**- 特別注意**  
- 網站安全：啟用 HTTPS  
- 防火牆：設置基本防護  
- 速率限制：配置適當限制  
- 數據保護：設置數據隱私  

**- 延伸資源**  
- [Cloudflare Dashboard](https://dash.cloudflare.com)  
- [Cloudflare API](https://api.cloudflare.com)  

#### 19. Firebase

**- 名詞定義**  
Firebase 是 Google 的應用開發平台，提供實時資料庫、身份驗證、雲端儲存與分析工具。

**- 使用場景**  
- 實時資料庫  
- 身份驗證  
- 雲端儲存  
- 數據分析  

**- 範例項目**  
- 實時資料庫  
- 身份驗證  
- 雲端儲存  
- 數據分析  

**- 延伸用途**  
- 網站後端服務  
- 移動應用開發  
- 即時通訊  
- 數據分析  

**- 創意集成**  
- Firebase + 智庫聖所：實時知識庫  
- Firebase + 光之羽翼：即時任務調度  
- Firebase + 5T 驗算：安全檢查  

**- 維運須知**  
- 每日檢查 Firebase 狀態  
- 每週檢查使用量  
- 每月審計安全設置  
- 每季優化性能  

**- 特別注意**  
- 數據隱私：保護使用者數據  
- 權限控制：設置安全規則  
- 數據備份：定期備份  
- 配額限制：監視API 調用量  

**- 延伸資源**  
- [Firebase Console](https://console.firebase.google.com)  
- [Firebase API](https://firebase.google.com)  

#### 20. Oracle VPS

**- 名詞定義**  
Oracle VPS 是 Oracle 雲端虛擬伺服器，提供可靠的雲端運算資源與設備。

**- 使用場景**  
- 雲端運算  
- 應用部署  
- 數據處理  
- 服務運行  

**- 範例項目**  
- 應用部署  
- 數據處理  
- 服務運行  
- 雲端運算  

**- 延伸用途**  
- 企業雲端運算  
- 網站託管  
- 數據處理  
- 自動化運行  

**- 創意集成**  
- Oracle VPS + 光之羽翼：自動化服務  
- Oracle VPS + 5T 驗算：安全檢查  
- Oracle VPS + 智庫聖所：知識庫存儲  

**- 維運須知**  
- 每日檢查 VPS 狀態  
- 每週檢查資源使用  
- 每月審計安全設置  
- 每季優化配置  

**- 特別注意**  
- 網路安全：配置防火牆  
- 數據備份：定期備份數據  
- 權限控制：限制訪問  
- 資源監控：監測資源使用  

**- 延伸資源**  
- [Oracle Cloud](https://cloud.oracle.com)  
- [Oracle VPS 控制台](https://cloud.oracle.com/virtual)  


---

## 10. 神器目錄與核實狀態（2026-11-11 增補）

> **增補性質**：本節依「萬能架構」相關資料局部增補，落點為本典末尾。本典既有章節（含 §2.3 名詞條目與其後附錄式條目）一律維持原文；既有敘述與本次查證之差異，僅於本節以來源與核實狀態釐清，不回頭改寫。
> **核對基準**：main HEAD `3aa3f88115601aafc1779010ecadadbc995031a7`（2026-11-11 fresh-read）。本章所引倉庫路徑未另標 commit 者，一律指該 commit 下之內容。
> **主要來源**：[Omni-Sanctuary/Index/artifact-registry.md（神器登錄冊）](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/Omni-Sanctuary/Index/artifact-registry.md)（登錄冊自載最後更新 2026-08-06，列 9 項神器）、[docs/vault-canon/OMNI-ARCH-12-MODULES.md（12 大萬能模組正典）](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/docs/vault-canon/OMNI-ARCH-12-MODULES.md)。

### 10.0 分類釐清（先讀）

1. **登錄冊 9 項與 12 模組正典為兩套分類，不得混算**：登錄冊列 001 至 009 共 9 項「神器」；`docs/vault-canon/OMNI-ARCH-12-MODULES.md` 則為 `@esggo/omni-arch`（`packages/omni-arch`）之 12 個 TypeScript 架構模組（OmniBase、OmniMemory、……、OmniEvolution）契約分類。兩者命名體系與統計口徑不同，不得相加、互換或互為總數。
2. **卡牌化「神器類」屬敘事分類，非工程清單**：[soul-chapter-29-glory-sacred-tome.md](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/soul-chapter-29-glory-sacred-tome.md) §29.8 之「神器類 Artifacts」為卡牌化遊戲隱喻（該章自述為「可視化隱喻層（非工程元件）」，且 §29.9 誠實登記將「卡牌系統／10 色元素」標記為「⚠️ 隱喻」，並註明「OMC 與 OmniTag 為其工程實化」）。引用該章時須連同狀態標記一併引用，不得作為工程清單使用。
3. **萬能元鑰與萬能標籤**：另列為相關能力（見 §10.7、§10.8），**不計入**登錄冊第 10、11 項編號；本章亦不以 9 項宣稱系統最終總數。

### 10.1 證據層級定義

| 標記 | 定義 |
|---|---|
| 【文件描述】 | 僅見於文件（README、登錄冊、聖典、手冊等）之敘述，未於源碼層核對 |
| 【源碼可見】 | 本次已於 main `3aa3f881` 快照讀取實際檔案內容並確認支持 |
| 【部署／整合／現況未驗證】 | 涉及倉庫外狀態（VPS、域名、外部服務、本機聖櫃、雲端帳戶），本次未連線驗證 |

補充原則：登錄冊「✅ 啟用／同步／實例運行」等狀態欄為其 2026-08-06 自載紀錄，屬【文件描述】，非本次驗證結果；README 或各正典所載之測試通過數字（如「706 passed」）亦僅為文件記載，不作為目前測試、部署或服務可用之證明。

### 10.2 九項神器核實總表

| 編號 | 神器名稱 | 登錄冊路徑 | 本次核實結果（main `3aa3f881`） |
|---|---|---|---|
| 001 | 自動修復核心 | `Artifacts/auto-repair.json` | 該路徑本次未找到，待查（§10.3） |
| 002 | 核心配置 | `Artifacts/config.json` | 該路徑本次未找到，待查（§10.3） |
| 003 | NVIDIA AI 模組 | `Artifacts/integrations/nvidia.json` | 該路徑本次未找到，待查（§10.3） |
| 004 | Langfuse 追蹤器 | `Artifacts/integrations/langfuse.json` | 該路徑本次未找到，待查（§10.3） |
| 005 | Google ADK | `Artifacts/integrations/adk.json` | 該路徑本次未找到，待查（§10.3） |
| 006 | LangChain 引擎 | `Artifacts/integrations/langchain.json` | 該路徑本次未找到，待查（§10.3） |
| 007 | 萬能即時翻譯 | `apps/universal-translator/` | 源碼可見，詳 §10.4；線上實例未驗證 |
| 008 | Auto-Repair Workflow | `.github/workflows/auto-repair.yml` | 源碼可見，詳 §10.5；運行成效未驗證 |
| 009 | TencentDB Agent Memory | `apps/tencentdb-memory/` | 源碼可見，詳 §10.6；線上實例未驗證 |

### 10.3 001 至 006：本次未找到對應檔案，標「待查」

**Artifacts 路徑核實**：main `3aa3f881` 快照中，倉庫根目錄無 `Artifacts/` 目錄；全倉搜尋（node_modules 除外）`auto-repair.json`、`config.json`、`nvidia.json`、`langfuse.json`、`adk.json`、`langchain.json` 均未找到。倉內與 `Artifacts` 相關者僅有 `Omni-Sanctuary/Artifacts/keys/secret-vault-index.md`（鍵值索引文件，與上述 JSON 無對應關係）。此結果僅表示「本次該路徑未找到」，**不推斷**該等檔案從未存在、對應服務未啟用或登錄有誤。

**與登錄名稱對應之實作核實**：

- 004 Langfuse 追蹤器：全倉（node_modules 除外）未見 Langfuse 整合之實作或介面。待查。
- 005 Google ADK／006 LangChain 引擎：[`oa-twins/hyper/fabric.ts`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/oa-twins/hyper/fabric.ts)（源碼可見）為「跨框架能力探測層」，以三態（ACTIVE／PHANTOM／MISSING）探測 `langchain`、`@google/genkit`、`@google/adk`、`crewai` 四套件之宣告與可解析性；其註解明載不將此四個重型依賴納入 monorepo 直接依賴，改以 `probeFabric()` 探測合約取代。未見以「Google ADK」「LangChain 引擎」為名之整合模組或介面。待查。
- 003 NVIDIA AI 模組：倉內存在 NVIDIA 相關程式（[`agents/skills/smart-ai-router/model-discovery/providers/nvidia.ts`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/agents/skills/smart-ai-router/model-discovery/providers/nvidia.ts)，源碼可見：NVIDIA NGC／Nemotron 免費模型探索 provider，環境變數 `NVIDIA_API_KEY`），惟其屬 smart-ai-router 之模型發現層，與登錄冊 `Artifacts/integrations/nvidia.json` 之對應關係未經證實。待查。
- 001 自動修復核心／002 核心配置：未於倉內找到可對應 `Artifacts/auto-repair.json`、`Artifacts/config.json` 之實作或介面。§10.5 所述之 GitHub Actions 工作流為登錄冊另一獨立項目（008），是否即 001 所指未經證實。待查。

**操作方式**：001 至 006 因無實際實作或介面可依，本節不提供任何操作方式描述，避免杜撰。

### 10.4 007 萬能即時翻譯（`apps/universal-translator/`）

**功能**【源碼可見】：

- 服務層 [`server.mjs`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/apps/universal-translator/server.mjs)（Node.js，預設埠 8788，HTTP + WebSocket + SSE）：端點含 `GET /health`、`GET /`（Live UI）、`GET /studio`（收音端）、`GET /float`（懸浮字幕）、`GET /stream?room=xxx`（觀眾端 SSE 雙語字幕，依 room 過濾廣播）、`POST /translate`（單語／多語翻譯，回 JSON 並廣播 SSE）、`POST /speak`、`WS /ws`（輸入即翻譯並廣播）；回應標頭帶 `X-OA-Engine`／`X-OA-Cached`／`X-OA-Trace` 溯源資訊。
- 翻譯引擎鏈 [`translate.mjs`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/apps/universal-translator/translate.mjs)：Ollama+Gemma（設 `OLLAMA_MODEL` 時啟用）→ Gemini（`viaGeminiLive35`，設 `GEMINI_API_KEY` 時啟用）→ Google gtx（免費零 key）→ LibreTranslate（自建）→ MyMemory（免費）→ **原文兜底**；附 LRU 快取、指數退避重試、逾時與引擎標記。
- 語音轉錄 [`stt_service.py`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/apps/universal-translator/stt_service.py)：faster-whisper 微服務，監聽 8790，`POST /transcribe` 接收音訊（webm/ogg/wav/mp3/flac/m4a）回傳文字與語言；預設模型 small、CPU int8、VAD 濾靜音。

**適用場景**【文件描述＋源碼可見】：會議與直播之即時雙語字幕（studio 收音 → float／stream 觀眾端）、繁中↔英文雙向翻譯、可疊加 Zoom／Meet 之懸浮字幕（[README.md](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/apps/universal-translator/README.md)）。

**已核實的使用方式**【文件描述，本次未執行】：README 快速開始：`pip install -r requirements.txt` → `python stt_service.py`（背景 STT）→ `node server.mjs`（:8788）。必要依賴：Node.js（`package.json`）與 Python `requirements.txt`（faster-whisper）。環境變數見 `.env.example`：`PORT`、`LIBRETRANSLATE_URL`／`LIBRETRANSLATE_KEY`、`MYMEMORY_EMAIL`、`OLLAMA_MODEL`（註解，預設停用）、`GEMINI_API_KEY`／`GEMINI_MODEL`／`GEMINI_TIMEOUT_MS`（註解，預設停用）。上述指令為文件所載，**本次未執行**任何啟動腳本或服務。

**前置條件**【文件描述】：Node.js 與 Python + faster-whisper；使用 LibreTranslate 引擎需自建實例；啟用 Ollama 引擎需自行部署 Ollama 並 pull 模型。

**特別事項與限制**：

- **README 宣稱與程式實際整合須分開**【文件描述＋源碼可見】：README 稱「Gemini 3.5 Live Translate（可選增強）」並指向 `GEMINI_LIVE_3_5_INTEGRATION.md`——**該檔於本快照未找到**。程式層實際整合為：`translate.mjs` 之 `viaGeminiLive35` 引擎（僅在設 `GEMINI_API_KEY` 時進入引擎鏈最前端，預設關閉，失敗自動回落免費鏈，預設模型 `gemini-2.5-flash`），以及 `s2s_gemini_live.mjs` 之 S2S 介面（該檔註解自載依「禁用 Google／Gemini／Firebase」政策，雲端同傳預設停用、僅保留介面）。
- **隱私與資料流向**：待譯文字會送至外部翻譯引擎（Google gtx、LibreTranslate、MyMemory；啟用時另有 Ollama 與 Gemini 之 generativelanguage API）；room 字幕廣播時會將原文、譯文、room_id、role 寫入共享記憶後端（[`src/memory-integration.mjs`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/apps/universal-translator/src/memory-integration.mjs)：`MEMORY_GATEWAY` 預設 `http://localhost:8420`，token 預設 `local`）。**敏感內容不應輸入本系統**。
- **原文兜底不等於翻譯成功**：引擎鏈末端為原文兜底；收到原文回覆不代表譯文已產生，請以 `X-OA-Engine` 標頭辨識實際服務引擎。
- **現場部署未驗證**：登錄冊稱 `https://translate.esggo.co`「實例運行」為 2026-08-06 紀錄【文件描述】；本次未連線驗證該域名或任何部署。

### 10.5 008 Auto-Repair Workflow（`.github/workflows/auto-repair.yml`）

**功能**【源碼可見，[auto-repair.yml](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/.github/workflows/auto-repair.yml) 590 行】：

- **觸發條件**：`workflow_run` 事件——`OmniCore CI`、`ESG-GO CI/CD Pipeline`、`Build & publish AI Station image` 三個工作流完成後，且 `conclusion == 'failure'` 時（branches：`main`、`develop`）。
- **分析**（`analyze` job）：下載失敗 run 之日誌，依模式識別 8 類錯誤（typescript／eslint／test／build／dependency／secret／docker／unknown），輸出 `repairable` 判定——**test 與 secret 兩類 `repairable=false`，不自動修復**。
- **修復 job**（僅對應 `repairable=true` 之錯誤類型執行）：TypeScript（`: any` 改 `: unknown`、移除 `@ts-ignore`／`@ts-nocheck`、`lint --fix`）、ESLint（`lint --fix`，兩輪）、Build（重跑 `pnpm build`）、Dependency（重裝依賴並提交 lockfile）、Docker（Dockerfile `FROM node:` 統一改 `node:22-alpine` 後重建）。修復經驗證通過後，建立 `auto-repair/` 前綴分支並開立 PR 至 main。
- **追蹤**（`tracker-notify`，always）：建立 tracker issue（同一 CI run 去重，已存在則改為留言）、Telegram 與 SMTP 電子郵件通知（對應 secrets 未設定則自動跳過）；`oa-selfcheck` job 執行 `oa-selfcheck.sh` 自驗。

**適用場景**：main／develop 之 CI 失敗後的自動修復嘗試、錯誤分類與追蹤通知。

**已核實的使用方式**：由 `workflow_run` 自動觸發，無手動入口；產出為修復分支 PR 與 tracker issue。本次僅閱讀工作流檔案內容，**未觸發、未執行**該工作流。

**權限**【源碼可見】：`contents: write`、`pull-requests: write`、`issues: write`、`actions: read`；checkout 與推送可使用 `GH_PAT_AUTO_REPAIR` 或 `GITHUB_TOKEN`。

**人工覆核要求**：修復僅開立 PR，**不自動合併**——與本典 §8.2「功能分支 PR，不得直接推送至 main」一致；PR 併入前須人工覆核。secret 類錯誤（日�出現 `AKIA`／`ghp_` 等特徵）一律不自動修復，須人工處理。

**特別事項與限制**：本檔案存在於 main 為【源碼可見】；惟其**是否已實際啟用、是否曾成功修復**任何 CI 失敗，本次未驗證，不作宣稱。

### 10.6 009 TencentDB Agent Memory（`apps/tencentdb-memory/`）

**功能**【文件描述＋源碼可見】：TencentDB Agent Memory（上游 `TencentCloud/TencentDB-Agent-Memory`）之本地部署腳本組（[`apps/tencentdb-memory/README.md`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/apps/tencentdb-memory/README.md) 207 行，附 start／stop／verify 腳本；另見[集成聖典 Omni-Sanctuary/Codex/tencentdb-memory-canon.md](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/Omni-Sanctuary/Codex/tencentdb-memory-canon.md)）：

- 三件套：`memory-core`（記憶核心 Gateway，埠 8420：記憶讀寫、鑑權、skill／RAG 資料面）、`memory-hub`（埠 8125 Panel 管理 UI ＋ 8424 Knowledge 服務）、`proxy`（埠 8096：上游 LLM 請求轉發代理）。
- Docker 映象取自 Docker Hub `agentmemory` 命名空間（`agentmemory/memory-core`、`agentmemory/memory-hub`、`agentmemory/memory-proxy`，多架構公開）。

**適用場景**【文件描述】：蜂群共享長期記憶後端（MemoryCore／MemoryHub／Proxy 三位一體）、知識庫與 RAG 資料面、coding agent 之 API 入口（`ANTHROPIC_BASE_URL`／`OPENAI_BASE_URL` 指向 proxy）。

**已核實的使用方式**【文件描述，本次未執行】：README 所載流程——`cp .env.example .env` → 編輯 `.env` 填入兩組 LLM 參數 → `./verify.sh`（干跑校驗；`--skip-llm` 可跳過外部請求）→ `./start-all.sh` 一鍵拉起；各元件可 `./start-memory-core.sh`、`./start-memory-hub.sh`、`./start-proxy.sh` 獨立啟動；`./stop-all.sh` 停止（`--purge` 另刪 volume 與網路）。**本次未執行**任何啟動腳本、未連線任何外部服務、未進行任何 volume 操作。

**前置條件**【文件描述】：macOS／Linux、Docker、bash 4+；兩組獨立 LLM 參數——`MEMORY_LLM_*`（memory-core／memory-hub 內部 embedding 與總結用）與 `PROXY_UPSTREAM_*`（proxy 轉發上游）；memory-hub 與 proxy 之完整功能（RAG、鑑權、skill 注入）建議 memory-core 先啟動。

**特別事項與限制**：

- **內部憑證預設值不適合生產或公網**【文件描述，README 明載】：`MEMORY_CORE_GATEWAY_API_KEY` 預設 `local`、`MEMORY_CORE_ADMIN_USERNAME`／`MEMORY_CORE_ADMIN_USER_KEY` 預設 `admin`——README 自述「生產／聯調／公網暴露前必須替換成隨機長串，否則任何拿到埠的人都能拿到 system_admin 權限」。
- **資料持久化與破壞性操作**：資料存於 named volumes（`tdai-memory-core-data`、`tdai-panel-data`）；`stop-all.sh --purge` 會刪除 volume，屬破壞性操作。
- **過去紀錄非目前狀態**：集成聖典所載「VPS 實例三件套 healthy＋公網 tunnel 驗證通過」等敘述屬過去部署紀錄【文件描述】，本次未驗證目前 VPS 或 `memory.esggo.co` 之現況。

### 10.7 相關能力一：萬能元鑰（不計入登錄冊編號）

**名稱與定位混用——待釐清**。「萬能元鑰」一詞於倉內至少有三種指涉【源碼可見】：

1. [`skills/security/omni-master-key/SKILL.md`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/skills/security/omni-master-key/SKILL.md) 上半部：**OmniMasterKey**＝統一憑證存取（本機 `secret-vault/*.env` 為主、Bitwarden `bw` CLI 為備之瀑布式讀取；輸出一律 `***MASKED***`；實作檔 `scripts/omni_master_key.py`、結構自驗 `scripts/verify_omni_master_key.py`）。
2. 同檔下半部與 [`vps/junaikey.mjs`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/vps/junaikey.mjs)：**JunAikey 萬能元鑰／萬能永憶**＝代理成長層（記憶、技能、進度、閉環；NCBDB 為 primary、本機 `~/.junaikey/` 為 fallback；SKILL.md 自載「不取代祕密庫；祕密庫管憑證，JunAikey 管記憶」）。
3. [`vps/omni-master-key.mjs`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/vps/omni-master-key.mjs)：**OmniKey（萬能元鑰）**＝SUPREME 最高層，**OmniMasterKey（萬能鑰匙）**＝其下之 vault 管理層（鍵值由 VPS 端 gitignored `.env.secrets` 注入 `process.env`）——此命名層級與第 1 點相反。

三者之統一定位須待釐清；本節僅並列如實記載，不作裁決。

**「萬能元鑰是密碼解碼器」**：此為**使用者定義**（使用者對萬能元鑰之口頭定義）。本次已查之程式（`scripts/omni_master_key.py`、`vps/omni-master-key.mjs`、`vps/junaikey.mjs`）所見為憑證之「讀取、分發與遮罩」及鍵值登錄定義，**未見**解碼或解密邏輯；不得推論實際程式均具解碼能力。

**適用場景**【文件描述＋源碼可見】：憑證統一讀取入口（`omni_get_secret()`，輸出遮罩、僅回報來源標籤與檔名）；代理任務需注入金鑰而不得硬編碼時之環境變數注入。

**特別事項與限制**：

- 已核實程式**未證實**「安全加密金庫」或「自動輪替」能力：本機 vault 為 `.env` 純文字檔（權限 600），非加密容器；`local .env` 不可視為已驗證金庫。SKILL.md 所列輪替原則（如高風險金鑰 90 天）屬治理規範【文件描述】，未見自動輪替實作。
- hash、Base64、ZKP（SKILL.md 提及 `{{ZKP:KEY}}` 鍵孔與 auto-discovery 流程）等技術詞**均不可寫成端到端加密**。
- 安全界線：本次修訂未讀取、顯示、解碼、測試、複製或更動任何真實秘密；未執行 `vps/omni-master-key.mjs`、`vps/junaikey.mjs` 或任何讀取憑證之命令。
- §2.3 既有 #10 OmniMasterKey、#11 Junaikey 條目維持原文；其敘述與本次查證之差異（例如 #11 稱 Junaikey 為「開發者專屬金鑰……身份識別與權限管理」，而 SKILL.md 與 `vps/junaikey.mjs` 將 JunAikey 定位為代理成長層）以本節釐清為準，不回頭改寫既有條目。

### 10.8 相關能力二：萬能標籤（OmniTag／Trust Label，不計入登錄冊編號）

**三處不同實作，API 與用途各異，引用時須指明具體檔案**：

1. [`packages/omni-arch/src/tag.ts`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/packages/omni-arch/src/tag.ts)【源碼可見】：`OmniTagRegistry` 類——標籤須以 `#` 開頭（`E_TAG_FORMAT` 契約錯誤）、可標 `readonly` 保護、高危標籤（如 `#高危操作`）觸發 `MartialLock` 戒嚴防護色（對接 OmniTheme；未受保護標籤回 `LiquidGlass`）。
2. [`app/api/tags/universal/route.ts`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/app/api/tags/universal/route.ts)【源碼可見】：Next.js API 路由——`GET /api/tags/universal?entityType=&entityId=` 查詢實體標籤配對（無參數則列出全部 UniversalTag）、`POST`（`action: 'sync-esg'`）同步 ESGTag；底層為 prisma 資料庫配對層。
3. [`docs/OMNITAG-TRUSTLABEL-USER-MANUAL.md`](https://github.com/DingJun1028/Omniesggo/blob/3aa3f88115601aafc1779010ecadadbc995031a7/docs/OMNITAG-TRUSTLABEL-USER-MANUAL.md)【文件描述】：6 維 MECE 標籤（security／agent／squad／lifecycle／priority／platform 等）＋ 信任標別系統：`TRUST_LEVEL_SCORE` 分級（low 0.70／authenticated 0.90／high 0.95／critical 1.00）、生命週期 draft→active→sealed→frozen→archived、`hashLock` 為 SHA-256(`${agent}:${level}:${timestamp}`）、`Object.freeze()`、frozen lock 契約（`validateTrustLevel`／`enforceFrozenLock`）。該手冊自載之測試基線（706 passed 等）為文件記載，非本次驗證。

**適用場景**：模組／記憶／技能之結構化分類檢索、生命週期治理、信任門控（`trustGate`）、標籤衝突檢查（如 `security:public` 與 `security:restricted` 互斥）。

**特別事項與限制**：

- **標籤、分數及 freeze/hash 不是身分驗證或授權的替代品**：trustScore 與 hashLock 為治理與溯源標記，不構成認證（authentication）或授權（authorization）機制。
