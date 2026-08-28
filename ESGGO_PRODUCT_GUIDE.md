# ESGGO 平台產品說明頁

> 全域永續策略平台 · Environmental, Social, Governance Global Operations
> 所屬計畫：2026 Berkeley International Sustainable Strategy Talent Cultivation Program
> 技術靈魂：OA-Team 30 萬能蜂群（5T 協定 · 4 可 1 不可）
> 文件生成：2026-08-12

---

## 一、平台定位

ESGGO 是 ESG 永續策略技術生態系，由三大線上陣列組成：

| 陣列 | 網址 | 功能定位 | 實測狀態 (2026-08-12) |
|---|---|---|---|
| 主站 / 永續戰情中心 | esggo.co | 平台總入口、ESG 儀表板、Hub | ⚠️ 502 Bad Gateway (origin 離線) |
| 學習中心 (柏克萊課程) | esggo-learning-center.web.app | 學員資源、作業上傳、課程回放、諮詢預約、滿意度調查 | ❌ 連線逾時 |
| 墾趣旅遊 FTG TOURS | ftg.esggo.co | ESG 戶外健康企業旅遊品牌站 | ✅ 正常線上 (DOM 完整) |

---

## 二、技術架構

```
ESGGO 生態系
├── esggo (monorepo)        # 主倉庫 · 共享類型與腳本 · pnpm
├── esggo-vps/              # VPS 部署 (Ubuntu 22.04, Nginx, PM2)
│   └── 161.118.252.147     # 主機 IP · esggo.co / ftg.esggo.co
└── esggo-learning-center/  # Firebase + React 學習平台
    ├── Vite 6 + React 18 + Tailwind 3
    ├── Firebase 10 (Firestore + Auth)
    └── 雙重部署：Firebase Hosting + Vercel
```

技術棧：Vite 6 / React 18 / Tailwind 3 / Firebase 10 / Vitest 4 / ESLint 9
部署流水線：GitHub Actions (main 推送 → CI → deploy-vercel + deploy-firebase 雙通道)
國際化：zh-TW (預設) / zh-CN / en

---

## 三、學習中心六大模組

1. 學員資源區 — 課程資源與官方連結統一入口
2. 作業上傳 — 學員提交作業並附檔 (base64 嵌入 Firestore，單檔 < 700KB)
3. 課程回放 — 影片觀看與管理
4. 諮詢預約 — Calendly 線上諮詢預約 (含 /admin 管理視角)
5. 提問提交 — 向 Mentor 提交問題，TA 配對機制
6. 滿意度調查 — 每週調查問卷

認證機制：匿名登入 (預設) → Google OAuth 升級 → Admin 密碼備援 (/admin 視角)

---

## 四、FTG TOURS 六大企業方案

1. 企業員工旅遊
2. 企業家庭日
3. ESG Outdoor Team Day
4. Employee Wellbeing Retreat
5. 高階主管共識營
6. ESG Impact Note (HR/ESG/品牌部皆可用的成果素材)

ESG 三大理念：🌲 環境友善 (低碳交通、無痕山林、生態保育、垃圾減量) / 🤝 社會共益 (在地採購、部落文化尊重、地方餐桌、社區合作) / 📊 企業治理 (安全 SOP、體能分級、成果報告、Impact Note)

品牌主文案：台灣最懂戶外健康與永續行動的旅行解方品牌，提供企業員工旅遊、家庭日、ESG Team Day、Employee Wellbeing Retreat、ESG Impact Note 等客製方案。

聯絡：02 8512 3099 / hello@ftgtours.com / 台北市中山區

---

## 五、部署與運維

| 通道 | 觸發 | 目標 |
|---|---|---|
| Vercel | main 推送經 CI | 學習中心 production |
| Firebase Hosting | main 推送經 CI | 學習中心 + Firestore rules |
| VPS (Docker/Nginx) | 手動 deploy.sh | esggo.co 主站 + ftg.esggo.co |

VPS：Ubuntu 22.04 LTS / Nginx / PM2 / Node 20；SSL certbot (esggo.co · ftg.esggo.co，效期至 2026-10-20)
Nginx 路由：/ → SPA，/api/ → 127.0.0.1:3000，/ftg/ → /var/www/ftg-tours

---

## 六、實測狀態總結 (誠實報告)

| 驗證項 | 結果 |
|---|---|
| esggo.co 可訪問 | ❌ FAIL (Cloudflare 502，origin 161.118.252.147 經探測回 504/timeout 離線) |
| esggo-learning-center.web.app 可訪問 | ❌ FAIL (連線逾時) |
| ftg.esggo.co 可訪問 + 內容完整 | ✅ PASS |
| 技術架構描述 | ✅ 來自專案技能書 (可溯源) |
| 真實畫面影像 | ⚠️ 僅 FTG 有 DOM 證實；主站/學習中心無即時影像 |

---

## 七、品牌與 ESG 價值映射

| 品牌 | 定位 | ESG 對應 |
|---|---|---|
| ESGGO 主站 | 永續策略技術樞紐 | Governance (平台治理、5T 可溯源) |
| 學習中心 | 柏克萊人才培育 | Social (教育平權、國際化包容) |
| FTG TOURS | ESG 戶外健康旅遊 | E 環境 / S 社會 / G 治理 |

---

> 生成時間：2026-08-12｜團隊：OA-Team 30 萬能蜂群｜狀態：產品說明頁完成 · 主站/學習中心離線待修 · FTG 線上確認
