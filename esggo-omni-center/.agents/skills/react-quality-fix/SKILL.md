---
name: react-quality-fix
description: Fix React code patterns that fail ESLint and React Compiler rules. Covers hooks ordering, ref usage, purity, immutability, and useEffect patterns. Use when fixing lint errors in React/Next.js components.
uuid: "c3d4e5f6-a7b8-9012-cdef-123456789012"
version: "1.0.0"
---

# React Quality Fix Skill

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
