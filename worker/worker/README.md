# Cloudflare Worker — Smart AI Router

> 將 worker entry 從 Next.js 的 `src/` 移出，放在獨立 `worker/` 目錄。
> 目的：避免 Workers Builds 誤 bundle Next/React/App Router 源碼，
> 同時保持 app build 純淨、可單獨驗證、可單獨部署。

##  Boundaries

- **entry**: `worker/src/index.ts`
- **config**: `wrangler.toml`
- **types**: `worker/tsconfig.json`
- **tests**: `worker/__tests__/`

入口僅做三件事：環境金鑰接線（`hydrateEnv`）、HTTP 路由、回傳 JSON。
業務推理全部委託既有模組 `src/core/ai/model-router.ts`，不複製邏輯。

## 快速驗證

```bash
# 安裝 workspace deps（仍需 pnpm，因 worker tsconfig 引用 ../../src/core/ai/model-router.ts）
pnpm install --frozen-lockfile

# Worker 型別
pnpm exec tsc -p worker/tsconfig.json

# Worker 單元測試
pnpm exec vitest run worker/ --reporter=verbose
```

## 本地開發

```bash
wrangler dev --config wrangler.toml
```

 secrets 用 `.dev.vars`（已 gitignore），或 `wrangler secret put`。

## 部署

```bash
wrangler deploy --config wrangler.toml
```

## CI

- `.github/workflows/ci.yml` 內有獨立 `worker` job：typecheck + vitest。
- `next build` 不會進入 `worker/`；反之 worker build 也不會碰 `app/`。

## 為何不把 `worker/src/index.ts` 放在 `src/` 底下？

Workers Builds 在 bundling 時會 walk `main` 指定的 entry 及其 `import` 圖。
如果該 entry 位在 Next.js `src/`、`app/`，極易誤帶入 App Router / React /
後端依賴，造成：
- bundle 膨脹
- 在 Workers runtime 觸發 `self is not defined` / DOM API 缺失
- CI `wrangler deploy` / Workers Builds 失敗

獨立 `worker/` 目錄把邊界釘死：只有 `src/core/ai/model-router.ts`
一個 reversible import，風險可控。
