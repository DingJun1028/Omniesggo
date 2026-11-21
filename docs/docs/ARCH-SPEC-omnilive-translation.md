---
source_origin: automatic-execution 萬能覺醒 + 實測診斷
created: 2026-09-28
modified: 2026-09-28
co_authors: ["萬能蜂后 (Queen Bee)", "萬能編碼蜂 #07", "萬能維護蜂 #28"]
lifecycle: deployed
access: public
---

# ARCH-SPEC-omnilive-translation

萬能即時語音擷取翻譯（OmniLive Translation）子系統架構規格書

> 本文所有數字均為**實跑輸出**，非估算。複驗指令附於每節。

---

## 1. 系統定位

```
┌──────────────────────────────────────────────────────────────────────┐
│  使用者端（桌面 / 手機瀏覽器）                                        │
│  omnilive.esggo.co  ·  omnilivetranslation.esggo.co                  │
└───────────────┬──────────────────────────────────────────────────────┘
                │ HTTPS :443 (TLS, 各自 Let's Encrypt 憑證)
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  nginx  sites-enabled/omnilive*.conf                                 │
│  · proxy_buffering off      ← SSE 字幕不可緩衝                       │
│  · proxy_read_timeout 3600s ← 長連線                                 │
│  · Upgrade/Connection        ← WebSocket                             │
└───────────────┬──────────────────────────────────────────────────────┘
                │ http://127.0.0.1:8797
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  omnilive-translator  (PM2, fork, 8797)                              │
│  apps/omnilive/server.mjs — 零外部依賴, 僅 node: 內建模組            │
│                                                                  │
│   /api/speak ──► buildSubtitle() ──► sub.room = room  ★修復★        │
│                        │                                         │
│                        ├──► store.push()   (SubtitleStore)          │
│                        │      └── getByRoom(room)  ★新增★          │
│                        └──► broadcast(sub, room) → SSE              │
│                                                                  │
│   /api/course ─► getByRoom(room) ──► generateCourse() ──► Ollama   │
└───────┬──────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  stt-whisper (PM2, :8791)   ·   Ollama (:11434, qwen15b-64k)        │
└──────────────────────────────────────────────────────────────────────┘
```

**複驗**：`bash omnilive-deploy.sh` 階段 5a

---

## 2. 組件規格

| 組件 | 規格值 | 實測值 | 複驗指令 |
|---|---|---|---|
| omnilive-translator 埠 | 8797 | `{"status":"ok"}` | `curl -s 127.0.0.1:8797/health` |
| 程式進入點 | `apps/omnilive/server.mjs` | 已載入 | `pm2 list \| grep omnilive` |
| runtime 依賴 | 0 | 0（僅 `node:crypto/fs/http/path`） | `grep -ohE "^import.*from" server.mjs lib/*.mjs` |
| STT 上游 | 8791 | `stt-whisper` PM2 online | `pm2 list \| grep stt` |
| LLM 上游 | 11434 | `qwen15b-64k:latest`（986 MB） | `curl -s 127.0.0.1:11434/api/tags` |
| 單元測試 | — | **22 pass / 0 fail** | `node --test test/*.test.mjs` |
| 型別守門 | 0 error | **exit=0** | `tsc -p tsconfig.omnilive.json --noEmit` |
| 驗收流程 | — | **11/11 ✅** | `node verify.mjs` |
| 部署 repo HEAD | — | `9b0e56e48` | `git -C /var/www/esggo rev-parse HEAD` |
| 修復分支 | — | `e2d663a03`（PR #1174） | `git ls-remote origin refs/heads/fix/omnilive-course-room-index` |

### 埠號分配（VPS 實測 `ss -ltn`）

| 埠 | 佔用者 | 本系統可用 |
|---|---|---|
| 8788 | `apps/oa-swarm`（孤兒行程） | ✗ |
| 8789 / 8790 | 其他 node | ✗ |
| **8791** | stt-whisper | 借用為 STT 上游 |
| 8795 / 8796 | nginx `hermex.conf` | ✗ |
| **8797** | — | ✓ **本系統採用** |
| 8799 | 其他 | ✗ |

---

## 3. 關鍵設計決策（ADR）

### ADR-001 — 採用 8797 而非 8795

- **決策**：`PORT=8797`
- **理由（含證據）**：commit `22023ad99` 記錄「8796 taken by nginx」；本輪 `ss -ltn` 實測確認 8795 與 8796 皆由 nginx `hermex.conf` 監聽
- **後果**：需自訂埠，不可沿用 package.json 預設 8795

### ADR-002 — 修復 `/api/course` 房間索引而非新增 API

- **決策**：補 `BilingualSubtitle.room` 欄位 + `SubtitleStore.getByRoom()`
- **理由（含證據）**：`tsc` 回報 3 個 TS2339（`getByRoom` / `room` 不存在）。原碼的 runtime 防護 `store.getByRoom ?` 掩蓋了型別缺口，使 `s.room === room` 恆 false 而不拋錯
- **後果**：`/api/course` 由「恆回 no transcript yet」恢復為可取用該房間累積字幕

