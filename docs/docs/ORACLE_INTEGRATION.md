# Oracle Always Free 對接說明

本文件說明如何在 **不破坏免費層** 的前提下，把 Oracle Autonomous AI Database Always Free 放進前端資料流。

## 前端行為

- `.env` 加入 `VITE_USE_ORACLE`、`VITE_ORACLE_API_BASE`
- 後端 proxy 存在時，Admin 匯出 / 處理紀錄可走 proxy；其餘流程不變

## 系統架構圖

```mermaid
flowchart LR
    %% 前端層
    subgraph Frontend[前端 — Vite + React]
      direction TB
      A[Admin 匯出/處理紀錄頁面]
      B[VITE_USE_ORACLE]
      C[VITE_ORACLE_API_BASE]
      D[Firebase Hosting]
    end

    %% 後端 proxy
    subgraph Proxy[後端 Proxy — 建議規格]
      direction TB
      P_HEALTH[GET /health]
      P_EXPORTS[POST /exports\nbody: { records, locale? }]
    end

    %% 資料層
    subgraph DataLayer[資料層]
      direction TB
      F[Firestore]
      O[Oracle Autonomous DB\n(Always Free)]
    end

    %% 流程
    A -->|有 proxy| B
    B -->|true| C
    C --> D
    D --> P_EXPORTS
    D -->|一般流程| F

    P_EXPORTS -->|寫入/讀取| O
    P_EXPORTS --> P_HEALTH
    P_HEALTH -->|健康檢查| D

    %% 安全性提示
    note1[不要把 OCI 帳號/密碼/wallet 放到前端]
    note2[無 proxy 時請設 VITE_USE_ORACLE=false]

    D -.-> note2
    O -.-> note1
```

## 後端 proxy 建議規格

```
GET  /health
POST /exports      body: { records, locale? }
```

 proxy 必須負責：
1. 接收前端送來的 record payload
2. 寫入 / 讀取 Oracle schema
3. 回傳 status + data

## 注意

- 不要把 OCI 帳號、密碼、wallet 放到前端任何檔案
- 若無 proxy，請將 `VITE_USE_ORACLE=false`
