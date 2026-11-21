# NCB Proxy 整合部署 Runbook

> 對應指南:`auth_proxy_setup.md` + `data_proxy_setup.md`
> 適用:任何 Next.js 13+ App Router 應用
> 目標:把 JunAikey 用的 NCB instance (`54686_junaikey`) 整合到 Next.js 應用

---

## 1. 環境準備 (.env.local)

```env
# 已存在 (JunAikey 用)
NCBDB_API_TOKEN="sk_live_eqedofjhqlzj94urfy"
NCBDB_BASE_URL="https://api.nocodebackend.com"
NCBDB_PROJECT_ID="54686_junaikey"
NCBDB_TABLE_SKILLS="skills"
NCBDB_TABLE_MEMORY="memory"
NCBDB_TABLE_PROGRESS="progress"
NCBDB_TABLE_JOURNAL="journal"
NCBDB_TABLE_LINEAGE="lineage"

# 新增 (Next.js proxy 用)
NCB_SECRET_KEY="sk_live_eqedofjhqlzj94urfy"   # server-only,Do NOT expose
NCB_APP_URL="https://app.nocodebackend.com"
NCB_AUTH_API_URL="https://app.nocodebackend.com/api/user-auth"
NCB_DATA_API_URL="https://app.nocodebackend.com/api/data"
NCB_INSTANCE="54686_junaikey"
```

⚠️ **重要**:
- `NCB_SECRET_KEY` 僅 Next.js server 端用,**Do NOT** 用 `NEXT_PUBLIC_*` prefix
- 不要 commit `.env.local` (已在 .gitignore)
- 機密輪換時同步更新 server secret 與 JunAikey `NCBDB_API_TOKEN`

---

## 2. Auth Proxy 部署

### 2.1 建立路由 `app/api/auth/[...path]/route.ts`

直接複製 `auth_proxy_setup.md` 的完整程式碼。**注意**:
- 完整程式碼約 200 行,含 cookie 處理、`__Secure-` prefix 轉換、sign-out
- 使用 Next.js 15 的 `params: Promise<{...}>` 語法 (Promise wrapping)

### 2.2 建立 providers 端點 `app/api/auth-providers/route.ts`

```typescript
import { NextResponse } from "next/server";
export async function GET() {
  const url = `${process.env.NCB_AUTH_API_URL}/providers?instance=${process.env.NCB_INSTANCE}`;
  const res = await fetch(url);
  return NextResponse.json(await res.json());
}
```

### 2.3 前端 Auth UI

`app/auth/page.tsx` (或登入頁):

```typescript
"use client";
import { useEffect, useState } from "react";

type Providers = { email?: boolean; google?: boolean; emailOTP?: boolean };

export default function AuthPage() {
  const [providers, setProviders] = useState<Providers | null>(null);

  useEffect(() => {
    fetch("/api/auth-providers")
      .then(r => r.json())
      .then(d => setProviders(d.providers || {}))
      .catch(() => setProviders({ email: true }));
  }, []);

  if (!providers) return <div>Loading...</div>;
  return (
    <div>
      {providers.google && <button onClick={() => location.href = `/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(location.origin + "/auth/callback")}`}>Google 登入</button>}
      {providers.emailOTP && <form onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch("/api/auth/email-otp/send-verification-otp", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fd.get("email"), type: "sign-in" }),
        });
      }}>OTP 登入</form>}
      {providers.email && <form onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch("/api/auth/sign-in/email", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
        });
      }}>Email 登入</form>}
    </div>
  );
}
```

---

## 3. Data Proxy 部署

### 3.1 共享工具 `lib/ncb-utils.ts`

從 `data_proxy_setup.md` 複製完整 `ncb-utils.ts` (含 `extractAuthCookies`、`getSessionUser`、`proxyToNCB`、`proxyToNCBPublic`、`getRlsPolicies`、RLS 政策判斷函式)

### 3.2 認證路由 `app/api/data/[...path]/route.ts`

複製 `data_proxy_setup.md` 的 authenticated proxy 完整程式碼。**注意**:
- GET/POST/PUT/DELETE handler 都需檢查 session
- POST/PUT 自動注入 `user_id` (從 session)
- POST create 路徑特殊處理 (刪除 client 傳的 user_id,改用 session)

### 3.3 公開路由 `app/api/public-data/[...path]/route.ts`

