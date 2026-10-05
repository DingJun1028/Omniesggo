# 無作妙德測試覆蓋計劃

## 目標：達到 80% 測試覆蓋率

### 當前狀態
- 源文件：227 個 .ts 文件
- 測試文件：18 個 (8% 覆蓋率)
- 關鍵路徑覆蓋：部分核心功能已測試

### 優化策略

#### 1. 優先級分層
- **P0 (阻塞)**: ZKP 服務、5T 協議、OmniTag、認證系統
- **P1 (高)**: API 路由、核心服務、數據處理
- **P2 (中)**: UI 組件、工具函數、邊緣功能
- **P3 (低)**: 已棄用功能、實驗性功能

#### 2. 測試類型分配
- **單元測試**: 60% - 針對純函數和工具類
- **集成測試**: 25% - 針對 API 和服務交互
- **E2E 測試**: 15% - 關鍵用戶流程

#### 3. 自動測試生成
```typescript
// 使用 Vitest + TypeScript 自動生成測試框架
interface TestCoverageTarget {
  module: string;
  currentCoverage: number;
  targetCoverage: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  estimatedEffort: 'low' | 'medium' | 'high';
}
```

### 實施步驟

#### 階段一：核心路徑 (Week 1-2)
1. ZKP 服務完整測試套件
2. 5T 協議驗證測試
3. OmniTag 工廠測試
4. 認證系統測試

#### 階段二：API 層 (Week 3-4)
1. 所有 API 路由單元測試
2. 錯誤處理測試
3. 認證中間件測試
4. 速率限制測試

#### 階段三：服務層 (Week 5-6)
1. 報告生成服務測試
2. 數據處理管道測試
3. 外部服務集成測試
4. 緩存策略測試

#### 階段四：UI 層 (Week 7-8)
1. 關鍵組件測試
2. 用戶交互測試
3. 主題系統測試
4. 響應式測試

### 覆蓋率監控
```typescript
// 自動覆蓋率報告生成
const coverageTargets = {
  'src/lib/zkp-service.ts': 95,
  'src/lib/five-t-protocol.ts': 90,
  'src/lib/omni-tag.ts': 90,
  'app/api/**/*.ts': 85,
  'src/core/services/*.ts': 80,
  'src/components/**/*.tsx': 70,
};
```

### 持續集成
- 每次 PR 必須通過覆蓋率檢查
- 新代碼必須包含測試
- 覆蓋率下降的 PR 將被阻止