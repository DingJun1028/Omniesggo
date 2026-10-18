# esggo-knowledge

> 共享知識庫與永恆記憶核心 — 5T 協定

## 專案載入

```
esggo/knowledge/
├── __init__.py        # 包入口：SOURCE_ORIGIN_CANON / MODEL_VERSION
├── db.py              # 共享知識庫實例（SQLite）
├── registry.py        # 30 代理註冊表（含 31-60 雙蜂）
├── schema.sql         # 資料庫 Schema
└── knowledge-graph.json  # 代理互動圖
```

## 5T 對映

| 5T  | 落實方式 |
|-----|---------|
| Traceable | 每筆資料帶 `content_origin` + `sha256` + 代理錚點 `anchor` |
| Trackable | 生命週期事件 (`ingest/link/annotate/seal/consume`) 進 `events` 表 |
| Tangible  | CLI 即時回傳 URIs / 摘要 / 鎖資訊 / 事件流 |
| Transparent | 模式、治理區塊、版本號公開；內容可解壓 / 讀回 |
| Trustworthy | Hash Lock + 版本鎖；鎖定後任何覆寫拋 `PermissionError` |

## 指令

```
esggo-knowledge status            顯示資料庫狀態
esggo-knowledge list [visibility] 查詢共享索引
esggo-knowledge query --text ...  全文搜尋
esggo-knowledge ingest -f FILE -a 01   匯入檔案成為知識檔案
esggo-knowledge events DOC_ID         查看生命週期事件
esggo-knowledge links DOC_ID          查看關聯
esggo-knowledge version               顯示模型版本
```

## 授權鍵

行為由錚點 `anchor` 的授權鍵決定：

| 可見性 | 授權鍵 | 5T  |
|--------|--------|-----|
| public | read   | 可見 |
| team   | read   | 可見 |
| restricted | approve | 受控 |
| agent  | write  | 代理可寫 |
| sealed | sealed | 鎖定 |

## 永恆記憶模型

`MODEL_VERSION = "1"` — 跨 session 與手機字碼互操作的版本號。

`SOURCE_ORIGIN_CANON = "soul.md::OA-Team-30-Matrix"` — 由 5T 驗證後才可寫入的索引鍵。

## 前置需求

```
pip install -e .
```

或直接執行 `scripts/esggo-knowledge`（已提供執行權）。
