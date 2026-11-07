# Obsidian 共享大腦 × x-callback-url 知識庫（Agent Shared Knowledge）

> **文件代號：CALLBACK-KB** · 對齊：`OBSIDIAN-SHARED-BRAIN-SYNC.md`（共享大腦區與讀寫範圍）、`AGENT-SHARED-KNOWLEDGE.md`（全代理共享知識公約）、`soul.md §1.1 5T`。
> **共享區**：本倉庫 `docs/vault-canon/` 為唯一共享大腦區；本文件為全代理（Hermes／OmniAgent、Vibe、Claude、其他 agent）共享 `x-callback-url` 知識與協調之入口文件。
> **版本**：v1.0.0 · 2026-11-02
> **語言**：zh-Hant（繁體中文）

---

## 一、目的

- 建立跨代理共享 `x-callback-url` 知識機制：任何代理在呼叫或實作 `x-callback-url` 端點前，先讀本文件取得全域現況、端點清單與參數規範，避免重複工作、參數錯誤與決策矛盾。
- 本文件列出所有 `x-callback-url` 端點、每個端點的 `mode` 參數、行為定義、必要參數、安全限制與驗證方式，作為共享大腦（Obsidian Vault）與外部應用（UpNote、iOS Shortcuts、作業系統快捷指令、Hermes Agent 等）之間通訊的統一協定。

---

## 二、X 自我介紹

`x-callback-url` 是用於應用間通訊的 URL Scheme 協定。外部應用透過 `x-callback-url://x-callback-url/{endpoint}?{parameters}` 呼叫本應用並取得回應。其核心格式為：

```text
x-callback-url://x-callback-url/{endpoint}?{參數列表}
```

### 2.1 共用參數

| 參數 | 必填 | 說明 |
|---|---|---|
| `x-source` | 否 | 發起請求的應用程式名稱（例如：`omniesggo-hermes`、`omniesggo-upnote`、`ios-shortcuts`） |
| `x-error` | 否 | 若發生錯誤，回傳給發起者（例如：`Invalid note ID`） |

### 2.2 共用回應格式

| 參數 | 必填 | 說明 |
|---|---|---|
| `x-success` | 是 | 成功時回傳的 URL Scheme |
| `x-error` | 否 | 失敗時回傳的錯誤描述 |

---

## 三、端點清單（7 個）

| 端點名稱 | 功能 | 必要參數 | 輸出 |
|---|---|---|---|
| `openNote` | 開啟/預覽/查看單個筆記 | `noteID`（必要） | `x-callback-url://x-callback-url/note/{noteID}` |
| `note/new` | 新建筆記 | `title`（必要）、`content`（選填）、`notebookID`（選填）、`tags`（選填） | `x-callback-url://x-callback-url/note` |
| `openNotebook` | 開啟/預覽/查看單個筆記本 | `notebookID`（必要） | `x-callback-url://x-callback-url/notebook/{notebookID}` |
| `notebook/new` | 新建筆記本 | `title`（必要）、`type`（選填）、`parentID`（選填） | `x-callback-url://x-callback-url/notebook` |
| `tag/view` | 查看/列出筆記標籤 | `tag`（選填）、`mode`（選填） | `x-callback-url://x-callback-url/tag` |
| `openFilter` | 開啟/列出篩選條件 | `filterID`（選填）、`mode`（選填） | `x-callback-url://x-callback-url/filter` |
| `view` | 檢視/列出 | `viewID`（選填）、`type`（選填）、`mode`（選填） | `x-callback-url://x-callback-url/view` |

> 註：`mode` 參數為可選，但某些端點（如 `openNote`、`openNotebook`）的 `mode` 可影響行為。未提供 `mode` 時，預設為 `open`。

---

## 四、`mode` 參數行為定義

### 4.1 `openNote`（開啟/預覽/查看筆記）

