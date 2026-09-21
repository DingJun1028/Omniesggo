# @esggo/i18n v0.3.1

esggo monorepo 的雙語 i18n 套件: zh-TW + en。SSOT = `src/canon.d.ts`。

## 用法

```bash
pnpm install
pnpm --filter @esggo/i18n i18n:check   # 12/12 TDD + 5T-PROOF.json
```

## 結構

```
src/
├── canon.d.ts          # SSOT 鍵名表 (Locale, DictKey, LOCALES)
├── i18n/
│   ├── en.json         # 自動產生
│   └── zh-TW.json      # 自動產生
└── types/
    └── canon.i18n.ts   # 自動產生 (LOCALES + DICT + VERSION)
scripts/
├── gen.ts              # 從 SSOT 生成 JSON + schema + i18n.ts + lock
└── verify.ts           # T1-T8 驗證 + 5T-PROOF.json
dist/
├── 5T-PROOF.json       # 5T 證書 (per-file sha256 + canonSha256)
├── canon.d.ts.lock     # SHA-256 of {DICT, KEYS, LOCALES}
└── canon.schema.json   # JSON Schema 驗證 bundle 格式
package.json
tsconfig.json
```

## 設計

- **SSOT**: `src/canon.d.ts` 為鍵名唯一來源
- **雙語收縮**: 只 en + zh-TW，無 legacy ja/zh-CN/fr
- **5T 驗證**: T1-T8 自動檢查 + per-file sha256 (T8)
- **鎖定**: `dist/canon.d.ts.lock` 是 DICT + KEYS + LOCALES 的 sha256
- **TDD 容忍公式**: `(2-1) * keys * 0.7`

## 12 項檢查

| Test | 描述 |
|---|---|
| T1 × 2 | i18n/{en,zh-TW}.json exists |
| T2 × 2 | bundle has locale/version/dict |
| T3 × 2 | each dict has all 8 keys |
| T4 | zh-TW/en keys identical |
| T5 × 2 | locale fields correct |
| T6 | no legacy locales |
| T7 | canon.d.ts LOCALES locked |
| T8 | 5T-PROOF.json per-file sha256 |

## 對外 API

```typescript
import { LOCALES, type Locale, type DictKey } from '@esggo/i18n';
import en from '@esggo/i18n/en';
import zhTW from '@esggo/i18n/zh-TW';
```
