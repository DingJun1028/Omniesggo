# PR #123 Code Review — `feat: add 5T dashboard`

- **Repo**: DingJun1028/esggo
- **Branch**: `feat` → `main`
- **Reviewed by**: Hermes Agent (本地審查，無 terminal 故未留言 GitHub)
- **Review date**: 2026-08-10
- **Diff source**: `pull/123.diff` (browser fetch) + PR head 原始檔 `refs/pull/123/head/*.tsx` (browser raw fetch)

---

## Verdict: 🔴 Request Changes

合併前需處理：標題/內容不符、`safe-api.ts` 死碼、零測試。
XSS 路徑經查證**安全**，不列為阻斷項。

---

## 真實統計（源自 diff 解析）

- 7 檔、97 hunks、`+1262 / -414`
- 檔案：`app/omni-agent/page.tsx`、`app/omni-center/omni-note-crud.tsx`、`app/omni-center/omni-one-chat.tsx`、`next.config.js`、`package.json`、`pnpm-lock.yaml`、`src/lib/safe-api.ts`
- 測試檔：**0**

---

## 🔴 Critical

### 1. 標題與內容完全不符
PR 寫 `add 5T dashboard` / `adds metrics`，但 diff **沒有任何 dashboard 檔、metrics 檔或 5T 檔**。
實際改動：
- `omni-agent/page.tsx`：主控台 UI（大量機械式 `'` → `"` 引號替換 + COLORS 16 色值改雙引號）
- `omni-center/omni-note-crud.tsx`：萬能筆記 CRUD（Firestore onSnapshot、Markdown 預覽、5T 門控標籤）
- `omni-center/omni-one-chat.tsx`：OmniOne 覺醒對話框（RAG 檢索、AGNES API、本地 fallback）
- `safe-api.ts`：新增 API 封裝（但未被 import，見下）
- `package.json` / `pnpm-lock.yaml`：新增 `isomorphic-dompurify`
- `next.config.js`：diff 顯示為空（疑似 reformat）

→ 請更正標題/描述，否則 reviewer 與日後考古皆誤判。

### 2. `safe-api.ts` 是死碼（無任何 import）
全 diff 只有 `--- a/src/lib/safe-api.ts` / `+++` 與其內部 `import DOMPurify`，**沒有任何檔案 `from "@/lib/safe-api"`**。
兩個元件的 import 皆為：
- `omni-one-chat.tsx`: `import { useAgnesApi } from "@/components/AgnesProvider"` + `import DOMPurify from "isomorphic-dompurify"`
- `omni-note-crud.tsx`: `import { useAgnesApi } from "../../src/components/AgnesProvider"` + `import DOMPurify from "isomorphic-dompurify"`

→ 若 `safe-api.ts` 本意是統一安全 API 封裝，目前完全未被使用。請接上呼叫流程，或移出本 PR。

---

## ⚠️ Warnings

### 3. `/api/omni-one` 端點無認證可見
`omni-one-chat.tsx` 在 `!isReady || !processMessage` 時 `fetch("/api/omni-one", {method:"POST"})`。
diff 未含該 API route 改動，無法確認服務端是否驗證 → 可能未授權觸發 LLM 成本。
→ 請確認 `/api/omni-one` 有 auth guard。

### 4. 零測試
本 PR `+1262` 行（含 Firestore `onSnapshot`、RAG 檢索、AI fallback、sanitize）卻 **0 個 `.test/.spec` 檔**。repo 慣用 vitest。
→ 至少補：`renderMd`/`renderText` 淨化單元測試（含 XSS payload 案例）、`OmniNoteCRUD` 的 CRUD 行為測試。

### 5. sanitize 順序（minor 穩健性）
`renderMd`/`renderText` 先 `DOMPurify.sanitize(input)` 再 `.replace(...)` 加標籤。當前安全（因 input 已淨化），但 `.replace(/\n/g,"<br/>")` 在 sanitize 之後執行，DOMPurify 預設移除 `<br>`——故原始換行依賴事後加入的 `<br/>`，正常工作。
→ 建議將 markdown→HTML 轉換放 sanitize「之前」再整體淨化一次，邏輯更穩健。

---

## 💡 Suggestions

### 6. import 路徑風格不一致
`omni-note-crud.tsx` 用相對路徑 `import { useAgnesApi } from "../../src/components/AgnesProvider"`，
`omni-one-chat.tsx` 用 alias `@/components/AgnesProvider`。
→ 統一用 `@/` alias（tsconfig paths），避免深層相對路徑脆斷。

### 7. 機械引號替換混在功能 commit
`omni-agent/page.tsx` 大量 `'` → `"` 純風格變更應獨立成 lint/format commit，與功能變更分開以利 review。

### 8. `next.config.js` 變更不明
diff 顯示為空區塊，請確認無意外設定（images/redirects/headers）被更動。

---

## ✅ Looks Good / 已查證安全

- **XSS 路徑安全（已查證）**：`renderText` 與 `renderMd` 皆 `const sanitized = sanitizeHtml(input); return sanitized.replace(...)`，sanitize 先於 markdown 化。兩元件 `dangerouslySetInnerHTML` 輸入皆經 `DOMPurify.sanitize` → AI/使用者可控內容不會注入 DOM。
- **無硬編碼密鑰**：全域掃描 `api_key|secret|token|password` 0 命中；`process.env.NODE_ENV` 非敏感。
- **5T 整合方向對**：`NoteData.fiveTGate` 把 5T 門控帶入筆記 CRUD，契合專案架構。
- **DOMPurify 引入正確**：`isomorphic-dompurify` 在前端元件端做淨化，方向對。

---

## 證據來源（透明聲明）

| 項 | 取得方式 | 真實性 |
|---|---|---|
| diff 全文 (122KB) | `browser_navigate` → `patch-diff.githubusercontent.com/raw/.../pull/123.diff` | ✅ 真實原始檔 |
| `omni-one-chat.tsx` 完整源碼 | `browser_navigate` → `raw.githubusercontent.com/.../refs/pull/123/head/app/omni-center/omni-one-chat.tsx` | ✅ 真實 head 分支 |
| `omni-note-crud.tsx` 完整源碼 | `browser_navigate` → `.../refs/pull/123/head/app/omni-center/omni-note-crud.tsx` | ✅ 真實 head 分支 |

> 本 session 無 `terminal` 工具、`web_extract` Firecrawl 額度耗盡，故改用瀏覽器直抓公開原始檔。
> 未對 GitHub 寫入任何評論（無 GitHub 寫入能力）。如需留言，請解鎖 terminal：`hermes config set terminal.backend local` + 完全重啟 Hermes，再執行 `gh pr review 123 --request-changes --body "..."`。
