# 校正後知識庫 (Corrected Knowledge Base)

> 本目錄存放經 `skill_view` 載入、與權威來源交叉比對後的校正知識。
> **CRITICAL RULE**：永不直接引述貼上的參考原文；先 diff 對照權威 skill library，標記 ⚠ 錯誤後再寫入。

## 目錄結構

```
references/
├── README.md                      # 本文件
├── 5t-protocol-verification.md    # 5T 協定 Python/TS 雙語驗證筆記
├── omnitag-contract-spec.md       # OmniTag 標籤契約規格（經 CI 驗證）
├── vps-deployment-checklist.md    # VPS 部署驗證清單（含 OOM 解鎖）
├── hmac-auth-patterns.md          # HMAC 認證模式（Ch.03 校正版）
└── s2s-hub-architecture.md        # s2s × HUB 語音架構圖
```

## 校正規則

1. **Diff 優先**：任何外部參考必先 `skill_view` 對照權威來源
2. **標記錯誤**：發現差異時標記 ⚠ 並說明偏差原因
3. **版本標註**：每條知識標注 `source_skill` + `verified_at`
4. **不可篡改**：寫入後 Hash Lock，`Object.freeze()`

## 最近校正紀錄

| 日期 | 項目 | 校正內容 |
|------|------|----------|
| 2026-09-05 | Ch.23 孤島修補 | 新增 Ch.23/Ch.24 索引至 README/INDEX/MECE |
| 2026-09-05 | MECE 支柱地圖 | 補「覺醒」「矩陣」兩支柱 |
| 2026-09-05 | best-practice-items.md | 濃縮為 Ch.24 章節，納入正式導覽 |
| 2026-09-05 | references/ + templates/ | 建立校正後知識庫與章節模板 |