| `mode` | 行為 |
|---|---|
| `open`（預設） | 開啟整個筆記，載入完整內容與編輯介面 |
| `preview` | 預覽筆記內容，僅讀取模式，無編輯 |
| `view` | 查看筆記，顯示摘要與目錄，無編輯 |

### 4.2 `note/new`（新建筆記）

| `mode` | 行為 |
|---|---|
| `create`（預設） | 在指定或預設筆記本中建立新筆記 |

### 4.3 `openNotebook`（開啟/預覽/查看筆記本）

| `mode` | 行為 |
|---|---|
| `open`（預設） | 開啟整個筆記本，列出全部筆記與檔案 |
| `preview` | 預覽筆記本，僅讀取模式，無編輯 |
| `view` | 查看筆記本，顯示摘要與目錄，無編輯 |

### 4.4 `notebook/new`（新建筆記本）

| `mode` | 行為 |
|---|---|
| `create`（預設） | 在指定或預設位置建立新筆記本 |

### 4.5 `tag/view`（查看/列出標籤）

| `mode` | 行為 |
|---|---|
| `view`（預設） | 查看指定 tag 的所有筆記 |
| `list` | 列出所有標籤 |

### 4.6 `openFilter`（開啟/列出篩選）

| `mode` | 行為 |
|---|---|
| `open`（預設） | 開啟指定篩選條件 |
| `list` | 列出所有篩選條件 |

### 4.7 `view`（檢視/列出）

| `mode` | 行為 |
|---|---|
| `view`（預設） | 檢視指定檢視 |
| `list` | 列出所有檢視 |

---

## 五、端點詳細定義

### 5.1 `openNote`

開啟單個筆記。

**必要參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `noteID` | 字串 | 筆記唯一識別碼 |

**選用參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `mode` | 字串 | 行為模式：`open`（預設）、`preview`、`view` |

**回應：**

```json
{
  "x-success": "x-callback-url://x-callback-url/note/{noteID}",
  "x-error": null
}
```

### 5.2 `note/new`（新建筆記）

建立新筆記。

**必要參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `title` | 字串 | 筆記標題 |

**選用參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `content` | 字串 | 筆記內容 |
| `notebookID` | 字串 | 所在筆記本 |
| `tags` | 字串（逗號分隔） | 標籤列表 |

**回應：**

```json
{
  "x-success": "x-callback-url://x-callback-url/note",
  "x-error": null,
  "noteID": "生成的筆記ID"
}
```

### 5.3 `openNotebook`

開啟單個筆記本。

**必要參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `notebookID` | 字串 | 筆記本唯一識別碼 |

**選用參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `mode` | 字串 | 行為模式：`open`（預設）、`preview`、`view` |

**回應：**

```json
{
  "x-success": "x-callback-url://x-callback-url/notebook/{notebookID}",
  "x-error": null
}
```

### 5.4 `notebook/new`（新建筆記本）

建立新筆記本。

**必要參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `title` | 字串 | 筆記本標題 |

**選用參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `type` | 字串 | 筆記本類型：`folder`（預設）、`tag`、`workspace` |
| `parentID` | 字串 | 父筆記本 ID |

**回應：**

```json
{
  "x-success": "x-callback-url://x-callback-url/notebook",
  "x-error": null,
  "notebookID": "生成的筆記本ID"
}
```

### 5.5 `tag/view`

查看/列出筆記標籤。

**選用參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `tag` | 字串 | 標籤名稱（空字串表示列出所有標籤） |
| `mode` | 字串 | 行為模式：`view`（預設）、`list` |

**回應：**

```json
{
  "x-success": "x-callback-url://x-callback-url/tag",
  "x-error": null,
  "tags": ["tag1", "tag2", "..."]
}
```

### 5.6 `openFilter`

開啟/列出篩選條件。

**選用參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `filterID` | 字串 | 篩選條件 ID |
| `mode` | 字串 | 行為模式：`open`（預設）、`list` |

