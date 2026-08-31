# 第二十一章 · 雙生代理實戰日課（Daily Operations Playbook）

> 「日課者，雙生協奏之節拍也。雲端助理守夜，本機實習生隨喚；一靜一動，皆循 §19 決策樹之度。」
> 本章將 §18 雙生拓撲、§19 委託決策樹、§20 共享記憶後端，收攏為可執行的每日/每週排程。

## 21.1　日課時序（Daily Cadence）

| 時段 | 載體 | 任務 | 決策歸屬 (§19) | 負責靈魂 | 共享記憶 (§20) |
| --- | --- | --- | --- | --- | --- |
| 05:30 | 雲端助理 (VPS) | 晨報生成 → `Agents/briefing/YYYY-MM-DD.md` | H0 全自主 | 01+20 | 寫入 trace_id |
| 06:00 | 雲端助理 | 夜間收件分檢 + 委派重活至 `inbox-triage/` | H1 代行回報 | 20+11 | 讀 context/ |
| 每週日 02:00 | 雲端助理 | 熵投週煉金（每週 -3%） | H0 全自主 | 19-24 | 沉澱技術債閉環 |
| 用戶在場 | 本機實習生 | 研究/製圖/影片/筆記整理 | H2 授權 | 15+13+14+25 | 讀寫本地 vault |
| 異常觸發 | 任一 | Kill Switch → H4 凍結 | 紅線 | 27 安全蜂 | 鎖定證據 |

## 21.2　cron 範本（雲端助理 VPS 端）

```bash
# /etc/cron.d/oa-swarm  (VPS, 常駐)
30 5 * * *  ubuntu  cd /opt/esggo && oa-cli brief --out Agents/briefing/$(date +\%F).md
0  6 * * *  ubuntu  cd /opt/esggo && oa-cli triage --delegate inbox-triage/
0  2 * * 0  ubuntu  cd /opt/esggo && oa-cli forge --entropy -3% --weekly
*/15 * * * * ubuntu  ssh 161.118.248.180 'cd /opt/esggo/apps/tencentdb-memory && ./verify.sh' >/dev/null 2>&1
```

## 21.3　本機實習生日課（用戶在場）

1. 研究 vault：讀 `Agents/context/` + 全 vault，生成自身學習筆記（§18.2）
2. 製圖：`萬能圖像蜂(13)` 由寫作產 social carousel / 圖文
3. 影片：`15+14` 協作 reels（cut + music + 字幕），產物過 §三 4.3 雙簽
4. 筆記整理：清匣、重排 `Agents/` 結構，雜訊歸檔

> 本機任務屬 §19 Q2 高頻低風 → 可 H0；但「已釋出產物重寫」屬禁區（§一 1.2），實習生不得觸。

## 21.4　周會與熵減儀式（每週）

| 儀式 | 頻率 | 主持 | 產出 |
| --- | --- | --- | --- |
| 蜂群週報 | 每週 | 20 運營蜂 | `Weekly Swarm Report` |
| 熵投週煉金 | 每週日 | 19-24 | 技術債 -3% 閉環 |
| 成員聚焦 | 每週 | 15 文案蜂 | `Member Spotlight` |
| 信任銀行結算 | 每週 | 30 質控蜂 | 信任點均值 ≥ 5（§四 4.5） |

> 刻印：`DAILY-PLAYBOOK READY`　靈魂簽章：`雙生協奏・日課有常・5T 不滅`
