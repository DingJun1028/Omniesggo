# OmniFactory 萬能工廠 — 驅動核心

對齊 `wiki/wiki/萬能工廠.md` 的 P1–P7 生產流水線 + 5T 品質閘門，**讀取 Wiki/ReadMe 自動組裝並通過 5T 閘門佈署最佳實踐 APP**。

## 架構

```
原料層 (Ω 四族, wiki/wiki/)
  萬能函數 / 萬能元件 / 萬能主題 / 萬能符文
        │
        ▼
驅動核心 (本目錄 assemble.mjs)
   P1 需求解析 → P2 函數選配 → P3 元件拼裝
   → P4 主題套用 → P5 符文標記 → P6 5T 閘門 → P7 代理封印
        │
        ▼
產出層
   萬能模組 (wiki/wiki/萬能模組-註冊表.md) + hashLock (R-SEAL 符文)
        │
        ▼
自動佈署 (對接現有 CD)
   .github/workflows/deploy.yml (Vercel)
   deploy-oracle.yml (Oracle VPS, bastion/direct/skip)
```

## 使用

```bash
cd apps/omni-factory
node assemble.mjs                    # 內建範例 ModuleSpec 走完整流程
node assemble.mjs --spec my-spec.json   # 自訂 ModuleSpec
```

## 5T 品質閘門 (P6)

| 閘門 | 檢查點 | 退件條件 |
|------|--------|----------|
| T1 真 | 數值/單位/時間戳 | 契約缺失 |
| T2 善 | 來源標記 | 無四族原料引用 |
| T3 美 | 稽核軌跡 | 無 buildTrace |
| T4 信 | hash_lock | 可被篡改 |
| T5 通 | 第三方可驗算 | hashLock 重算不符 |

## 零依賴

`node` 原生 `fs` / `crypto` / `path`，對齊 esggo ESM 慣例 (`"type":"module"`)。

## 自動佈署機制

`assemble.mjs` 通過 5T 閘門後，印出對接現有 CD 的指令（**不自動 push**，避免越權）：
- Vercel: `gh workflow run deploy.yml`
- Oracle VPS: 合併 main 後 `deploy-oracle.yml` 自動觸發
