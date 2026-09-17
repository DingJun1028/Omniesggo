# OmniTag + Trust Label — 文件索引

> 一站四份，覆蓋深度（說明書）/ 速度（cheatsheet）/ 提案（deck）/ 對外（README）

| 變體 | 路徑 | 行數 | 用途 |
|---|---|---|---|
| 完整說明書 | `docs/OMNITAG-TRUSTLABEL-USER-MANUAL.md` | 578 | 內部學習、深度閱讀 |
| 精簡 cheatsheet | `docs/OMNITAG-TRUSTLABEL-CHEATSHEET.md` | ~110 | 開發速查、A4 印出 |
| 提案簡報大綱 | `docs/OMNITAG-TRUSTLABEL-PROPOSAL-DECK.md` | 12 slides | 對內治理提案、評審 |
| 英文 README | `docs/OMNITAG-TRUSTLABEL-README.md` | ~180 | 對外開源、GitHub Pages |
| HTML 投影片 | `docs/OMNITAG-TRUSTLABEL-DECK.html` | 351 | 投影 / 列印 / GitHub Pages 直出 |
| 重生腳本 | `scripts/regen-omnitag-trustlabel-docs.sh` | 99 | 5T 閉環重生（vitest + bytes 校驗）|

## 公開連結

- 投影片（投影直出）：https://dingjun1028.github.io/esggo/OMNITAG-TRUSTLABEL-DECK.html
- 投影片提交 SHA：`6c43288`（gh-pages 分支，Pages source 切換至 `legacy` 模式）

## 變體派生規則

```
USER_MANUAL.md (zh-TW, 11 章)
   ├─ CHEATSHEET.md       ← 抽出 §1-§7 + 速查表
   ├─ PROPOSAL-DECK.md    ← 12 張 slide + 視覺規範
   └─ README.md (en)      ← 全文英譯 + 5T mapping 表格
```

## 重生指令

```bash
./scripts/regen-omnitag-trustlabel-docs.sh
```

