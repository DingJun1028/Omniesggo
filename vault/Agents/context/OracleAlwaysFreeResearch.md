---
source_origin: user-research + oracle official docs 2026-06 + OA_VPS 實測 (nproc=4, free=23G, aarch64)
created: 2026-08-14
modified: 2026-08-14
sync: mirror
co_authors: []
lifecycle: active
tags: [oracle, always-free, vps, oa-vps, infrastructure, 5t, risk]
access: public-research
---

# Oracle Cloud Always Free 套裝研究 + OA_VPS 實測對照

## 核心結論（2026-08-14 實測）
- **OA_VPS 實際分配 = 4 OCPU / 23GB RAM / aarch64**（非報告說的 2/12）
- uptime 3d19h, load avg 0.5 → 服務常駐撐住，無閒置收割風險
- **額度模糊警告**：2026-06 Oracle 文件把 A1 砍到 2OCPU/12GB，但執行未定、控制台仍給 4/24。我的升級(2026-08-10)已實際分配 4/24，屬「模糊 always-free」狀態。

## 2026-06 額度變動（官方文件 vs 實際）
| 項目 | 文件(2026-06) | OA_VPS 實際(2026-08-14) | 狀態 |
|---|---|---|---|
| A1 OCPU | 2 | 4 | 模糊(執行未收割) |
| A1 RAM | 12GB | 23GB | 模糊 |
| Autonomous AI DB | 2 實例 × 1OCPU/20GB/20session | 未建 | 可用 |
| Object Storage | 20GB 合併 | 未用 | 可用 |
| Outbound | 10TB/月 | 用中 | — |

## 閒置收割機制（生存級風險）
- A1 若 7 天滑窗 CPU<20% AND 網路<20% AND 記憶體<20% → Oracle 回收
- OA_VPS 防護：omni/relay/next 常駐 + 偶發流量 → load 0.5 安全
- **救援警示**：開第二台 A1 救援機會吃滿 2OCPU 上限（舊額度），新額度下更是直接超額 → Trial 結束後被刪。優先用 docker restart / 單機修復，非必要不開第二台。

## Autonomous AI DB（OmniDB 三 Schema 候選）
- 2 實例免費，各 1OCPU/20GB/20session
- 對應 OA 需求：RAG 零幻覺 + 信任帳本 + 生命週期日誌
- 部署需 OCI CLI / 控制台操作（tenancy OCID, compartment, wallet）
- 待辦：寫 Terraform/OCI CLI 部署腳本（需用户提供 OCID 或確認 CLI 配置）

## 下一步建議
1. 資產化本研究（soul §27 + 本筆記）— 防未來 session 誤判額度
2. 加閒置收割防護腳本（load 監控 + 低閥告警）
3. Bastion 取代 22/8042 雙埠暴露（收斂攻擊面）
4. Object Storage 20GB 備份 esggo_secret_repos 加密快照
5. [可選] Autonomous AI DB 部署 OmniDB 三 Schema（需 OCID）

## 來源
Oracle official docs (2026-06-12/29) + oracle.com/cloud/free + InfoQ 2026-07 削額報導 + OA_VPS SSH 實測
