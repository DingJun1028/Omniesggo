# SPEC — @esggo/i18n v0.3.1

## 設計原則

- **SSOT**: `src/canon.d.ts` 為鍵名唯一來源（Locale, DictKey, LOCALES）
- **雙語收縮**: 只 en + zh-TW，無 legacy locales
- **5T 驗證**: T1-T8 自動檢查 + per-file sha256 (T8)
- **鎖定**: `dist/canon.d.ts.lock` 是 DICT + KEYS + LOCALES 的 sha256
- **自動生成**: i18n/*.json + canon.i18n.ts 從 SSOT 衍生

## 12 項 TDD

| Test | 描述 |
|---|---|
| T1 × 2 | i18n/{en,zh-TW}.json exists |
| T2 × 2 | bundle has locale/version/dict |
| T3 × 2 | each dict has all 8 keys |
| T4 | zh-TW/en keys identical (無孤立 key) |
| T5 × 2 | locale fields correct (按 LOCALES 順序檢查) |
| T6 | no legacy locales |
| T7 | canon.d.ts LOCALES locked |
| T8 | 5T-PROOF.json per-file sha256 match |

## 8 鍵字典

```
app.title
app.subtitle
app.welcome
nav.home
nav.about
nav.contact
btn.submit
btn.cancel
```

## 雙語值

### en (English)
- app.title: "Omni Avatar"
- app.subtitle: "Share with everyone, everywhere"
- app.welcome: "Welcome to Omni Avatar"
- nav.home: "Home"
- nav.about: "About"
- nav.contact: "Contact"
- btn.submit: "Submit"
- btn.cancel: "Cancel"

### zh-TW (繁體中文)
- app.title: "萬能分身"
- app.subtitle: "與人共享，無處不在"
- app.welcome: "歡迎來到萬能分身"
- nav.home: "首頁"
- nav.about: "關於"
- nav.contact: "聯絡我們"
- btn.submit: "提交"
- btn.cancel: "取消"

## 命名空間

- `@esggo/i18n` — 主 entry (canon.d.ts)
- `@esggo/i18n/canon` — canon.d.ts
- `@esggo/i18n/en` — en.json
- `@esggo/i18n/zh-TW` — zh-TW.json
