# source_origin: AI Station §12 - Global Incremental Upgrade Landing Doc

## 全域增量升級 (Global Incremental Upgrade) — 實作紀錄

本文件對應 `soul.md §12` 與 `aistation` 技能書的「全域增量升級」指令：
把 §12 增量優化架構從「僅單元測試」落地為「編排層真正呼叫的可驗證程式碼」。

### 1. 缺口 (Gap)
重構前，`src/cli.py` 的 `create_app()` 直接呼叫 `brand / dna / visuals`，
**完全沒有**使用 `src/incremental/` 下的 §12 模組
（`optimizer` / `patterns` / `gate` / `delivery`）。
§12 架構雖有單元測試，卻未接入真實管線。

### 2. 解法 (Fix)
新增 `src/pipeline.py`（`AistationPipeline`），作為 §12 全域落地點：

- `IncrementalOutputOptimizer.optimize()` — 分塊 (chunk) → §18 5T hash-lock 縫合 → 分頁 (paginate)
- `verify_and_seal()` — 每個請求加蓋 §18 不可篡改印記 (Trustworthy)
- `ServiceOrchestrator` — 頁偏移追蹤 (Trackable)

`src/cli.py` 新增端點：

- `POST /v1/generate/inc` — 經 §12 管線產出 5T 密封 + 增量分頁結果

### 3. 5T 對齊 (5T Alignment)
| 原則 | 實作 |
| --- | --- |
| Traceable | 每工件帶 `source_origin = "aistation:pipeline"` |
| Trackable | `request_id` + 頁偏移紀錄 |
| Tangible | 回應分頁 (page_size=10, 有界) |
| Transparent | §18 hash-lock 與 TS / 根層同構 (可驗算) |
| Trustworthy | `verify_and_seal` 凍結工件 (Object.freeze 縫合) |

### 4. 測試 (Verification)
- `tests/test_pipeline.py` — 3 例：5T 密封 / 增量分頁 / 空腳本優雅處理
- `tests/test_cli.py::test_v1_generate_inc_returns_5t_sealed_incremental` — 端點合約
- 全測試套件：`pytest` 48 例全綠 (stdlib §12 25 + 整合 23)

### 5. 執行 (Run)
```bash
cd apps/aistation
python -m pytest -q          # 全綠
python -c "from src.pipeline import build_pipeline; print(build_pipeline().run('【場景】x')['hash_lock'])"
```