**回應：**

```json
{
  "x-success": "x-callback-url://x-callback-url/filter",
  "x-error": null,
  "filters": [
    {
      "id": "filter-id",
      "name": "篩選名稱",
      "conditions": "篩選條件"
    }
  ]
}
```

### 5.7 `view`

檢視/列出。

**選用參數：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `viewID` | 字串 | 檢視 ID |
| `type` | 字串 | 檢視類型：`overview`、`detailed`、`list` |
| `mode` | 字串 | 行為模式：`view`（預設）、`list` |

**回應：**

```json
{
  "x-success": "x-callback-url://x-callback-url/view",
  "x-error": null,
  "views": [
    {
      "id": "view-id",
      "type": "overview",
      "name": "檢視名稱",
      "content": "檢視內容"
    }
  ]
}
```

---

## 六、跨應用通訊範例

### 6.1 Hermes 開啟特定筆記

```text
x-callback-url://x-callback-url/openNote?noteID=01A199C0-1EE9-7E1F-AE2A-C2BE6705E17A&mode=open&x-source=omniesggo-hermes
```

### 6.2 UpNote 建立新筆記

```text
x-callback-url://x-callback-url/note/new?title=機器人筆記&content=此筆記由 Hermes 建立&tags=OmniNote,OmniAgent&x-source=omniesggo-hermes
```

### 6.3 iOS Shortcuts 列出所有標籤

```text
x-callback-url://x-callback-url/tag/view?mode=list&x-source=ios-shortcuts
```

### 6.4 Hermes 建立新筆記本

```text
x-callback-url://x-callback-url/notebook/new?title=2026-Q4&type=folder&parentID=01A199C0-XXXX-XXXX-XXXX-XXXXXXXXXXXX&x-source=omniesggo-hermes
```

---

## 七、安全限制

| 限制 | 說明 |
|---|---|
| 最小權限 | 僅可用於共享大腦（`docs/vault-canon/`）與授權代理，禁止讀取不在共享區的檔案 |
| 輸入驗證 | 所有輸入參數需驗證，不得直接拼接到檔案路徑或 SQL 查詢 |
| 回應過濾 | 回應中不得包含敏感資料（密碼、API Key、憑證、隱私資料），輸出皆為 `***MASKED***` |
| 速率限制 | 單一 `x-callback-url` 呼叫每分鐘不超過 60 次 |
| 配對認證 | 跨應用通訊需經授權（OAuth 2.0 或 App-Pairing），避免未授權存取 |

---

## 八、掃描與維護

- 本文件由 `OMN-PRD-001` 與 `AGENT-SHARED-KNOWLEDGE.md` 驅動，記錄於 `docs/vault-canon/` 共享區。
- 任何代理可於此文件新增或更新端點定義，但須經過 CI 檢查與「代理協同」審核後提交 PR。
- 文件更新格式：每筆更新必須含 UTC 時間戳、代理標記（`source_origin`）、變更摘要；舊紀錄不刪除，採時間堆疊。

---

## 九、相關文件

| 文件 | 說明 |
|---|---|
| `OBSIDIAN-SHARED-BRAIN-SYNC.md` | 共享大腦同步後端邊界（`obsidian-git` 與 `ob`） |
| `AGENT-SHARED-KNOWLEDGE.md` | 全代理共享知識公約 |
| `12大萬能 OMNI-CANON.md` | 12 大萬能完整契約 |
| `OMN-PRD-001 終始矩陣.md` | 終始矩陣與 TypeBox 核心規範 |
| `OmicNote` | OmniNote 萬能筆記（Python） |
| `OMNiAgent.ts` | OmniAgent 代理載體（TS） |

---

> **Updated: 2026-11-02** · 由 Hermes Agent 編寫 · 與 `docs/vault-canon/` 共享記憶層（`shared-memory.ts`）做對接 · 語言：zh-Hant · 授權：AGPL-3.0
