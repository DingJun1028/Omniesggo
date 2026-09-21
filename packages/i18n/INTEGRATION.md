# @esggo/i18n v0.3.1 — 整合紀錄

## 整合狀態

- ✅ Source 落地: commit `ed6806b94` on `feat/omni-integration-center`
- ✅ 推送到 remote: `ed6806b94` 已 push 到 `origin/feat/omni-integration-center`
- ✅ pnpm workspace 認到: `@esggo/i18n@0.3.1 (PRIVATE)`
- ⚠️ `pnpm-lock.yaml` 未含 `packages/i18n` 段

## 為何 lockfile 沒自動整合

pnpm 11.5.2 對 workspace package 採 **lazy registration**:
- `pnpm install` 只更新 *被引用* 的 workspace package
- 沒人引用時 pnpm 不寫進 lockfile
- 這是設計行為，不是 bug

## 如何讓 lockfile 自動整合

任一 consumer package 在 `package.json` 加入:
```json
{
  "dependencies": {
    "@esggo/i18n": "workspace:*"
  }
}
```

或 `import`:
```typescript
import { LOCALES, type Locale } from '@esggo/i18n';
```

然後跑 `pnpm install` → pnpm 會自動把 `packages/i18n:` 段寫進 lockfile。

## 5T Gate

- Stage 6 獨立驗證: per-file sha256 對照 MATCH (working tree == HEAD)
- `npm run i18n:check`: 12/12 PASS, EXIT 0
- `pnpm list --filter @esggo/i18n`: 認到

## 建議 consumer

| 候選 | 理由 |
|---|---|
| `packages/shared` | 廣被引用, 觸發效應最大 |
| `apps/htb-b2b` | B2B 站本身需要 zh-TW + en |
| `apps/universal-translator` | 翻譯站直接吃 i18n |

## 守護腳本位置

- `.scratch/finish-i18n-integration.sh` — rebase 結束後整合
- `.scratch/wait-rebase-then-finish.sh` — 監控 rebase + 自動整合
- `.scratch/commit-msg-i18n.txt` — commit message 預稿
