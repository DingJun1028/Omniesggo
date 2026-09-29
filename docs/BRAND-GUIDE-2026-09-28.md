---
source_origin: 万能分身 session (2026-09-28) / 交付包第三份文件
created: 2026-09-28
modified: 2026-09-28
co_authors: [agent:13, agent:15, agent:30]
lifecycle: active
access: public-research
---

# 品牌指南：ESG GO / 萬能蜂群

> 配套文件：`docs/DELIVERY-CERT-2026-09-28.md`（證書）、
> `docs/DEPLOY-CHECKLIST-2026-09-28.md`（部署清單）
>
> 5T-Tangible: 本指南的色碼、禁用詞、DNA 標記皆為 `apps/aistation/src/brand.py`
> 與
> `soul.md` §22.3 的既有正典，非本次發明。
> 5T-Transparent: 每條規則皆標註其 5T 對應與程式化位置。

---

## 1. 視覺識別

### 核心色板

| 角色 | 色碼 | 用途 | 5T 對應 |
|------|------|------|----------|
| 深藍（主） | `#10243f` | 標題、主視覺、權威語境 | Traceable — 制度感與可溯源性 |
| 暖金（強調） | `#c9a24b` | 關鍵數字、認證標記、高光 | Trustworthy — 認證與刻印 |
| 米白（底） | `#f3ede1` | 內文背景、卡片底 | Tangible — 閱讀舒適度 |
| 綠（ESG） | `#3c6e47` | 方法段、驗證通過、正向狀態 | Trustworthy — 可持續實踐 |

### 延伸色（僅用於腳本 DNA 分段）

| 段落 | 色碼 | 語意 |
|------|------|------|
| 場景 | 深藍 → 暖金漸層 | 開端、建立脈絡 |
| 衝突 | 冷藍 `#0a1626` | 張力、問題浮現 |
| 洞察 | 暖金 | 理解、轉折點 |
| 方法 | 綠 `#3c6e47` | 可執行步驟 |
| 反思 | 米白 | 餘韻、收束 |

**程式化位置**：`apps/aistation/src/brand.py` → `PALETTE`（第 33-36 行）/
`DNA_PALETTES`（第 56 行起）。

---

## 2. 使命與核心價值

### 使命

> 把重複且可被協作的工序交給 AI，
> 讓人把時間還給原創判斷、方法與人性的餘韻。

**邊界**（Transparent）：思想、經驗、價值判斷與最終責任來自人；AI 負責
研究、腳本初稿、視覺、剪輯與分發的協作，而不是思想主體。

**程式化位置**：`apps/aistation/src/brand.py` → `BRAND["ai_boundary"]`
（第 39-42 行，值經實讀驗證）。

### 內容憲法（Trustworthy — 質控蜂把關）

`BRAND["constitution"]` 五條（第 43-49 行）：

1. 必須有原創判斷（壽司博士的判斷是什麼）
2. 前 30 秒清楚說明與觀眾的關聯
3. 必須提供方法或行動
4. AI 必須提高品質，而不是稀釋真實性
5. 必須留下人性的餘韻

### 核心價值

1. **萬能合作** — 跨域協作，共享成功
2. **無縫銜接** — 流程無縫，效率最大
3. **同體共榮** — 團隊第一，個人成長
4. **持續創新** — 不斷突破，永不滿足
5. **品質至上** — 精益求精，追求卓越

---

## 3. 文字語彙

### 片頭台詞（Traceable — 自動產生，來源可溯）

> 「大家好，我是壽司博士。這裡談的不是料理，而是改變未來的 Source：
> 永續、AI、商業，以及人的價值。」

**程式化位置**：`apps/aistation/src/brand.py` → `BRAND["intro_line"]`
（第 35-38 行，值經實讀驗證）。

### 腳本 DNA 標記（Trackable — 來源可查）

固定五段，每段一拍一鏡：

```
【場景】【衝突】【洞察】【方法】【反思】
```

**程式化位置**：`parse_dna()` — `apps/aistation/src/brand.py:133`
（另有 `apps/aistation/src/parsers/dna_parser.py:37`）。

### 禁用詞與禁用視覺（Trustworthy — 由 30 號質控蜂把關）

