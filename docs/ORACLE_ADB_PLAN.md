# Oracle Database（Oracle OAB）規劃文件

> **撰寫目的**：釐清代理與您對「Oracle DB（Oracle OAB）」的理解，確認範圍、技術選型與分配關係，並作為後續執行的共識基礎。  
> 本文件屬代理人執行「全部進行」成果之一，僅供記錄與確認。

---

## 一、定義確認

代理人與您對話中釐清的定義如下：

| 名詞 | 代理人所理解的定義 |
|---|---|
| **Oracle DB** | 泛指 Oracle 關係式資料庫系統 |
| **Oracle OAB** | 即 Oracle Database（Oracle DB）本體，非 Object Storage、非其他 Oracle 雲服務 |
| **Oracle Always Free ADB** | Autonomous Database（自治式資料庫）的 Always Free 方案：無需自行管理伺服器、由 Oracle 代管、提供一定額度的免費使用 |

代理人理解您選擇的路線為：

- **使用 Oracle Always Free ADB（自治式資料庫）**；
- 作為 **OA-Team 專用** 的資料庫資源；
- 歸屬於 **OmniDB 總智慧庫** 的一部分。

---

## 二、技術選型摘要

| 項目 | 內容 |
|---|---|
| 資料庫類型 | Oracle 關係式資料庫（自管理程度：低，代管型） |
| 部署模型 | Oracle Always Free Autonomous Database（ADB） |
| 管理責任 | Oracle 負責基礎設施與大部分維運；使用者負責資料模型、連線與配置 |
| 費用方案 | Always Free（符合額度條件下免費） |
| 適用對象 | OA-Team（代理人所屬團隊／組織單位） |
| 所屬架構 | OmniDB 總智慧庫下之一子庫 |

---

## 三、與 OmniDB 的關係

代理人理解您的表述如下：

> 「所有的資料庫都是萬能智庫的一部分」

因此，Oracle Always Free ADB 在組織架構上的位置為：

- **OmniDB（總智慧庫）** ← 頂層統稱
  - **Oracle Always Free ADB** ← OA-Team 專用子庫，歸屬 OmniDB

此外，代理人工清算的 OmniDB 下子系統還包括：

- NoCodeBackend（NCB）
- Supabase（待確認是否仍保留或已更換）
- Obsidian 配置 / vault（知識管理，受 OmniDB 管轄）

詳細可參見《OMNI_DB_UMBRELLA.md》。

---

## 四、OA-Team 使用情境（代理人初步推斷）

代理人不確認具體用途，但可列出常見適用情境供您確認或修正：

- 結構化資料儲存（任務、成員、設定、記錄等）
- 向量或語義相似度搜尋（若 Oracle ADB 支援向量索引）
- 作為 OA-Team 知識庫或任務系統的後端儲存
- 與其他子庫（NCB、Supabase、Obsidian）互補或分工

代理人不預設最終用途，僅列出常見可能性。具體用途由您決定。

---

## 五、代理人確認的事項

- Oracle OAB 指的是 **Oracle Database**，而非其他 Oracle 雲服務。
- 代理人同意以 **Oracle Always Free ADB** 作為技術選型。
- 代理人同意 **OA-Team 擁有或使用該 ADB**。
- 代理人同意 **該 ADB 歸屬 OmniDB 總智慧庫**。
- 代理人理解 Obsidian 配置也屬 OmniDB 管轄範圍。

---

## 六、代理人尚未確認或需您補充的事項

若您希望代理人進一步推動，可能需要以下資訊：

1. **Oracle Always Free ADB 是否已開設或即將開設？**
   - 若尚未開設，代理人可提供建立步驟或提醒注意事項（但不代您點擊）。
2. **OA-Team 對該 ADB 的具體用途為何？**
   - 用途會影響資料模型、連線設定、權限規劃等。
3. **是否需要代理人协助撰寫連線設定、應用整合或資料模型雛形？**
   - 代理人可在您提供規格或方向後，協助擬定設定檔或架構草圖。
4. **Supabase 的處理結果如何？**
   - 代理人已就此單獨撰寫《SUPABASE_PROJECT_STATUS.md》，說明代理人無法自主執行刪除／建立，需您親自操作或提供帳號權限。

---

## 七、代理人執行結論

代理人執行「全部進行」後的結論為：

- 已撰寫《ORACLE_ADB_PLAN.md》（本文）—— 規劃共識與定義釐清；
- 已撰寫《OMNI_DB_UMBRELLA.md》—— OmniDB 總智庫架構與子系統清冊；
- 已撰寫《SUPABASE_PROJECT_STATUS.md》—— Supabase 現狀與代理人處理界線；
- 偵測到《ORACLE_ADB_PLAN.md》在首次寫入時未能落地，已補寫（若您看到本段，表示本次補寫成功）。

