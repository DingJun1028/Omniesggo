# Ch.24 專用 grep 規格（已修版，2026-11-15）

> 依據 `esggo-omni-center/soul.md` §30.4 訂定。原「app/**/route.ts」僅覆蓋 root `app/` 下的 route，
> 對 `src/app/**` 完全視而不見（第 2 階路徑盲區）。本版補足 `src/app/**/route.ts`，兩者其一命中即計入 Ch.24 範圍。
>
> 終極準繩：**無路徑限定的 `git grep` 全庫掃描** — 而非任何單一 `**` 模式。

## 掃描模式

```bash
# 路徑合併：任一命中即計入 Ch.24 範圍
git grep -l -- 'pattern' -- \
  'app/**/route.ts' \
  'src/app/**/route.ts'
# 若要含通配符正確展開，改用：
git grep -l -- 'pattern' -- ':*/route.ts'
```

## 洩漏樣式（全庫正則，應用於所有路徑）

- HTTP 回應層本體洩漏：`error: (error|err|e) instanceof Error ? … .message`；
- 其餘類型的洩漏：`console.log(/warn|info|debug/i)` 掃描；
- 校驗以全庫正則結果為準，不以任一個 `**` 模式為準。

## 結果（2026-11-15 實測）

| 項目 | 實測值 | 註記 |
|---|---|---|
| `app/**/route.ts` 專用掃描 | 2 處 | 僅 root `app/` 框架路由 |
| 完整 `git grep` 全庫掃描 | 13 處 | **含 `src/app/api/**` 那 10 處（為刻意保留）** |
| 最終有效洩漏 | 3 處 | 其餘 10 處為精心保留（登記於 soul.md §30.4 殘留登記） |
| 修正後覆蓋 | 13 處 | 與全庫正則掃描一致 |

## 記憶點

- 量測規格的射程盲區，比缺陷數量更重要。
- 修 error leak 時必補 `console.error`，留日誌；不進回應本體。
