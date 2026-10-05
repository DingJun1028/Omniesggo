# 無作妙德類型安全計劃

## 目標：完全消除 any 類型使用

### 當前狀態
- 發現 20 處 `any` 類型使用
- 主要位置：src/impl/core.ts, app/api 路由, packages/omni-agent

### 消除策略

#### 1. any 類型分類
- **混沌注入** (7 處): src/impl/core.ts - 需要重構為具體類型
- **事件變異** (1 處): src/lib/omni-core/omni-function.ts - 事件類型定義
- **向量映射** (4 處): app/api/ai-notes/search/route.ts - 結果類型定義
- **交互解析** (3 處): app/api/village/trends/route.ts - 交互數據類型
- **總線事件** (1 處): app/api/agent/[id]/thought/stream/route.ts - 事件類型
- **數據映射** (4 處): packages/omni-agent/src/types.ts - 結果類型

#### 2. 類型定義重構
```typescript
// 替代 any 的具體類型定義
interface ChaosInjectionEvent {
  type: 'chaos_injection';
  timestamp: number;
  payload: {
    severity: 'low' | 'medium' | 'high';
    description: string;
    affectedComponents: string[];
  };
}

interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

interface VillageInteraction {
  userId: string;
  action: 'vote' | 'comment' | 'endorse';
  targetId: string;
  timestamp: number;
  value: number;
}
```

#### 3. 泛型類型優化
```typescript
// 使用泛型替代 any
function processData<T>(data: T): ProcessedData<T> {
  // 類型安全的處理邏輯
}

// 使用類型守衛
function isVectorResult(data: unknown): data is VectorSearchResult {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'content' in data &&
         'score' in data;
}
```

### 實施步驟

#### 階段一：核心類型定義 (Week 1)
1. 定義所有缺失的接口類型
2. 建立統一的類型導出模組
3. 更新 tsconfig.json 擴展類型檢查

#### 階段二：核心模組重構 (Week 2)
1. 重構 src/impl/core.ts 的混沌注入
2. 更新 omni-core 的函數類型
3. 修復 packages/omni-agent 類型

#### 階段三：API 路由類型化 (Week 3)
1. 所有 API 路由請求/響應類型
2. 錯誤處理類型統一
3. 參數驗證類型定義

#### 階段四：驗證與監控 (Week 4)
1. 啟用嚴格的 ESLint any 檢查
2. 設置 CI 類型檢查閘門
3. 建立類型覆蓋率報告

### 類型安全監控
```typescript
// 自動類型檢查配置
const typeSafetyConfig = {
  strictNullChecks: true,
  strictFunctionTypes: true,
  strictBindCallApply: true,
  strictPropertyInitialization: true,
  noImplicitAny: true,
  noImplicitThis: true,
  alwaysStrict: true,
};
```

### 持續改進
- 每週類型安全審查
- 新 any 使用必須經過審批
- 建立類型安全最佳實踐文檔