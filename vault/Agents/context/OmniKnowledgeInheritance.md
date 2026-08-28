---
source_origin: oa-dual-agent-obsidian + esggo-omni-center/soul-full.md §26.13
created: 2026-08-13
modified: 2026-08-27
sync: mirror
co_authors: []
lifecycle: active
tags: [second-brain, knowledge-avatar, inheritance, 5t, omni-swarm, metrics]
access: public-research
---

# 萬能知識分身 · 融會貫通傳承迭代

## 核心思想
結點孵化只是起點。真正的「強化正確知識學習」在於：
> **每日繼承前日記憶 → 當下湊齊最完整內容（正確+錯誤皆得）→ 瞬間投向本體 → 蜂寫層同步 → 次日再繼承**

形成**自迭代螺旋**：舊記憶不是靜態存檔，而是每日被重新讀取、重新吸收、重新投射。

## 七相傳承迴路（VPS cron avatar-daily.sh）

1. **Inherit 繼承**：`oa-memory-recall.mjs` 讀回前日知識分身狀態
2. **Hatch 孵化**：`knowledge-avatar.mjs` 掃新結點
3. **Write 寫入**：`tdai-memory-sync.mjs` 同步進 TencentDB 蜂寫層；失敗 retry 3 次
4. **Guard 防線**：`vault-access-guard.mjs` 憑證閘
5. **Clean 回歸**：`avatar-cleanup.mjs` 清測試型別
6. **Metrics 指標**：`avatar-metrics.mjs` 萃取健康度
7. **MOC 回流**：`avatar-moc-sync.mjs` 回寫 `00-Index.md` 知識分身日報

## 零時差保證
- 錯誤變體當下保留 → 對比學習
- 本體（`esggo/shared/types.ts`）經 `sync-vault-types.ts --apply` 即更新
- 蜂寫層（TencentDB）經 `/v3/conversation/add` 即寫入
- 讀取（OA 蜂群）經 `/v3/conversation/query` 即取用

## 實證（2026-08-27）

- VPS crontab 唯一項：`0 5 * * * /bin/bash /home/ubuntu/deploy-scripts/avatar-daily.sh`
- 2026-08-25：hatched=149 / synced=101 / recall=10 / failed=0
- 2026-08-26：hatched=149 / synced=101 / recall=8 / failed=0
- 2026-08-27：hatched=217 / synced=136 / recall=10 / failed=0
- 本地 dry run：hatched=234 / 正確 220 / 錯誤 14

## 健康度與邊界

- VPS 可達 `healthy=true` 的前提：Guard 通過、sync 成功、cleanup 通過
- 本地 `healthy=false` 屬預期邊界：
  - `[recall] ✗ fetch failed` 因為 8420 只在 VPS 內網
  - `tdai-sync` 的 `失敗樣本:` 只是樣本清單
- `avatar-metrics.mjs` 已把本地/VPS boundary noise 視為非真實故障

## ABC 三線 × 傳承

- A 持續孵化 = VPS cron 載體
- B 蜂寫層同步 = write + inherit 雙向
- C canonical 萃取 = hatch→sync 投向本體
- 傳承 = 七相螺旋自迭代，非一次性動作

## 相關文件

- 主典：`soul.md` §9 / §15 / §16 / §18
- 機制：`vault/Agents/context/OmniKnowledgeAvatar.md`
- 指標：`scripts/avatar-metrics.mjs`
- MOC：`vault/Agents/context/00-Index.md`