複製 `data_proxy_setup.md` 的 public proxy 完整程式碼。**注意**:
- 需先檢查 RLS policy,只有 `public_*` policy 的 table 可訪問
- scoped policy 需從 query/body 取 `owner_id`

### 3.4 設定 RLS Policy

第一次部署時,為需要公開訪問的 table 設 policy:

```typescript
// 一次性 script: 透過 MCP set_rls_policy 設定
// 例如 bookings table 設 public_scoped_readwrite
await setRlsPolicy({
  database: "54686_junaikey",
  table: "bookings",
  policy: "public_scoped_readwrite"
});
```

---

## 4. 部署檢查清單

### 4.1 環境與 NCB

- [ ] `.env.local` 包含 5 個 `NCB_*` 變數 + 1 個 `NCB_SECRET_KEY`
- [ ] `NCB_SECRET_KEY` 未在 client bundle 中 (用 `NEXT_PUBLIC_*` 會洩漏)
- [ ] NCB Dashboard 5 tables (skills/memory/progress/journal/lineage) 存在

### 4.2 Auth Proxy

- [ ] `/api/auth-providers` 回傳 `{providers: {...}}` 格式
- [ ] 登入後 `/api/auth/get-session` 回傳 user
- [ ] 重新整理頁面仍保持登入
- [ ] Sign-out 清 cookies + UI 狀態

### 4.3 Data Proxy

- [ ] 認證讀寫 (CRUD 5 動作) 都正常
- [ ] 建立時 `user_id` 自動從 session 注入
- [ ] 公開 route 對 `public_*` table 正常
- [ ] scoped policy 需 `owner_id` 強制驗證

### 4.4 安全

- [ ] 認證 route 對未登入用戶回 401
- [ ] `NCB_SECRET_KEY` 不在任何 client-side code 中
- [ ] CORS 設定正確 (尤其 credentials: 'include' 時)

---

## 5. JunAikey 與 Next.js 整合

若 Next.js 應用也想用 JunAikey (萬能永憶):

```bash
# 把 JunAikey 模組複製到 Next.js 專案
cp -r vps/junaikey.mjs vps/junaikey/ /path/to/nextjs/lib/junaikey/

# Next.js API route 中使用
cat > app/api/junaikey/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { awaken, growSkill, remember, recall } from "@/lib/junaikey/junaikey.mjs";
// 注意: Node 18+ 才有原生 fetch,Next.js Edge Runtime 不支援 fs,要用 nodejs runtime
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const op = url.searchParams.get("op");
  if (op === "awaken") return NextResponse.json(await awaken({ silent: true }));
  if (op === "recall") return NextResponse.json(await recall());
  return NextResponse.json({ error: "unknown op" }, { status: 400 });
}
EOF
```

⚠️ JunAikey 依賴 `node:fs` 與 `node:os`,**無法在 Edge Runtime 跑**。需:
- 設定 `export const runtime = "nodejs"`
- 或部署為獨立的 Node.js service (VPS 上的 esggo-vps)

---

## 6. 常見問題

### Q: `NCB GET /read/skills 500 Unknown column 'level'`
A: 用戶在 NCB Dashboard 手動加 `level` column 到 `skills` table (VARCHAR(8) DEFAULT 'L1')。NCB API 不支援 add-column。

### Q: 認證後前端 fetch 沒帶 cookie
A: 確認 `credentials: "include"`,且 Next.js route 在同 domain (`api.*` 與 frontend 不同 domain 要設 CORS `Access-Control-Allow-Credentials: true` + `Access-Control-Allow-Origin: <exact origin>` 不可用 `*`)。

### Q: Public route 403
A: 該 table 沒設 `public_*` policy。透過 `set_rls_policy` MCP tool 設定。

### Q: 寫入 NCB 後 query 看不到 (1-5s 延遲)
A: NCB V2 eventual consistency 問題。JunAikey 已加 retry (4 次,backoff 500ms-2s) 處理。應用層也應有類似機制。

---

## 7. 參考資源

- `auth_proxy_setup.md` (本 repo 根目錄) - Auth 完整指南
- `data_proxy_setup.md` (本 repo 根目錄) - Data 完整指南
- NCB Dashboard: `https://app.nocodebackend.com`
- NCB Docs: `https://docs.nocodebackend.com`
- JunAikey 模組: `vps/junaikey.mjs` + `vps/junaikey/`
- 通典: `Omniesggo 萬能永續平台 OMN-PRD-001 v1.0`
