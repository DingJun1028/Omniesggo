# Ch.08 熵減煉金與重構

> 每週熵減 3%，產物不可帶病上線。

## 煉金節奏

| 週期 | 行為 |
|---|---|
| 每日 | 跑 `pnpm test`，觀察失敗率 |
| 每週 | `git diff --stat` 檢視 debt |
| 每月 | 重跑 `tsc --noEmit`，確認 strict 乾淨 |

## 快手刀

- `pnpm test --silent` 看收尾 20 行
- `pnpm vitest run <subset>` 只跑可疑測試
- `git status --short` 確認乾淨再 push

## 驗收

- [ ] 測試 100% 或已標記 `skip` 原因
- [ ] `pnpm test` exit 0
- [ ] 無未授權的 `.env` 或憑證變更
