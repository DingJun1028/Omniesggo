# High-Tech Seaweed B2B 官網

基於 Vue 3 + Vite 建置的永續海洋資源解決方案網站

## 技術規格

- **框架**: Vue 3 + Vite
- **語言**: TypeScript + CSS
- **風格**: 深藍 + 暖金 簡約設計
- **部署**: Vercel (預設) + 本地預覽
- **5T 合規**: Traceable / Trackable / Tangible / Transparent / Trustworthy

## 開發環境

```bash
# 安裝依賴
pnpm install

# 開發模式
pnpm dev

# 建置
pnpm build

# 預覽建置結果
pnpm preview
```

## 部署

### Vercel 部署

1. 前往 Vercel  dashboard 新增專案
2. 選擇本倉庫
3. 點擊部署

### 本地 Docker 部署

```bash
# 建置 Docker 映像
docker build -t htb-b2b -f apps/htb-b2b/Dockerfile .

# 執行容器
docker run -p 80:80 htb-b2b
```

## 目錄結構

```
apps/htb-b2b/
├── src/
│   ├── assets/
│   │   └── styles.css      # 全局樣式
│   ├── components/         # 可重用組件
│   │   ├── SolutionCard.vue
│   │   └── TechCard.vue
│   ├── pages/              # 頁面組件
│   ├── App.vue             # 主應用組件
│   └── main.js             # 入口文件
├── public/                 # 靜態資源
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 品牌色系 (HSB Color Palette)

| 色彩 | HEX | 用途 |
|------|-----|------|
| 深海藍綠 | #073B4C | Header、深色背景 |
| 海洋青綠 | #159A9C | 連結、圖表 |
| 海門冬珊瑚紅 | #C64B3C | CTA、重點數字 |
| 牧草綠 | #5F8463 | 自然、次要狀態 |
| 海砂米白 | #F4F1E8 | 柔和背景 |
| 科技藍 | #2878B5 | 數據、MRV圖表 |
| 證據金 | #AE7B24 | 送審中、階段標示 |
| 深墨灰 | #172A32 | 正文、深色區 |

## HTB CHECKLIST 對應

- [x] H01-H10 首頁結構（骨架）
- [x] P01-P18 網站地圖路由
- [x] 7 大共用元件 C01-C15（骨架）
- [x] 5T 合規驗證機制
- [ ] 醒目值 F01-F18（待高科確認）
- [ ] 內容填寫（Phase 0 資料治理）
- [ ] 影像資產（符合 WebP/AVIF 規格）

## 5T 驗證標籤

所有腳本、組件與資產均符合：
- **Traceable**: source_origin 標籤
- **Trackable**: 生命週期檔案
- **Tangible**: 可感知的 UI/UX
- **Transparent**: 無幻覺驗算
- **Trustworthy**: Hash Lock + Object.freeze()

## 授權

© 2026 高科生技股份有限公司
All rights reserved.