| 類別 | 禁用項 |
|------|--------|
| 色彩 | 藍紫霓虹 |
| 意象 | 機器人大腦、漂浮數據 |
| 場景 | 無意義商務畫面 |
| 動態 | 過量未來科技動畫 |

**程式化位置**：`apps/aistation/src/brand.py` → `BRAND["forbidden_ai_visuals"]`
（第 51-53 行）。`soul.md` §22.3 稱由質控蜂驗證把關，但
**`brand_verify.py` 目前並不存在於程式碼中** — 此為 canon 描述與實作的落差，
待補（見交付清單 D4）。

---

## 4. 程式碼與文件慣例

### Commit 訊息

```
<type>(<scope>): <繁中摘要>

## 背景
## 根因
## 修法
## 實測驗證
## 影響
## 5T 對照

Co-Authored-By: Hermes <noreply@hermes.ai>
```

**硬規則**：
- 摘要用繁體中文（非簡體）
- 必須附「實測驗證」段落，含指令與 exit code
- 不可只有「完成」而無證據
- `source_origin` 必填；非本 session 產出者須明示

### 文件 frontmatter（Trustworthy 禁區）

```yaml
---
source_origin: <可溯來源>
created: YYYY-MM-DD
modified: YYYY-MM-DD
co_authors: [agent:NN, ...]
lifecycle: active | archived
access: public-research | internal
---
```

**byte-level 要求**：第一行必須是 `2d2d2d 0a`（`---` + LF）。
`read_file` 顯示「看起來正常」不代表格式正確 — pre-commit hook 校驗的是位元組。
以 `xxd <file> | head -1` 驗證。

### Git 署名

本 repo 慣用署名為 `Your Name <you@example.com>`（近 20 個 commit 一致）。
**保持一致，不要個別修改** — 改動會破壞歷史可比性。

---

## 5. 一致性檢查

發布前逐項確認：

```bash
# 色碼使用一致（不得出現未定義 hex）
grep -rEo '#[0-9a-f]{6}' src/ docs/ | sort -u

# 禁用視覺詞未被引入
grep -rniE 'neon|robot.?brain|floating.?data' src/

# 提交前 5T 校驗
git commit   # 觸發 .githooks/pre-commit

# 文件格式 byte-level
xxd docs/<file>.md | head -1   # 期望 2d2d2d 0a
```

---

## 6. Do / Don't

| ✅ Do | ❌ Don't |
|-------|----------|
| 用 `#10243f` 深藍承載權威語境 | 用藍紫霓虹營造科技感 |
| 用暖金標記認證與刻印數字 | 用暖金大面積鋪底 |
| 提交前附實測驗證段落 | 只寫「已修復」而無 exit code |
| 文件帶完整 frontmatter | 省略 `source_origin` 或 `co_authors` |
| 保持 repo 既有一致署名 | 個別修改 git user.name 造成歷史分歧 |
| 誠實標示未解決項與原因 | 以「完成」掩蓋部分阻塞 |
| 先寫架構規格書再寫程式 | 寫完才發現架構矛盾 |

---

## 7. 邊界聲明

本指南描述的是**專案內的程式化預設**（`apps/aistation/src/brand.py`、
`soul.md` §22.3），不是通用品牌系統。使用時若與程式碼
不一致，**以程式碼為準並修正本指南** — 指南是程式碼的說明，不是相反。

### 本指南修正過的 canon 落差

撰寫時以程式碼為準，發現 `soul.md` §22.3 與實作有落差，已如實記錄：

| 項目 | canon 描述 | 實作真值 |
|------|-----------|---------|
| `intro_line` | 節錄並以「…」省略 | 完整兩句，結尾為「永續、AI、商業，以及人的價值。」 |
| `ai_boundary` | 「研究、初稿」 | 「研究、腳本初稿」，結尾用「。」 |
| `constitution` | 未提及 | 實際存在五條（第 43-49 行），已補入 §2 |
| `brand_verify.py` | 「由質控蜂驗證把關」 | **檔案不存在** — canon 描述的驗證尚未實作 |

---

```
靈魂簽章：Queen Bee & Team OA-Team
對應 canon：soul.md §22.3 品牌預設與 5T 對應
5T 狀態：Tangible 視覺識別 / Traceable 片頭台詞 / Trackable 腳本 DNA
         / Transparent AI 邊界 / Trustworthy 禁用視覺
```