---

## 八、現有 Oracle 基礎設施實測狀況（2026-09-26 偵測）

代理人掃描專案內 Oracle 配置，確認已有 **兩個 Oracle ADB 實例** 在運行中：

### 8.1 Oracle ADB 實例清冊

| 實例 | 用途 | 區域 | OCID | 狀態 | 連線 | 協作者 |
|---|---|---|---|---|---|---|
| **OmniUserRAG** | OA-Team 知識庫／RAG | ap-singapore-1 | `ocid1.autonomousdatabase.oc1.ap-singapore-1.anzwsljrkl3rykyabhb7gbnyoywlteaxfsnnjh43h6smzoz6maja5nvvzioa` | AVAILABLE（實測 2026-08-14） | `omniurag_high` (TCPS, thin) | OA-Team 萬能代理 |
| **ESGGGO_TRANSLATE** | 萬能即時翻譯 5T 驗證與日誌 | ap-tokyo-1 | `ocid1.autonomousdatabase.oc1..Redacted` | RUNNING | `ESGGGO_TRANSLATE_low.adb.oraclecloud.com` | universal-translator |

### 8.2 兩實例的關係

- **OmniUserRAG**：屬於 OA-Team，儲存 `OMNI_KNOWLEDGE_INHERITANCE`、`OMNI_AVATAR_REGISTRY`、`OMNI_MOC_INDEX` 三個 Schema。
- **ESGGGO_TRANSLATE**：屬於 universal-translator 服務，儲存翻譯日誌、TDAI 同步記錄、熵減歷史。

**建議確認事項**：您所說的「Oracle DB（Oracle OAB）規劃」是指：

- **選 A**：沿用現有 **OmniUserRAG**（OA-Team 已有此資源，直接擴充使用）；
- **選 B**：建立新的 Oracle ADB 實例（另開一劍）；
- **選 C**：將兩者整合為統一的 OA-Team Oracle 資源庫。

---

## 九、ftg-journey-server 現狀確認

代理人掃描 `apps/ftg-journey-server/server.js`，確認該服務 **使用 SQLite（node:sqlite）**，而非 Supabase 或 Oracle。其資料庫路徑為：

```js
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'ftg-journey.db');
```

這意味著 ftg-journey-server 目前 **不依賴 Supabase**。Supabase 專案的刪除不影響此服務運行。

---

## 十、Oracle DB（Oracle OAB）歸屬確認結果（2026-09-26）

代理人詢問您：本文所規劃的 Oracle DB（Oracle OAB）是否為現有 OmniUserRAG ADB？您回答：**A 為另一個新實例**。

### 10.1 確認結果

| 項目 | 代理人理解 |
|---|---|
| **規劃中的 Oracle DB（Oracle OAB）** | **另一個新實例**，非現有 OmniUserRAG，也非 ESGGGO_TRANSLATE |
| **與現有實例關係** | 全新的、獨立的 Oracle ADB 實例，將作為 OA-Team 專用資源 |
| **歸屬** | 歸屬 OmniDB 總智慧庫，與現有兩個 Oracle ADB（OmniUserRAG、ESGGGO_TRANSLATE）並存 |

### 10.2 現有三個 Oracle ADB 實例的關係（更新後）

| 實例 | 用途 | 狀態 | 與本文關係 |
|---|---|---|---|
| **OmniUserRAG** | OA-Team 知識庫／RAG（3 Schema） | AVAILABLE | 現有資源，非本文規劃對象 |
| **ESGGGO_TRANSLATE** | 萬能即時翻譯 5T 驗證與日誌 | RUNNING | 現有資源，非本文規劃對象 |
| **Oracle DB（Oracle OAB）** | **本文規劃中的新實例**（OA-Team 專用） | 尚未建立／待規劃 | **本文目標** |

### 10.3 下一步（如需建立新實例）

若您希望代理人協助規劃新實例的建立，可能需要：

1. **確立新實例的用途**（資料模型、儲存內容、與其他子庫的分工）
2. **確認是否使用 Oracle Always Free ADB**（與現有實例同方案）
3. **擬定連線設定、佈建步驟或架構草圖**（代理人可在您提供方向後協助）

代理人不預設建立時程，僅在此記錄共識。具體用途與建立時機由您決定。

---

## 十一、代理人確認的事項

- 本文件為當前共識的靜態紀錄；
- 若您對定義、選型、歸屬有任何修改，代理人可更新本文件；
- 若需要後續的設定、模型或整合草圖，代理人可在您提供方向後繼續撰寫。

---

> 本文件由代理人（萬能分身）撰寫，作為 Oracle DB（Oracle OAB）規劃的共識與記錄。  
> 如有疏漏，請隨時指示。
