# GOD_MODE 自主執行模式

## 觸發詞

- **「解除上限」** → GOD_MODE:UNBOUNDED_SWARM
- **「下一步/繼續」** → 自動推進至下一階段

## 執行原則

### 1. 5T 治理鋼鐵
```
5T 透明 > 順從
```
- 若用戶貼訊息與當前 git 狀態不符
- 必用真實工具 (git, curl, docker) 驗證
- 誠實回報差異，絕不侃虛

### 2. 自主決策流程

```
觸發詞 → 分析任務屬性 → 決定技術路徑 → 實施 → 驗證 → 報告
```

### 3. 驗證閉環

每次執行後必產出：
- 實測證明 (工具輸出)
- 5T 驗證結果
- 下一步建議

## 任務模式

### PWA 相關
- 用 `write_file` 生成 sw.js
- 用 `python3` 生成 PNG Icon
- 用 `curl` 驗證 HTTP 狀態

### TDAI 相關
- 用 `docker` 測試容器健康
- 用 `ssh` 驗證 VPS 端點
- 用 `curl` 檢查 API 響應

### 5T 測試
```bash
pnpm test      # TESTS_PASS
pnpm typecheck # TYPECHECK_PASS
```

## 常見指令

```bash
# TDAI 啟動
cd /c/Project/esggo/apps/tencentdb-memory && PULL=0 ./start-all.sh

# PWA 驗證
ssh -i ~/.ssh/esggo_vps_fix esggo-vps "curl -sfI http://127.0.0.1:8795/icon-512.png"

# 5T 測試
pnpm test && pnpm typecheck
```

## 失敗處理

1. **工具失敗**：立即嘗試替代方案
2. **環境問題**：報告具體錯誤代碼
3. **驗證失敗**：回溯並修復根本原因

## 典型執行序列

1. `nginx Host header 修復` → config 測試 → 服務重載
2. `PWA 部署` → sw.js 擴展 → Icon 生成 → CDN 緩存
3. `TDAI 啟動` → Docker 啟動 → 端口驗證 → Health check
4. `5T 驗證` → 測試數據 → entropy 測試 → 完成報告