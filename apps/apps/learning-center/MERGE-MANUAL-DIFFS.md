# 合併手動項 Diff 草稿（C3–C10）

> 對應 `MERGE-GAP-ANALYSIS.md` 手動決策項。本檔供正常 session 貼入 monorepo 使用。
> 覺結界紅線：以下全數應用且 `pnpm -F learning-center build` + `check:types-sync` 綠燈後，方解除「禁止 push main」。

---

## C3 — React 18 → 19 升級（apps/learning-center/package.json）

```diff
   "dependencies": {
     "@supabase/supabase-js": "^2.110.7",
     "firebase": "^12.16.0",
     "lucide-react": "^0.507.0",
-    "react": "^18.3.1",
-    "react-dom": "^18.3.1"
+    "react": "^19.2.7",
+    "react-dom": "^19.2.7"
   },
   "devDependencies": {
     "@eslint/js": "^9.39.5",
     "@vitejs/plugin-react": "^4.3.1",
     "autoprefixer": "^10.4.19",
     "eslint": "^9.39.5",
     "eslint-plugin-react": "^7.37.5",
     "eslint-plugin-react-hooks": "^5.2.0",
     "jsdom": "^29.1.1",
     "postcss": "^8.4.39",
     "tailwindcss": "^3.4.4",
     "vite": "^6.0.7",
     "vitest": "^4.1.10"
   }
```

⚠️ React 19 注意事項：
- `react-dom/server` 的 `renderToString` 行為變更；若 `src/` 有用到需確認。
- 移除已廢棄的 `React.FC` 隱含 children 型別（19 起 children 不再自動推論）。
- `@vitejs/plugin-react` ^4.3.1 相容 React 19，無需升。
- **必須實機跑 `vite build`** 驗證 JSX 無破。

---

## C4 — @supabase/supabase-js 依賴

✅ **實測：learning-center 的 `package.json` 已宣告 `@supabase/supabase-js: ^2.110.7`**。
併入 `apps/learning-center/` 後，此依賴留在 app 級 package.json 即可，pnpm workspace 會自行解析。
**無需改動 monorepo 根**（除非要升為 workspace 共享包）。結案：C4 已隱式滿足。

---

## C5 — functions/ 落點決策

決議：**保留在 `apps/learning-center/functions/`**（CJS，firebase-functions 4.5.1，自有 package.json 無 `type:module`）。
- Firebase Functions 支援 CJS，與 monorepo ESM 主體不衝突（獨立 deploy unit）。
- `firebase.json` 的 `"functions": { "source": "functions" }` 在 app 根相對路徑下仍正確。
- 若未來要統一 ESM，再另行重寫（不在本輪範圍）。

---

## C6 — turbo.json 加 vite build 輸出（esggo/turbo.json）

monorepo 根 `build` task 現 outputs 為 `.next/**`。learning-center 用 vite 輸出 `dist/**`，須補：

```diff
   "build": {
     "dependsOn": ["^build"],
-    "outputs": [".next/**", "dist/**"],
+    "outputs": [".next/**", "dist/**"],
     "inputs": ["$TURBO_DEFAULT$", ".env*"]
   },
```

> 注：turbo 跑的是各 package 自己的 `build` script（learning-center = `vite build`），故無需為 app 特設 task；只需確保 `dist/**` 在 outputs 快取白名單。根 `package.json` 的 `build`（`next build`）不影響 app 子命令 `pnpm -F learning-center build`。

---

## C7 — CI 搬移 check-types-sync 進 monorepo（esggo/.github/workflows/ci.yml）

併入後 consumer 與 canonical 同倉，job 可簡化為單 repo 內執行。新增 job：

```yaml
  check-types-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 11.5.2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Regenerate shared types
        working-directory: apps/learning-center
        run: node ../../scripts/export-shared-types.js
      - name: Check sync
        working-directory: apps/learning-center
        run: node scripts/check-types-sync.js
```

> 注意：generator `DEST` 須先按 G-4 改為 `apps/learning-center/types/generated/`，否則 regeneration 會寫錯位置。

---

## C10 — 驗證指令（正常 session，monorepo 根）

```bash
cd <monorepo>
pnpm install
pnpm -F learning-center build            # 期望 → dist/ 產出
pnpm -F learning-center check:types-sync  # 期望 → TYPES_IN_SYNC
pnpm -F learning-center lint              # 期望 → 無 error
```

綠燈後解除覺結界紅線，方可 `gh pr create` / `git push` 到 main。

---

## 解除禁區檢核表

- [ ] C3 React19 升級 + `vite build` 通過
- [ ] C4 @supabase 依賴確認在 app package.json（✅ 已滿足）
- [ ] C5 functions 落點決議（✅ apps/learning-center/functions/）
- [ ] C6 turbo.json 加 dist/**（✅ diff 如上）
- [ ] C7 CI job 搬入 monorepo（✅ yaml 如上）
- [ ] C10 三項驗證全綠燈

> 全綠 → 覺結界「不帶病上線」解除，准予 push main。
