# Oracle Always-Free 基礎設施盤點（OA-Team 30 靈魂簽核基準）

> 來源：pasted text #14（資源狀態清單 + 簽核摘要），2026-08-21 收錄。
> 用途：OA-Team 雙蜂隊基礎設施定位與 30/30 靈魂簽核的事實基準。

## 資源清單（真實 OCID）

| 資源 | 狀態 | 真實 OCID |
|---|---|---|
| esggo-vps (A1.Flex 24GB) | RUNNING, keep-alive active | ocid1.instance.oc1.ap-singapore-1.anzwsljrkl3rykyc4fggmvq6kezm65dkzzj5nboi3ihax2qxtxyjnxvrpxza |
| oa-worker-01 (A1.Flex 6GB) | RUNNING, keep-alive active* | ocid1.instance.oc1.ap-singapore-1.anzwsljrkl3rykycadmrhyujj7adnd4wpcqchyfm4mepkoigsood5pzd7wha |
| esggo-af-adb-2 | AVAILABLE | ocid1.autonomousdatabase.oc1.ap-singapore-1.anzwsljrkl3rykycar5t3t... |
| esggo-af-reserved-ip-2 | RESERVED | 161.118.240.93 |
| esggo-af-block-50g | AVAILABLE | ocid1.volume.oc1.ap-singapore-1.abzwsljrjpcfcrb4vxzokfqab6ld... |
| esggo-af-lb | ACTIVE | ocid1.loadbalancer.oc1.ap-singapore-1.aaaa76nsig656q... |

*註：oa-worker-01 狀態清單標記 keep-alive active，但分身側（esggo_original 私鑰）實測 SSH 仍 Permission denied。
此項為「使用者側聲稱 active」，未經分身親驗，列為 29/30 誠實缺口。

## 簽核摘要（來源清單原述）

- Soul 30 (QA): Both ARM have keep-alive + crontab
- Soul 06 (Opti-bee): exponential backoff deployed
- Soul 20 (Ops-bee): AMD retry in final phase (poll 21/200)
- Final AMD capacity check in 30s. Deliverable: oracle_always_free_setup.sh fully verified & patched.
- Still active: amd_retry.log background polling.
- Status: 29/30 Souls signed-off | AMD watcher pending.
- Ready to report once AMD flips to success or completes 200 attempts.

## 實測勘誤（分身側 2026-08-21 補註）

- AMD 實例 esggo-af-amd-01 已於第 35 次重試成功 RUNNING（OCID: ocid1.instance.oc1.ap-singapore-1.anzwsljrkl3rykyco5sv2phjmioldlmvcp5q2ee5nah2ud6xn7xo3eif7p6a）。
- oa-worker-01 序列控制台自動化路徑經 8+ 輪實測證實不可行（OCI 代理拒絕所有自動化 key），僅 OCI 網頁終端可注入。
- 最終誠實狀態：資源層 30/30 全齊；驗證層 29/30（oa-worker-01 keepalive 未經分身親驗）。
