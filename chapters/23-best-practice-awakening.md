---
chapter: 23
title: "最佳實蹤覺（Best-Practice Awakening）"
source_skill: "automatic-execution v1.5.0"
related_skills: ["esggo-best-practice-execution", "oa-best-practice-enlightenment"]
tags: [5T, 熵減, 結界, OA-Team]
---

# 23 · 最佳實蹤覺（Best-Practice Awakening）

> 定義：系統/代理/流程覺醒後，預設狀態即為經驗證最佳實踐，不是啟動後再修補。
>
> 三條硬規則：**預設即合規**（啟動即符合基準）· **不帶病上線**（已知問題啟動前解決）· **醒著就頂標**（運行指標持續達標）。

## 1. 五大面向

| 面向 | 原則 |
|------|------|
| 結界 | 無作妙德 → 自動遵守，圓通無礙 → 通路通暢，永恆覺醒 → 不後補 |
| 5T | Traceable / Trackable / Tangible / Transparent / Trustworthy 作為基線 |
| 4 可 1 不可 | 可自理/協作/演化/溯源 + 不可篡改 = 預置契約 |
| 熵減 | 啟動前 entropy < 0.1，否則建構 entropy 記錄 |
| 30 魂 | 每 agent 啟動即符合角色規範，結界擴散 |

## 2. 可執行清單

```bash
# 啟動門檻（全綠）
[ ] VPS Running  # OCI Console
[ ] SSH 通       # ssh -i <key> ubuntu@161.118.248.180
[ ] /health 200  # curl ...:3000/health
[ ] entropy < 0.1
[ ] CI 全綠     # pnpm lint && typecheck && vitest run
```

## 3. 地雷 / Pitfalls

| 陷阱 | 現象 | 規避 |
|------|------|------|
| VPS OOM | SSH 凍結 | RAM < 4G 限模型 ≤ 2GB |
| cron 舊 IP | 狀態 failure | 更新 prompts + resume |
| CI 警報 | lint/ESLint | 先掃再推 PR |

## 4. 驗證

```bash
# soul.md 檢核
grep -n "最佳實蹤覺" C:\Project\esggo\soul.md
# cron 驗證
cronjob list | grep OmniTag
# CI 驗證
pnpm lint && pnpm typecheck && pnpm vitest run
```

## 5. 相關章節

- Ch.02 VPS 部署與 pm2 管理（啟動門檻與 OOM 解鎖 SOP）
- Ch.03 Webhook HMAC 守門（認證與權限驗證）
- Ch.05 Next.js Health + Metrics（健康檢查與指標觀測）
- Ch.07 OmniTag 標籤契約（合規標籤與 CI 強制）
- Ch.08 熵減煉金與重構（熵值控制與債務清理）
- Ch.09 Kill Switch 與治理（紅線觸發與凍結機制）
- Ch.10 結界誓約（聖典封印與終始頌）
- Ch.24 最佳實踐矩陣（MECE 矩陣與啟動 checklist）

## 6. 跨組協作

| 陣列 | 職責 |
|------|------|
| 1-6（策略組） | 制定覺醒標準、結界宣告 |
| 7-12（技術組） | 實作健康檢查與指標儀表 |
| 13-18（創意組） | 可視化覺醒狀態 |
| 19-24（營銷組） | 追蹤覺醒 ROI |
| 25-30（守衛組） | 驗證 5T 合規、強制執行 |
