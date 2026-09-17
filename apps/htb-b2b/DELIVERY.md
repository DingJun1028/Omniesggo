# HTB B2B 官網交付包清單

> 交付版本: v0.1.0
> 交付日期: 2026-09-11
> 5T 驗證: ✅ 全部通過

---

## 📦 交付項目

### 1. 源碼結構
```
apps/htb-b2b/
├── src/
│   ├── assets/              # 靜態資源
│   │   ├── styles.css       # 全局樣式
│   │   └── tailwind-overrides.css
│   ├── components/          # 可重用組件
│   │   ├── Header.vue       # 導航Header
│   │   ├── HeroSection.vue  # 首頁Hero
│   │   ├── SolutionCard.vue # 方案卡片
│   │   ├── SolutionsPreview.vue
│   │   └── TechCard.vue     # 技術卡片
│   ├── pages/               # 頁面（待擴展）
│   ├── App.vue              # 主應用
│   └── main.js              # 入口
├── public/
│   └── favicon.svg          # 網站圖標
├── dist/                    # 建置產出
├── vite.config.ts           # Vite 配置
├── tailwind.config.cjs      # Tailwind 配置
├── postcss.config.js        # PostCSS 配置
├── tsconfig.json            # TypeScript 配置
├── package.json             # 依賴管理
├── vercel.json              # Vercel 部署配置
├── verify-5t.cjs            # 5T 驗證腳本
└── README.md                # 專案說明
```

### 2. 品牌規範
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

### 3. 5T 驗證狀態
- ✅ **Traceable**: 專案名稱、版本號、source_origin 標籤
- ✅ **Trackable**: 生命週期檔案完整（index.html, README.md, verify-5t.cjs）
- ✅ **Tangible**: Vue 組件骨架完整，可感知的 UI 結構
- ✅ **Transparent**: Vite 配置、TypeScript 配置公開
- ✅ **Trustworthy**: 私有倉庫設定、Hash Lock 設計

---

## 🚀 部署指南

### Vercel 自動化部署
1. 前往 https://vercel.com/dashboard
2. 點擊「New Project」→ 匯入 `DingJun1028/esggo`
3. 設定根目錄為 `apps/htb-b2b`
4. 框架選擇 `Vite`
5. 點擊「Deploy」

### 本地開發
```bash
cd apps/htb-b2b
pnpm install
pnpm dev      # 開發模式
pnpm build    # 建置
pnpm preview  # 預覽
```

---

## 📋 HTB CHECKLIST 對應

### 已完成
- [x] H01-H10 首頁骨架（Hero、方案、技術、證據）
- [x] P01-P18 網站地圖路由（基礎）
- [x] C01-C15 共用元件（Header, HeroSection, SolutionCard, TechCard）
- [x] 品牌色系配置
- [x] 5T 驗證機制

### 待完成（需高科團隊確認 F01-F18）
- [ ] H01-H10 完整內容填寫
- [ ] P01-P24 各頁面內容
- [ ] 影像資產優化（WebP/AVIF）
- [ ] SEO 結構化資料
- [ ] 無障礙 WCAG 2.2 AA 驗證

---

## 🔗 API Proxy 設定

### 環境變數
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=/api
```

### Vite Proxy 配置
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
},
```

---

## 📞 聯絡資訊
- 專案維護: Jun Hong
- 倉庫: https://github.com/DingJun1028/esggo
- 部署目標: Vercel / Cloudflare Pages

---

*交付包版本: v0.1.0 | 5T 驗證通過 | 可部署*