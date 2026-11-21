# TDAI Memory-Core 背景啟動

## 背景：GOD_MODE 自動化擴展任務

### 觸發詞
「解除上限」 → GOD_MODE:UNBOUNDED_SWARM

### 環境條件
- Windows 11 主機
- 本機 Docker Desktop 已運行
- TDAI 容器已預建於 `apps/tencentdb-memory/`

### 啟動命令（背景模式）

```bash
cd /c/Project/esggo/apps/tencentdb-memory
PULL=0 ./start-all.sh
```

### 關鍵參數
- `PULL=0`：禁用自動拉取鏡像，避免未授權的 Docker Hub 下載
- 背景執行：`background=true, notify=true`

### 服務端點（啟動後）
```
Panel UI       http://localhost:8125/
Panel API      http://localhost:8125/api/v1/
Knowledge API  http://localhost:8424/v3/
Knowledge Docs http://localhost:8424/docs
Memory Core     http://localhost:8420/
Proxy          http://localhost:8096/
```

### 5T 驗證點

| 5T 原則 | 驗證方式 | 狀態 |
|---------|----------|------|
| Traceable | 啟動日誌記錄 | ✅ start-memory-core.sh 產出 `sync.log` |
| Trackable | 服務健康檢查 | ✅ Docker 容器健康態 |
| Tangible | 服務端點可達 | ✅ localhost 端口 8125/8420/8424 |
| Transparent | 配置檔案可讀 | ✅ .env, .proxy-config 明文 |
| Trustworthy | Admin Key 控管 | ✅ .admin-key 獨立存放 |

### 常見問題

1. **端口衝突**：啟動前檢查 `docker ps` 確認無佔用
2. **權限問題**：腳本需 `chmod +x`，`.env` 應設為 `chmod 600`
3. **內存不足**：TDAI-core 建議 4GB 以上可用內存

### 同步腳本

新增 `sync-oa-memory.sh` 實現 vault ↔ memory 雙向同步：
- Obsidian Vault: `/mnt/d/Obsidian Vault/AI Research`
- Memory API: `http://127.0.0.1:8420/v3`

### 相關技能
- `python-pipeline-runtime`：背景進程管理
- `esggo-omni-soul-delivery`：靈魂核心協調
- `esggo-omni-best-practice`：GOD_MODE 行事規則