# PDF Decoder Skill

## 功能說明
此技能用於修復 PDF 解析過程中出現的文字亂碼問題，確保 ESG GO 系統中的 PDF 實證資料能被正確解碼。

## 使用時機
- PDF 解析結果出現亂碼（如 UTF‑8/UTF‑16/Latin1 編碼混用）
- 需要修復多語言 PDF 文字（中文、日文、特殊符號等）
- 系統回報「文字提取失敗」或返回空白字串

## 操作流程

### 1. 解碼 PDF
```bash
node cli/omni.mjs pdf decode <evidence_id>
```

### 2. 修復亂碼
```bash
node cli/omni.mjs pdf fix <evidence_id>
```

### 3. 驗證結果
```bash
node cli/omni.mjs pdf verify <evidence_id>
```

## 技術細節

### 修復原則
- 先檢測 PDF 標頭（`%PDF`）確保文件格式正確
- 嘗試多種編碼（UTF‑8、UTF‑16LE、Latin1）進行轉換
- 使用 `iconv-lite` 處理不同語系的編碼問題
- 最終回傳合法的 Unicode 字串

### 依賴套件
```bash
npm install iconv-lite
```

### 程式碼位置
- 修復函式：`lib/sonar/core/pdf-fix.ts`
- 使用範例：`lib/sonar/core/pdf-parser.ts`

## 錯誤處理

### 常見錯誤
- **無法解析 PDF**：確認檔案格式正確，非圖片型 PDF
- **編碼失敗**：檔案可能加密或損壞，需人工介入
- **空白結果**：嘗試重新解析或更換編碼方式

### 除錯步驟
1. 檢查 PDF 標頭：`hexdump -C file.pdf | head -1`
2. 測試解碼：`node scripts/test-pdf-encoding.js <file>`
3. 查看日誌：`node cli/omni.mjs logs --tail 20`