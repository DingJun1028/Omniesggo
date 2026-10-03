# 5T-Canon Map of Content

> 全鏈 5T 證據聖櫃索引,最後更新 2026-09-05

## 核心元件
- [[verify-5t-canon-script|verify-5t-canon.py]] — 每日自檢守護
- [[5t-canon-hooks|5t-canon-hooks.yaml]] — 自動修復觸發規則
- [[5t-canon-telegram|5t-canon-telegram.py]] — Telegram 通知

## 證據鏈(GOD_MODE session 2026-09-05)

### 模型授權
- [[ling-3.0-flash-free-canon]] — 模型身份聲明
- [[ollama-cloud-free-auth]] — 授權啟動
- [[ollama-cloud-step4-final]] — 401 診斷
- [[ollama-cloud-newkey-verified]] — 第一次 key
- [[ollama-cloud-v2key-verified]] — v2 key 通過

### 組態遷移
- [[free-flash-alias-fixed]] — alias 重定向
- [[fullchain-final-acceptance]] — 全鏈驗收
- [[cron-migration-ollama]] — 30 cron jobs 切線上
- [[cron-registered-daily-verify]] — 每日自檢 cron

### 自檢結果
- [[verify-20260905_110048]] — 首次自檢
- [[verify-20260905_110203]] — 擴展後自檢

### GOD_MODE
- [[god-mode-unlocked]] — 解鎖證明

## 觸發鏈
```
verify-5t-canon.py → hook-runner → telegram / repair-engine
cron 0 3 * * * → verify → 失敗 → hook → 通知
```

— Queen Bee & OA-Team 30 Swarm