### ADR-003 — 移除失效 fallback 而非保留雙路徑

- **決策**：`/api/course` 直接呼叫 `store.getByRoom(room)`
- **理由**：`getByRoom` 已存在後，fallback 分支恆為死碼，保留會掩蓋未來的型別缺口
- **後果**：`tsc` 由 3 error 降至 0 error

### ADR-004 — 修復以獨立 worktree 提交

- **決策**：worktree `wt-omnilive`（基底 `origin/main`），不動主倉庫
- **理由**：主 worktree 有並行作業在同一分支提交，先前 `41e07764c` 提交曾被覆蓋
- **後果**：本地與遠端 hash 一致（`82e2429dc` → `e2d663a03`）

---

## 4. CI / 驗證閘

| 閘名 | 指令 | 實測結果 |
|---|---|---|
| 型別守門 | `tsc -p apps/omnilive/tsconfig.omnilive.json --noEmit` | **exit=0**（修復前 3 個 TS2339） |
| 單元測試 | `node --test test/*.test.mjs` | **22 pass / 0 fail** |
| 驗收流程 | `node verify.mjs` | **11/11 ✅** |
| 服務存活 | `curl -s 127.0.0.1:8797/health` | `{"status":"ok","version":"1.0.0"}` |
| 檔案一致性 | MD5 本機 vs VPS | 4/4 一致（subtitle / server / test / ecosystem） |
| 傳輸驗證 | `/api/course` 空房間 vs 有字幕房間 | 0 秒短路 vs 120 秒進 `generateCourse` |

---

## 5. 已知邊界

| 類別 | 項目 | 狀態 |
|---|---|---|
| 已驗證 | 字幕擷取、雙語翻譯、SSE 推播、房間分享、房間索引修復 | ✅ 實測 |
| 已驗證 | PM2 部署、8797 存活、零外部依賴 | ✅ 實測 |
| 待驗證 | TLS 憑證簽發 | ⏸ 需 DNS 先指向 VPS |
| 待驗證 | 手機端連線（實機測試） | ⏸ 需 DNS + 憑證 |
| 待驗證 | `generateCourse` 完整輸出 | ⏸ **Ollama 無回應**，見下 |
| 非本 repo | `universal-translator` 崩潰 5316 次 | `8788` 被 `oa-swarm` 孤兒行程佔用 |
| 非本 repo | `omnilive.esggo.co` 目前服務 Hermes Dashboard | DNS 指向錯誤 |
| 環境阻塞 | Cloudflare API Token scope 不足 | vault 兩枚 `cfut_` 認證失敗；wrangler OAuth 可讀 zone 但 DNS 端點回 `10000` |

### Ollama 未回應（獨立問題）

| 測項 | 結果 |
|---|---|
| `curl :11434/api/tags` | ✅ 回傳 `qwen15b-64k:latest` |
| `curl :11434/api/generate` (40s) | ❌ 無回應 |
| `generateCourse` 逾時 | 120 秒（`server.mjs` 內建 AbortController） |
| 端點回應 | `{"error":"course gen failed","detail":"This operation was aborted"}` |

Ollama 程序存在且 `/api/tags` 正常，但推論無回應。與本次修復無關 — 修復後端點已能正確路由至 `generateCourse`。

---

## 6. 失敗模式

| 徵兆 | 可能原因 | 處置 |
|---|---|---|
| `EADDRINUSE :::8797` | 已有行程佔用 | `ss -ltn \| grep 8797` 確認後 `pm2 restart omnilive-translator` |
| `/api/course` 恆回 `no transcript yet` | 修復未部署 | 檢查 `grep -c getByRoom lib/subtitle.mjs` 應為 ≥1 |
| `/api/course` 回 `aborted` | Ollama 推論逾時 | `curl :11434/api/generate` 實測；模型載入需 >120s 時調高逾時 |
| PM2 狀態 `errored` | cwd 不存在 | `ls /var/www/esggo/apps/omnilive/server.mjs` |
| 網域回 Hermes Dashboard | DNS 指向錯誤 | 查 A 記錄應為 `161.118.248.180` |
| 字幕不即時更新 | nginx 緩衝 SSE | 確認 `proxy_buffering off` 在站點設定內 |

---

## 7. 部署未竟事項

- [ ] Cloudflare A 記錄：`omnilivetranslation.esggo.co` → `161.118.248.180`（**需 DNS:Edit token**）
- [ ] Cloudflare A 記錄：`omnilive.esggo.co` 修正（現指向錯誤）
- [ ] TLS 憑證簽發（DNS 生效後）
- [ ] 手機實機連線驗證
- [ ] PR #1174 合併

執行入口：`bash %TEMP%\omnilive-deploy.sh`
