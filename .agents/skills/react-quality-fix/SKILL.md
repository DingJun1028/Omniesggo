---
name: react-quality-fix
description: Fix React code patterns that fail ESLint and React Compiler rules. Covers hooks ordering, ref usage, purity, immutability, and useEffect patterns. Use when fixing lint errors in React/Next.js components.
uuid: "c3d4e5f6-a7b8-9012-cdef-123456789012"
version: 1.0.0
title: React 品質修復
category: react-quality-fix
title: React 品質修復
category: react-quality-fix
---

1.0.0# React Quality Fix Skill

Fix React patterns that fail ESLint / React Compiler rules.

## Pattern 1: Hooks Must Be Called Before Early Returns

❌ **Wrong** — `useMemo` after conditional return:
```tsx
function Chart({ data }: Props) {
  const [hovered, setHovered] = useState(null);
  if (!data) return <div>No data</div>;  // ← early return BEFORE hook
  const slices = useMemo(() => compute(data), [data]);  // ← ERROR: rules-of-hooks
  return <svg>...</svg>;
}
```

✅ **Right** — all hooks before any returns:
```tsx
function Chart({ data }: Props) {
  const [hovered, setHovered] = useState(null);
  const slices = useMemo(() => {
    if (!data) return [];
    return compute(data);
  }, [data]);
  if (!data) return <div>No data</div>;  // ← after all hooks
  return <svg>...</svg>;
}
```

## Pattern 2: No Ref Access During Render

❌ **Wrong** — reading `ref.current` in JSX:
```tsx
const history = useRef({});
// ...
return <Sparkline data={history.current[id]} />;  // ← ERROR: react-hooks/refs
```

✅ **Right** — use state for render-driven data:
```tsx
const [history, setHistory] = useState({});
const historyRef = useRef({});
// Update both in callbacks:
const update = (id, value) => {
  historyRef.current[id] = value;
  setHistory({ ...historyRef.current });
};
return <Sparkline data={history[id]} />;
```

## Pattern 3: No Impure Functions During Render

❌ **Wrong** — `Math.random()` in render:
```tsx
<Card hashLock={`0x${Math.random().toString(16).slice(2,10)}...`} />
```

✅ **Right** — use deterministic hash:
```tsx
import crypto from 'crypto';
const hash = crypto.createHash('md5').update(slug).digest('hex').slice(0, 8);
<Card hashLock={`0x${hash}...`} />
```

Or use `useMemo`:
```tsx
const hashLock = useMemo(() => {
  return `0x${crypto.createHash('md5').update(slug).digest('hex').slice(0, 8)}...`;
}, [slug]);
```

## Pattern 4: No Variable Reassignment During Render

❌ **Wrong** — mutating `let` variable in `.map()`:
```tsx
let cumulative = 0;
return data.map(slice => {
  const start = cumulative;
  cumulative += slice.value;  // ← ERROR: react-hooks/immutability
  return <path d={...} />;
});
```

✅ **Right** — use `useMemo` to precompute:
```tsx
const slices = useMemo(() => {
  let cumulative = 0;
  return data.map((slice, i) => {
    const start = cumulative;
    cumulative += slice.value;
    return { ...slice, start, end: cumulative, i };
  });
}, [data]);
return slices.map(s => <path key={s.i} d={...} />);
```

## Pattern 5: fetchStatus Must Be Declared Before Use

❌ **Wrong** — using function before declaration:
```tsx
useEffect(() => {
  ws.onmessage = () => fetchStatus();  // ← ERROR: accessed before declared
}, []);
const fetchStatus = useCallback(async () => { ... }, []);
```

✅ **Right** — declare before WebSocket effect:
```tsx
const fetchStatus = useCallback(async () => { ... }, []);
useEffect(() => {
  ws.onmessage = () => fetchStatus();  // ← now OK
}, [fetchStatus]);
```

## Pattern 6: setState in useEffect (React Compiler)

The rule `react-hooks/set-state-in-effect` flags:
```tsx
useEffect(() => {
  fetchData().then(data => setData(data));  // ← flagged
}, []);
```

This is a **standard React pattern**. Solutions:
1. **Disable the rule** (recommended for existing codebases):
   ```js
   'react-hooks/set-state-in-effect': 'off'
   ```
2. Or use `useTransition` to wrap the state update.

## Quick Diagnostic

| ESLint Error | Root Cause | Fix |
|-------------|------------|-----|
| `rules-of-hooks` | Hook after early return | Move all hooks to top |
| `refs` | `ref.current` in JSX | Use `useState` for render data |
| `purity` | Math.random in render | Use `useMemo` + deterministic hash |
| `immutability` | `let` mutated in render | Use `useMemo` to precompute |
| `set-state-in-effect` | fetch in useEffect | Disable rule or use pattern |


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| react-quality-fix | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：react-quality-fix 並查詢目前狀態
{
  triggers: ["react-quality-fix", "query"],
  actions: ["awaken()", "query()"],
  priority: ["react-quality-fix", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | react-quality-fix, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | react-quality-fix, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：react-quality-fix
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 react-quality-fix 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 react-quality-fix 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
