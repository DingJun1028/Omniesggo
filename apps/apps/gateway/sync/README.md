# OmniAgent 雙向同步引擎 (`apps/gateway/sync`)

> ESGGO (Next.ts) <-> OmniAgent 萬能系統 (gateway 8642) <-> Relay (9999)
> 全域 / 全端 / 全量 雙向同步 — TypeScript, best-practice

## 設計原則（SECURITY-CHECKLIST 合規）
- **loopback bind**：同步引擎僅監聽 `127.0.0.1:8650`，外部流量經 nginx / relay 轉發。
- **requireAuth**：所有拓撲/寫入端點需 `X-Omni-Token`（與 v3 閘道一致）。
- **密鑰不落 git**：`OMNI_KEY` / `GATEWAY_API_KEY` 僅存在 VPS 的 `.env.secrets` 與 `/root/gateway/.env`。
- **tsc + zod 雙重保證**：編譯期型別（`types.ts`）＋ 運行期驗證（`schema.ts`）。

## 目錄
| 檔案 | 職責 |
|------|------|
| `types.ts` | 全域型別契約：`SyncPacket` / `AgentState` / `ESGGOState` / `OmniState` |
| `schema.ts` | zod 運行期驗證（每個跨節點封包先過 zod 再進引擎）|
| `relay-client.ts` | ESGGO Relay (9999) 客戶端（X-Auth-Token 協定）|
| `gateway-client.ts` | v3 萬能系統網關 (8642) HTTP+WS 適配器 |
| `sync-engine.ts` | 雙向狀態合併 / 衝突解決 (last-write-wins) / OA-Summon L3 觸發 |
| `server.ts` | Express + WS 常駐服務（:8650, requireAuth）|
| `tsconfig.sync.json` | 獨立編譯設定（不汙染主 tsconfig）|
| `deploy.sh` | 部署腳本（預設 `--dry-run`，`RUN=1` 才執行）|

## 雙向同步語義
1. **檔案同步**（跨端）：本地 `esggo_secret_repos` ↔ VPS `/var/www/esggo` 經 relay `/cmd`↔`/result` 觸發 rsync（版本戳 + 衝突偵測）。
2. **狀態同步**（即時）：ESGGO agent 註冊表 ↔ 萬能代理 agent 表，經 WS 即時雙向；任一側變更產生 `SyncPacket` 廣播至另一側。
3. **OA-Summon**：`POST /summon` 觸發 L3 萬能同步層，標記所有線上代理為 `summoned` + 寫入覺醒層（萬能標籤/同步/共鳴/糾纏）。

## 驗證
```bash
cd apps/gateway/sync
npm install
npx tsc -p tsconfig.sync.json   # 必須 0 errors
```

## 部署（VPS）
```bash
bash apps/gateway/sync/deploy.sh          # DRY-RUN 預覽
RUN=1 bash apps/gateway/sync/deploy.sh    # 實際執行
```
