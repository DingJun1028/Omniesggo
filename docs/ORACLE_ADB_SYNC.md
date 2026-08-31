# Oracle Always Free ADB 三 Schema 同步閉環

> 本文件記錄 OmniUserRAG Autonomous DB 的防回收 + 三 Schema 同步實作狀態。
> 對應 Vercel build OOM 修復（a91b4db13）後的 OA-Team 第二大腦持久化基礎建設。

## 資源清冊
- **ADB**: OmniUserRAG (`ocid1.autonomousdatabase.oc1.ap-singapore-1.anzwsljrkl3rykyabhb7gbnyoywlteaxfsnnjh43h6smzoz6maja5nvvzioa`)
- **狀態**: AVAILABLE (實測 2026-08-14)
- **連線**: `omniurag_high` (TCPS, 免 wallet thin 模式)
- **憑證**: VPS `~/adb_pw.txt` (chmod 600, 不含於 git)
- **Wallet**: VPS `~/wallet/` (cwallet.sso + tnsnames.ora)

## A 項：防回收喚醒（已完成）
- 腳本: `/opt/esggo/scripts/omni-adb-keepalive.py`
- 機制: 每月 1 號 03:00 cron，OCI SDK 檢查 ADB 狀態，STOPPED 則 START
- 實測: 2026-08-14 跑出 `AVAILABLE (skip)` 確認有效

## B 項：三 Schema 同步閉環（已完成）
- 腳本: `/opt/esggo/scripts/omni-adb-sync.py` (thin 模式, 免 Oracle Client 庫)
- 數據源: VPS `/opt/esggo/vault/Agents/context/.avatar-registry.json` (138 分身) + `00-Index.md` (MOC)

### 三 Schema 定義
| Schema | 對映 | 內容 |
|---|---|---|
| `OMNI_KNOWLEDGE_INHERITANCE` | 知識傳承本體 | soul-canon / 5T 協定種子 |
| `OMNI_AVATAR_REGISTRY` | 分身註冊表 | 對映 `.avatar-registry.json` (avatar_id, node, type, source_file, correct, variant, absorbed, projected_to_ontology) |
| `OMNI_MOC_INDEX` | 知識地圖結點 | 對映 `00-Index.md` 的 `[[wikilink]]` |

### 同步實證 (2026-08-14)
```
[omni-adb-sync] CONNECTED_OK
[omni-adb-sync] SCHEMA_READY (3 tables)
[omni-adb-sync] AVATARS_SYNCED=101
[omni-adb-sync] MOC_SYNCED=10
[omni-adb-sync] SYNC_VERIFIED

讀回驗證:
  OMNI_KNOWLEDGE_INHERITANCE: 2 rows
  OMNI_AVATAR_REGISTRY: 101 rows
  OMNI_MOC_INDEX: 10 rows
```

### 自動化
- VPS cron `10 3 * * *` 每日執行 `omni-adb-sync.py` → 知識資產每日自動進 ADB
- 與 `avatar-daily.sh` (05:00 孵化) 錯開，確保當日最新分身已落地再同步

## 安全注意
- ADB 密碼僅存 VPS `~/adb_pw.txt`，不進 git
- Wallet 僅 VPS 本地，不傳本機
- 連線走 TCPS + wallet，不暴露於公網
- 本機無法直連 ADB（需 VPS 中轉），符合最小暴露原則

## 批次記錄
- `1376bbb69` — omni-adb-keepalive.py (防回收)
- `a91b4db13` — Vercel build OOM 修復 (NODE_OPTIONS=3072)
- `c329f7abb` / `7e673dce5` — omni-adb-sync.py 地基 (OMNI_KNOWLEDGE_INHERITANCE)
- `39f6cf3c2` / `086d4c225` — 三 Schema 同步閉環 (AVATAR_REGISTRY + MOC_INDEX)
