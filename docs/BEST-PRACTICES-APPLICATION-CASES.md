# 🌐 最佳實踐應用案例 — OAuth / API Key 周轉流程

> 場景：開發者需要取得並使用一個新的 API key，並在多個環境中安全地管理它。
> 目標：展現如何將 §1-§12 的最佳實踐落地到真實工作流中。

---

## 案例一：新增 API Key（開發者自助流程）

### 步驟 1：確認密碼屬性
```bash
# 從 secret-vault 查詢
grep "^NCBDB_API_TOKEN" secret-vault/ENV20230818.env
```
預期輸出：`NCBDB_API_TOKEN=*** MASKED ***`（或占位符）

### 步驟 2：刻意新增新金鑰
```bash
# 1. 建立環境變數（僅在當前 shell 中，不寫入檔案）
export NEW_API_KEY=$(openssl rand -hex 32)

# 2. 加入 secret-vault 配置
cat >> secret-vault/ENV20230818.env << EOF
# 新增：自訂 API key
NEW_API_KEY=*** MASKED ***
EOF

# 3. 設定權限
chmod 600 secret-vault/ENV20230818.env
```

### 步驟 3：驗證存取
```bash
# 透過統一函數存取
python -c "from omni_master_key import omni_get_secret; print(omni_get_secret('NEW_API_KEY'))"
```
預期輸出：
```
Found: True
Source: secret-vault
Masked Value: *** MASKED ***
```

### 步驟 4：環境變數載入
```bash
# 在 .env.local 加入
echo "NEW_API_KEY=*** MASKED ***" >> .env.local
chmod 600 .env.local
```

### 步驟 5：終端機清理
```bash
# 先執行
unset NEW_API_KEY
# 確認
echo $NEW_API_KEY  # 應無輸出
```

---

## 案例二：金鑰輪替（90 天自動輪替）

### 週期性檢查（每日）
```bash
# 1. 讀取當前輪替狀態
grep "NEW_API_KEY" secret-vault/ENV20230818.env

# 2. 若超過 90 天，執行輪替
if [ "$(date -d "$(date) - 90 days" +%s)" -lt "$(date +%s)" ]; then
  # 生成新金鑰
  NEW_KEY=$(openssl rand -hex 32)

  # 更新配置
  sed -i "s/^NEW_API_KEY=.*/NEW_API_KEY=*** MASKED ***/" secret-vault/ENV20230818.env

  # 通知開發者
  echo "🔄 NEW_API_KEY 已輪替。請在 .env.local 更新並重新載入。"
fi
```

### 輪替驗證
- 校驗新金鑰可存取 API
- 校驗舊金鑰失效
- 安全日誌記錄輪替事件

---

## 案例三：跨代理存取（Agent-Reach）

### 設定
```bash
# 在 Agent-Reach 專案目錄
cat > .env << EOF
NCBDB_API_TOKEN=*** MASKED ***
NEW_API_KEY=*** MASKED ***
EOF
chmod 600 .env
```

### 執行 OCR 工具
```python
# 从 ocr_tool.py
from ocr_tool import OCRTool

tool = OCRTool(tesseract_cmd="C:\\Program Files\\Tesseract-OCR\\tesseract.exe")
result = tool.recognize("test.png", lang="chi_tra+eng")
print(result)
```

### 驗證
- Agent-Reach 無法直接輸出真實金鑰
- 僅在審計日誌中記錄存取事件

---

## 案例四：安全事故處理

### 情境：終端機輸出真實金鑰
```bash
# 錯誤操作
echo $NEW_API_KEY  # 輸出真實值
```

### 糾正流程
1. 執行 `history -c` 清除 shell history
2. 掃描 `secret-vault/`、`.env*`、`.github/` 目錄
3. 確認無真實值殘留
4. 寫入教訓記錄（`.security-lesson-20261102.md`）
5. 輪替所有已暴露金鑰
6. 將教訓寫入 `OMNISKILL_BOOK.md` §3.7

---

## 應用總結

| 最佳實踐 | 應用場景 | 驗證方式 |
|---|---|---|
| 不硬編碼 | 新增金鑰時只寫入 `*** MASKED ***` | `grep -rn` 掃描 |
| 環境變數 | 開發時讀取 `.env.local` | `source .env.local` |
| 機密聖櫃 | 生產權限 600 | `stat secret-vault/ENV20230818.env` |
| 統一存取 | `omni_get_secret()` | 函數測試 |
| MASKED 輸出 | 所有 API 鍵值查詢 | 輸出遮罩 |
| 權限控制 | 600 檔案權限 | `ls -l` |
| 出口清理 | 程式結束時清理 | 輸出變數判斷 |
| 安全教訓 | 事件後立即記錄 | 檔案存在性檢查 |
