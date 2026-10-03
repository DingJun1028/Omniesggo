# Skill: omnibase-global-healing

# OmniBase 全域痊癒 — ESG GO v5 功能完善與架構重構

> **目標**: 確保 ESG GO 平台 v5 所有功能100%運作，採用乾淨架構，遵循全域準則。
> **狀態**: 規劃階段 → 執行階段

---

## 📋 現行架構摘要 (Current Architecture Summary)

### 前端 (Frontend)
| 檔案 | 狀態 | 行數 | 說明 |
|------|------|------|------|
| `app/sustain-write/v5/page.tsx` | ✅ 存在 | 616 | 主要 v5 頁面，OmniBase 風格 |
| `app/sustain-write/v5/AsyncSustainWrite.tsx` | ❌ **不存在** | — | 需新建非同步組件 |

### 後端 API
| 檔案 | 狀態 | 行數 | 說明 |
|------|------|------|------|
| `app/api/sustain-write/v5/route.ts` | ✅ 存在 | 40 | GET=公司列表, POST=同步報告 |
| `app/api/sustain-write/v5/async/route.ts` | ✅ 存在 | 47 | POST=啟動非同步任務, GET=狀態查詢 |
| `app/api/sustain-write/v5/progress/[taskId]/route.ts` | ⚠️ 待確認 | — | 進度查詢 API |
| `app/api/sustain-write/v5/evidence/route.ts` | ⚠️ 待確認 | — | 佐證資料 API |
| `app/api/sustain-write/v5/download/route.ts` | ⚠️ 待確認 | — | 下載 API |
| `app/api/sustain-write/v5/preview/route.ts` | ⚠️ 待確認 | — | 預覽 API |

### 核心服務 (Core Services)
| 檔案 | 行數 | 說明 |
|------|------|------|
| `src/core/services/async-task-manager.ts` | 530 | 非同步任務管理 (Redis 增強) |
| `src/core/services/report-generator-v5.ts` | — | 報告生成器 |
| `src/core/services/report-generator-v5-full.ts` | — | 完整報告生成器 |
| `src/core/services/async-report-engine.ts` | — | 非同步報告引擎 |

---

## 🏗️ 重構階段 (Refactoring Phases)

### Phase 1: 基礎設施完善 (Infrastructure)
- [ ] 1.1 確認 Redis 連線穩定性 (`@lib/redis`)
- [ ] 1.2 確認 AGNES API 連線 (`@/lib/agnes-api`)
- [ ] 1.3 確認 Firebase Admin 連線 (`@/lib/firebase-admin`)
- [ ] 1.4 建立 health check endpoint `/api/health`

### Phase 2: API 路由補全 (API Routes)
- [ ] 2.1 建立 `app/api/sustain-write/v5/progress/[taskId]/route.ts`
- [ ] 2.2 建立 `app/api/sustain-write/v5/evidence/route.ts`
- [ ] 2.3 建立 `app/api/sustain-write/v5/download/route.ts`
- [ ] 2.4 建立 `app/api/sustain-write/v5/preview/route.ts`
- [ ] 2.5 統一錯誤處理 (`jsonError` 回應格式)

### Phase 3: 前端組件完善 (Frontend Components)
- [ ] 3.1 建立 `app/sustain-write/v5/AsyncSustainWrite.tsx`
- [ ] 3.2 抽離共用型別至 `app/sustain-write/v5/types.ts`
- [ ] 3.3 抽離 API helper 至 `app/sustain-write/v5/api.ts`
- [ ] 3.4 優化 `page.tsx` 拆分為更小組件

### Phase 4: 型別安全強化 (Type Safety)
- [ ] 4.1 建立 `src/types/sustain-write.ts` 共用型別
- [ ] 4.2 移除所有 `any` 型別
- [ ] 4.3 確保前後端型別一致 (TaskProgress, Company, EvidenceCard)
- [ ] 4.4 建立 API response 結構型別

### Phase 5: 5T 協議實作 (5T Protocol)
- [ ] 5.1 Traceable — 數據溯源追蹤
- [ ] 5.2 Transparent — 演算法公開可驗算
- [ ] 5.3 Tangible — 抽象願景具體化
- [ ] 5.4 Trustworthy — Hash Lock 不可篡改
- [ ] 5.5 Trackable — 生命週期即時記錄

### Phase 6: ZKP 零知識證明 (Zero-Knowledge Proof)
- [ ] 6.1 整合 `zkp-seal` skill
- [ ] 6.2 建立 ZKP 驗證 API
- [ ] 6.3 前端 ZKP 驗證 UI

