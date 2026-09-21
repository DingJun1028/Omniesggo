# @esggo/i18n v0.3.1 — 整合紀錄

## 整合狀態

- ✅ Source 落地: commit `ed6806b94` on `feat/omni-integration-center`
- ✅ 推送 remote: `bc5d38db3` 已 push 到 `origin/feat/omni-integration-center`
- ✅ pnpm workspace 認到: `@esggo/i18n@0.3.1 (PRIVATE)`
- ✅ `pnpm-lock.yaml` 含 `packages/i18n:` 段 (vitest specifier `>=4.1.10` 被 hoist)
- ✅ vitest consumer test: 9/9 PASS
- ✅ `npm run i18n:check`: 12/12 PASS, EXIT 0, 5T VERIFY OK

## 5T Verification

| Stage | 結果 |
|---|---|
| Traceable | source_origin = `feat(i18n): add @esggo/i18n v0.3.1` |
| Trackable | commit `ed6806b94`, followup `bc5d38db3` |
| Tangible | `npm run i18n:check` 12/12 + `vitest run` 9/9 |
| Transparent | 雙語收縮 `LOCALES = ['en', 'zh-TW']`, 無 legacy |
| Trustworthy | per-file sha256 + canon.d.ts.lock + 5T-PROOF.json |

## Files

```
src/
├── canon.d.ts            # SSOT (LOCALES, Locale, DictKey, I18nBundle)
├── i18n/
│   ├── en.json
│   └── zh-TW.json
└── types/
    └── canon.i18n.ts     # 自動產生 (LOCALES + DICT + VERSION)
scripts/
├── gen.ts                # SSOT → JSON + schema + i18n.ts + lock
└── verify.ts             # T1-T8 (12 checks) + 5T-PROOF.json
test/
└── consumer.test.ts      # vitest, 9 cases
vitest.config.ts
package.json
tsconfig.json
README.md
SPEC.md
INTEGRATION.md
.gitignore
```

## 觸發 lockfile 整合

加 `vitest` 到 devDependencies → `pnpm install` 自動把 `packages/i18n:` 寫進 lockfile (pnpm 11 lazy registration 解除)。

## 後續建議

| 動作 | ROI |
|---|---|
| Consumer package 引用 `import { LOCALES } from '@esggo/i18n'` | 🟢 證明整合 |
| 加 5 鍵擴充字典 (Stage 5 SPEC 對齊) | 🟡 中 |
| 接 `kill-switch.mjs` 文案對應 | 🟡 scope creep |
