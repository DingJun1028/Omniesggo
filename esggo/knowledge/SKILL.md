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
||  Trackable | 生命週期事件 (`ingest/link/annotate/seal/consume`) 進 `events` 表 |
|| Tangible  | CLI 即時回傳 URIs / 摘要 / 鎖資訊 / 事件流 |
|| Transparent | 模式、治理區塊、版本號公開；內容可解壓 / 讀回 |
|| Trustworthy | Hash Lock + 版本鎖；鎖定後任何覆寫拋 `PermissionError` |

## ⚡ Superpowers 標籤規則 (超能力 7 階段追蹤)

由 `vps/junaikey/` 提供的 7 階段追蹤系統，串接 OA-Team 30 代理精神與 5T 協定。所有跨階段作業必須標註 `#superpowers:*` 標籤。

| 階段 | 標籤 | 落地對象 | 5T |
|------|------|---------|-----|
| brainstorming (腦力激盪) | `#superpowers:brainstorming` | `junaikey.sh superpowers brainstorming start` | Traceable+Trackable |
| worktrees (工作樹) | `#superpowers:worktrees` | 並行工作樹，多代理並行 | Traceable+Trackable |
| plans (規劃) | `#superpowers:plans` | 寫入規劃文件，子代理衍生 | Traceable+Trackable |
| subagent (子代理) | `#superpowers:subagent` | 子代理驅動開發 | Traceable+Trackable |
| tdd (測試驅動開發) | `#superpowers:tdd` | RED-GREEN-REFACTOR 閉環 | Traceable+Trustworthy |
| codereview (代碼審查) | `#superpowers:codereview` | PR 審查與簽核 | Traceable+Trustworthy |
| finish5t (完成 5T) | `#superpowers:finish5t` | 5T 閘關封，凍結證明 | Traceable+Trackable+Trustworthy |

### 自動化規則

```bash
# 啟動時自動初始化 (start-automation.sh 已內建)
vps/junaikey.sh superpowers brainstorming start --source=startup

# CI/CD 關卡封印 (ci.yml 已內建 finish5t)
node vps/junaikey.mjs trackSuperPowersStage finish5t done --source=ci-gate

# 查詢進度
vps/junaikey.sh superpowers-list

# 重置追蹤 (單純捨棄事務，不刪日誌)
vps/junaikey.sh superpowers-reset
```

### 5T 合規

| 5T 原則 | 落實方式 | 驗證機制 |
|---------|---------|---------|
| Traceable | 每筆 stage 錄入帶 `source_origin` + `source` | git pre-commit 強制檢查 |
| Trackable | OpenTelemetry 追蹤服務調用 + 日誌統一 | 分散式追蹤平台 |
| Tangible | CLI 即時回傳進度 + 鎖資訊 | 用戶回饋調查 |
| Transparent | 7 階段定義公開；`operations.mjs` 開源 | 零幻覺驗算通過 |
| Trustworthy | `Object.freeze()` 鎖定 + 4 階段升級 | 第三方審計驗證 |

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
