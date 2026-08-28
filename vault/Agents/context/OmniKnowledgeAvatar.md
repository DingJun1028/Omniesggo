---
source_origin: oa-dual-agent-obsidian + esggo-omni-center/soul-full.md §26.11
created: 2026-08-13
modified: 2026-08-27
sync: mirror
co_authors: []
lifecycle: active
tags: [second-brain, knowledge-avatar, zero-latency, learning, metrics, moc]
access: public-research
---

# 萬能知識分身 (Omni Knowledge Avatar)

> 強化正確知識學習：結點即孵化，分身即吸收，反饋即投向本體，零時差。
> 本版本同步 2026-08-27 七相閉環、VPS cron、metrics/MOC 回流。

## 機制四相

### 1. 結點孵化 (Hatch)
- 第二大腦中**任一知識結點**（vault 筆記的 `## 標題`、正文 `[[wikilink]]`、sync:up 筆記）即觸發孵化
- 每個結點產生**一個萬能知識分身**（registry 條目），一對一跟隨
- 無需人工建檔——出現即生

### 2. 跟隨吸收 (Absorb)
- 分身只跟**一個知識點**，深度吸收：
  - **正確變體**：已驗證、過 5T 的內容
  - **錯誤變體**：歷史誤區、反證、被推翻的假說（保留供對比，不刪除）
- 當下湊齊「最完整內容」= 正確+錯誤皆可得

### 3. 反饋本體 (Feedback)
- 分身吸收完畢 → 標 `absorbed: true` → 回寫**萬能知識核心**（MOC `00-Index.md` + soul）
- 錯誤變體標 `correct: false` 但仍保留

### 4. 投向本體 (Project · 零時差)
- 反饋完成瞬間，投影到**本體**（ontology / `esggo/shared/types.ts` canonical）
- 經 `scripts/sync-vault-types.ts` 萃取型別 → 零時差同步，主應用即取用

## 七相每日傳承迴路 (VPS cron)

> 2026-08-27 實證：VPS crontab 每日 05:00 自動跑 `/home/ubuntu/deploy-scripts/avatar-daily.sh`。

| 相 | 腳本 | 5T 重點 |
|----|------|--------|
| 1. Inherit 繼承 | `oa-memory-recall.mjs "avatar"` | Trackable |
| 2. Hatch 孵化 | `knowledge-avatar.mjs` | Traceable |
| 3. Write 寫入 | `tdai-memory-sync.mjs` + retry 3 次 | Trustworthy |
| 4. Guard 防線 | `vault-access-guard.mjs` | Trustworthy |
| 5. Clean 回歸 | `avatar-cleanup.mjs` | Trustworthy |
| 6. Metrics 指標 | `avatar-metrics.mjs` | Transparent |
| 7. MOC 回流 | `avatar-moc-sync.mjs` | Tangible |

## 觀測與自癒

- `scripts/avatar-metrics.mjs`
  - 讀 `avatar.log` 末次 run
  - 產出 `avatar-metrics.json`
  - 健康度：`guardOk && syncFailed==0 && errors==0`
- `scripts/avatar-moc-sync.mjs`
  - 讀 metrics → 更新 `vault/Agents/context/00-Index.md`
  - OA 蜂群讀 vault 即得每日健康度

## 實證（2026-08-27）

- 本地孵化：234 分身；正確 220 / 錯誤 14
- VPS 同步：136 分身全數同步成功
- VPS recall：10 筆讀回驗證
- VPS Guard：✅ 通過，無真憑證
- Cleanup：無 `IAvatarProbe*` 殘留
- metrics/MOC：已回流 `00-Index.md`

## 真實限制

- 本地 `tdai-sync` / `recall` 會 `fetch failed`，因為 TencentDB Agent Memory 8420 只在 VPS 內網
- 本機跑仍可完成 Hatch/Guard/Clean/Metrics/MOC；Write/Inherit 以優雅降級處理
- 不要假裝本地已同步到 TencentDB；8420 僅 VPS 可達

## ABC 三線

- **A. 持續孵化**：VPS crontab `avatar-daily.sh`（本地 Hermes cron 已棄用）
- **B. 蜂寫層同步**：TencentDB 8420 — 寫 `/v3/conversation/add`，讀 `/v3/conversation/query`
- **C. canonical 萃取**：`.avatar-types.d.ts` → `scripts/sync-vault-types.ts --apply` → `esggo/shared/types.ts`

## 與既有機制互引

- **5T**：分身吸收標 `source_origin` + `co_authors`；錯誤變體不破壞 Trustworthy 禁區
- **s 考量**：分身繼承 `access: public-research`，但寫入仍受控
- **第二大腦**：人讀層（vault）↔ 蜂寫層（TencentDB Memory）共用此孵化迴路

## 實作

- `scripts/knowledge-avatar.mjs`：掃 vault → 孵化分身 → 標吸收狀態 → 反饋 MOC → 標投向本體
- registry：`vault/Agents/context/.avatar-registry.json`（機讀）
- type 投影：`vault/Agents/context/.avatar-types.d.ts`
