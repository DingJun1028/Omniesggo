# 5T 驗證記錄 — 2026-09-27

> 對應 commit：`9750def16` `68724e831` `ff54ef74e`
> 驗證者：萬能分身（omni-best-practice Stage 7）
> 原則：**只記錄有真實工具輸出佐證的項目**；未過項目標記 ⛔ 不以推論填補。

## Traceable — 產出可溯源

```
9750def16  fix(universal-translator): 修正 context 污染留存與具名房間無法重置
68724e831  fix(ftg-journey-server): JWT 金鑰改為 fail-fast，消除靜默預設值 fallback
ff54ef74e  fix(ftg-journey-server): 兩份 ecosystem 設定檔改為由環境變數注入 JWT 金鑰
```

- source_origin：`omni-best-practice` 覺醒通典（2026-09-27 session）
- 變更檔案：`apps/universal-translator/{context_buffer,server}.mjs`、
  `apps/ftg-journey-server/server.js`、`ecosystem.config.js`、
  `apps/ftg-journey-server/ecosystem.config.cjs`、`scripts/ftg-jwt-rotate.sh`

## Trackable — 生命週期可追蹤

- PM2 重啟記錄：`universal-translator` pid 3917471 → 3961271（`--update-env`）
- 健康端點統計：`{"status":"ok","version":"1.7.0","stats":{"calls":1,"errors":0}}`
- 負向測試記錄：舊預設金鑰 → `exit 1`（拒絕啟動）

## Tangible — 可感知交付

| 產出 | 驗證方式 | 結果 |
|---|---|---|
| OmniLiveTranslation 線上服務 | `curl https://omnitranslation.esggo.co/health` | HTTP 200, v1.7.0 |
| 首頁 UI | `curl -I https://omnitranslation.esggo.co/` | HTTP 200, 顯示 `v1.7.0` |
| context 清洗 | `node scripts/_test_context_sanitize.mjs` | **8 passed / 0 failed** |
| JWT fail-fast | 4 情境實測 | 3 拒絕 + 1 正常啟動 |
| 輪換腳本 | `bash -n scripts/ftg-jwt-rotate.sh` | 語法通過 |

## Transparent — 邏輯公開

- `server.js:15-33` — 金鑰封鎖清單與拒絕啟動理由直接寫在原始碼
- `context_buffer.mjs` — `sanitizeText()` 清洗規則為明文
- 端點對照表已封存至技能 `esggo-omni-universal-translator`

## Trustworthy — 不可篡改

- 硬編碼金鑰已從工作樹移除（全 repo grep 驗證：僅剩刻意的封鎖清單引用）
- 新金鑰設計為 **VPS 端生成**，不經任何會記錄的管道

## ⛔ 未過項（明示，不偽造）

| 項目 | 狀態 | 原因 |
|---|---|---|
| 實際金鑰輪換 | **未執行** | Hermes 桌面端核准機制攔截 4 次，客戶端無法回應 |
| `oa-swarm` 修復 | **未執行** | 同上；根因已定位：interpreter args 誤設 + 8788 埠衝突 |
| git 歷史金鑰清除 | **未執行** | 破壞性操作，需確認單人維護後另行決定 |
| CI 綠燈 | **未驗證** | 未執行 |

## 服務對照（釐正先前誤報）

| 網址 | 實際服務 | 狀態 |
|---|---|---|
| `omnitranslation.esggo.co` | **OmniLiveTranslation** v1.7.0 | ✅ 本輪部署目標 |
| `omnilive.esggo.co` | **Hermex**（Hermes Agent Dashboard） | ⚠️ 先前誤列為 OmniLive，已撤回 |
| `aistation.esggo.co` | AI Station | 根路 200，無 `/health` 路由 |

> 命名慣例：對外產品名 = **OmniLiveTranslation**；repo 內部路徑 = `apps/universal-translator`。
> 佐證：`scripts/omnitranslation-dns.sh:4`
