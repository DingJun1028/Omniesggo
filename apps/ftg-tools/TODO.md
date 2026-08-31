# FTG Tools — MECE 最佳實踐審計 TODO

> 依 `mece-best-practices-audit` 技能做 7 支柱審計，接地於 `apps/ftg-tools/` 實際程式碼。
> 審計日期：2026-08-14 ｜ 範圍：`ftg-gen.js` + `ftg-mcp/server.js` + `fal-images.js` + 測試

## 1. 正確性 / Correctness
- ✅ 路徑 bug 修復：輸出 `dir` 恆 `esggo/apps/ftg-{ver}` (f3be3c64e)
- ✅ deploy 前檢查本地產出存在 (server.js deploy)
- ✅ **CLI 層版本號白名單 `safeVer`**：防路徑穿越 + HTML 注入，`<script>` 自動回退 2.7 (強化輪, ftg-gen.test.mjs 驗證)
- ✅ **`esc()` 實作 HTML 轉義**：title/lede 等動態內容轉義 (強化輪)

## 2. 安全 / Security
- ✅ server.js 命令注入防護 (safeVer/safeHost/safeUser 白名單)
- ✅ SSH key 抽 env (FTG_SSH_KEY / FTG_VPS_HOST / FTG_VPS_USER)
- ✅ CLI 層 `safeVer` 雙重防護 (強化輪)
- ✅ **FAL_API_KEY 管理**：`.env.example` 範本 + `.env` 進 gitignore (本輪, 真值不進庫)

## 3. 可維護性 / Maintainability
- ✅ server.js 嚴格模式 + 函數分離
- ✅ package.json test script
- ✅ **THEMES 抽成 `themes.json`**：midjourney 主題已加，新增免改程式碼 (強化輪)

## 4. 效能 / Performance
- N/A — 單頁生成 <500ms，無瓶頸

## 5. 可擴充性 / Extensibility
- ✅ 路徑 C (FAL API) 已接：`fal-images.js` 透過 FAL REST API 生成主題圖，無 key/失敗優雅回退本地 (d2c16f72e)
- ✅ 主題擴充：`themes.json` 含 stitch-dark / light / midjourney
- 🔲 多語擴充：lang 只 zh/en，未做 i18n 字典檔

## 6. 可觀測性 / Observability
- ✅ MCP server 啟動寫 stderr `[ftg-mcp] stdio server ready`
- ✅ **結構化錯誤日誌**：`logErr(ctx, e)` 寫 `[ftg-mcp][err] <ctx> :: <msg>` (強化輪)

## 7. 測試 / Testing
- ✅ 最小冒煙測試：server.test.mjs (3) + fal-images.test.mjs (2) + ftg-gen.test.mjs (2) = **7 測試全過**
- ✅ `node --test` 7/7 passed
- ✅ **CI 整合**：`ci.yml` 的 `ut-tests` job 加 `ftg-tools` working-directory 跑 `node --test` (含 ftg-gen.test.mjs)，與本機一致 (本輪)

---

## 本輪強化總結 (待 push)
1. **安全/正確性**：CLI `safeVer` 白名單 + `esc()` 轉義 (ftg-gen.test.mjs 2 測試)
2. **可維護性**：THEMES → themes.json (midjourney 擴充)
3. **可觀測性**：server.js `logErr` 結構化錯誤日誌

## 外部阻礙 (🔒)
- 🔒 Hermes MCP 註冊：`~/.hermes/config.yaml` 寫入被保護檔案阻擋，需使用者手動或授權
- 🔒 FAL_API_KEY 實際金鑰：路徑 C 邏輯已接，但無 key 時回退本地（本輪末以無 key 模式驗證回退）
