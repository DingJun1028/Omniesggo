# MECE.md

## 支柱地圖

| 支柱 | 對應章節 | 負責陣列 |
|---|---|---|
| 5T 協議 | Ch.01 | 25-30 |
| VPS 部署 | Ch.02 | 13-18 |
| HMAC 守門 | Ch.03 | 25-30 |
| Zenrows | Ch.04 | 07-12 |
| Health | Ch.05 | 07-12 |
| n8n | Ch.06 | 19-24 |
| OmniTag | Ch.07 | 25-30 |
| 熵減 | Ch.08 | 19-24 |
| 治理 | Ch.09 | 01-06 |
| 結界 | Ch.10 | 01-06 |

## 生命週期缺口分析

- `draft`：章節草稿，未經 test 驗證
- `active`：經 `pnpm test` 綠 + 線上 `/api/health` 200
- `frozen`：Hash Lock 刻印，禁止修改
- `archived`：舊版備份，僅供查閱