### Phase 7: 報告生成優化 (Report Generation)
- [ ] 7.1 章節生成邏輯優化 (28 chapters GRI)
- [ ] 7.2 RAG 檢索優化 (Firebase rag_knowledge)
- [ ] 7.3 L-Hub 蜂群摘要整合
- [ ] 7.4 報告匯出格式完善 (HTML/Markdown)

### Phase 8: Omni-Knowledge Base (佐證資料)
- [ ] 8.1 單據解析 API
- [ ] 8.2 Why/What/How 知識小卡生成
- [ ] 8.3 ESGSonnar 整合
- [ ] 8.4 HashLock 生成與驗證

### Phase 9: UI/UX 優化 (Design)
- [ ] 9.1 深色/淺色模式無縫切換
- [ ] 9.2 響應式設計優化
- [ ] 9.3 載入狀態與動畫
- [ ] 9.4 錯誤處理 UI

### Phase 10: 測試與部署 (Testing & Deploy)
- [ ] 10.1 單元測試 (API routes)
- [ ] 10.2 整合測試 (完整流程)
- [ ] 10.3 效能測試 (280K 字目標)
- [ ] 10.4 部署至 Production

---

## 🔧 型別定義 (Type Definitions)

### Company
```typescript
interface Company {
  id: string;
  name: string;
  shortName: string;
  industry: string;
}
```

### TaskProgress
```typescript
interface TaskProgress {
  taskId: string;
  status: 'idle' | 'pending' | 'running' | 'completed' | 'failed';
  currentChapter: number;
  totalChapters: number;
  chapterTitle: string;
  wordsSoFar: number;
  fiveTGate: string;
  tagsCreated: number;
  decisionsCount: number;
  percent: number;
  result?: {
    totalWords: number;
    totalTags: number;
    trinityHash: string;
    durationMs: number;
    companyId: string;
  };
}
```

### EvidenceCard
```typescript
interface EvidenceCard {
  id: string;
  chapter: string;
  receiptName: string;
  why: string;
  what: string;
  how: string;
  tags: string[];
  hashLock: string;
}
```

---

## 📡 API 端點 (API Endpoints)

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/sustain-write/v5` | 取得公司列表 |
| POST | `/api/sustain-write/v5` | 同步生成報告 |
| POST | `/api/sustain-write/v5/async` | 啟動非同步任務 |
| GET | `/api/sustain-write/v5/progress/:taskId` | 查詢任務進度 |
| DELETE | `/api/sustain-write/v5/progress/:taskId` | 取消任務 |
| GET | `/api/sustain-write/v5/evidence?companyId=` | 取得佐證資料 |
| GET | `/api/sustain-write/v5/download?companyId=&format=` | 下載報告 |
| GET | `/api/sustain-write/v5/preview?companyId=&format=` | 預覽報告 |

---

## 🎨 設計規範 (Design Guidelines)

### 色彩系統 (Color System)
```css
--accent-teal: #14B8A6;    /* 主要強調色 */
--accent-gold: #F59E0B;    /* 次要強調色 */
--accent-blue: #3B82F6;    /* 資訊色 */
--accent-green: #22C55E;   /* 成功色 */
--accent-purple: #8B5CF6;  /* 信任色 */
```

### 5T 徽章色彩
```typescript
const GATE_COLORS = {
  traceable: 'bg-accentBlue',    /* 真 */
  transparent: 'bg-accentGreen', /* 善 */
  tangible: 'bg-accentGold',     /* 美 */
  trustworthy: 'bg-accentPurple',/* 信 */
  trackable: 'bg-accentTeal',    /* 通 */
};
```

---

## ✅ 完成標準 (Definition of Done)

1. 所有 API 端點回應正確
2. 前端所有功能可正常使用
3. 無 TypeScript 錯誤
4. 深色/淺色模式正常運作
5. 28 章報告可完整生成 (280K+ 字)
6. ZKP 驗證功能正常
7. 所有佐證資料正確顯示

---

## 🔗 相關 Skill

- `global-healing` — 全域痊癒標準
- `zkp-seal` — 零知識證明封印
- `firebase-firestore` — Firestore 資料庫
- `bigquery-basics` — BigQuery 資料分析

---

## 📚 參考文件

- ESG GO v5.1 架構文件
- GRI 準則 2021 年版
- TCFD 氣候相關財務揭露建議
- 5T 協議規範文件

---

> **Last Updated**: 2026-07-10
> **Maintainer**: ESG GO Development Team
