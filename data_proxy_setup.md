# NoCodeBackend Data Proxy Setup Guide

> **IMPORTANT:** Save this file as `data_proxy_setup.md` in your project root.

## Overview

NCB provides **two data routes** for different access patterns:

1. **`/api/data/[...path]`** - Authenticated route. Requires session. Uses session-based RLS by default. For `shared_*` tables, skips user_id filtering so admins can see each other's data.
2. **`/api/public-data/[...path]`** - Public route. No session required. Only works for tables with a `public_*` policy in `ncba_rls_config`.

**Note:** NCB accepts cookies in both formats:
- `better-auth.session_token` (without prefix)
- `__Secure-better-auth.session_token` (with prefix)

NCB dynamically finds any cookie ending with `better-auth.session_token`.

---

## Environment Variables

```env
NCB_INSTANCE=54686_junaikey
NCB_AUTH_API_URL=https://app.nocodebackend.com/api/user-auth
NCB_DATA_API_URL=https://app.nocodebackend.com/api/data
NCB_APP_URL=https://app.nocodebackend.com
```

---

## RLS Policy Types

### Shared Policies (authenticated route — cross-admin access)

| Policy | Auth Required | Read | Write | user_id Filter |
|--------|-------------|------|-------|----------------|
| *(not in config)* | Yes | Own only | Own only | `WHERE user_id = session_user` |
| `shared_read` | Yes | All admins' records | Own only | No filter for reads |
| `shared_readwrite` | Yes | All admins' records | All admins' records | No filter at all |

### Public Policies (public route — anonymous access)

| Policy | Public Read | Public Write | Scoped to Owner |
|--------|-----------|-------------|-----------------|
| *(not in config)* | No | No | N/A (Private) |
| `public_read` | Yes (all records) | No | No |
| `public_write` | No | Yes (no owner) | No |
| `public_readwrite` | Yes (all records) | Yes (no owner) | No |
| `public_scoped_read` | Yes (owner's records) | No | Yes (`owner_id` required) |
| `public_scoped_write` | No | Yes (assigned to owner) | Yes (`owner_id` required) |
| `public_scoped_readwrite` | Yes (owner's records) | Yes (assigned to owner) | Yes (`owner_id` required) |

**IMPORTANT:** These policies ONLY affect the public route. The authenticated route ALWAYS uses session-based RLS.

**Combining policies:** You can combine one `shared_*` + one `public_*` policy (stored comma-separated, e.g. `"shared_read,public_scoped_read"`). Within each group, pick only one.

### Auto-Setting Policies (IMPORTANT for AI tools)

**You MUST set the correct RLS policy using the `set_rls_policy` MCP tool whenever the app requires non-private access.**

| App Requirement | Table Example | Policy to Set |
|----------------|---------------|---------------|
| Public blog / marketplace (anyone reads) | posts, products | `public_read` |
| Public booking page (scoped to one admin) | event_types | `public_scoped_read` |
| Public booking form (creates for an admin) | bookings | `public_scoped_write` |
| Public contact/feedback form | feedback, contact | `public_write` |
| Team dashboard (admins see all data) | any shared table | `shared_read` |
| Combined: team + public on same table | event_types | `shared_read,public_scoped_read` |
| Private (DEFAULT — no action needed) | any table | `private` |

Call `set_rls_policy` with: `{ database, table, policy }`. The policy MUST be set BEFORE the public route will serve data for that table.

---

## Authenticated Data Proxy (REQUIRED)

**Path:** `app/api/data/[...path]/route.ts`

This route is for **authenticated users** (admin panel, dashboard, etc.). Session is ALWAYS required.

**Behavior:**
- **Private tables** (default): Normal RLS — `WHERE user_id = session_user`
- **`shared_read` tables**: Reads return all admins' records. Writes still inject user_id from session.
- **`shared_readwrite` tables**: No user_id filter for any operation.
- **`public_*` tables**: Treated as private on the authenticated route (normal session RLS).

The **backend** handles all policy logic by reading `ncba_rls_config` itself — no custom headers needed from the proxy.

### Shared Utilities

Create `lib/ncb-utils.ts` with these helpers used by BOTH proxies:

```typescript
// lib/ncb-utils.ts
import { NextRequest, NextResponse } from "next/server";

export const CONFIG = {
  instance: process.env.NCB_INSTANCE!,
  dataApiUrl: process.env.NCB_DATA_API_URL!,
  authApiUrl: process.env.NCB_AUTH_API_URL!,
  appUrl: process.env.NCB_APP_URL || "https://app.nocodebackend.com",
};

export function extractAuthCookies(cookieHeader: string): string {
  if (!cookieHeader) return "";
  const cookies = cookieHeader.split(";");
  const authCookies: string[] = [];
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith("better-auth.session_token=") ||
        trimmed.startsWith("better-auth.session_data=")) {
      authCookies.push(trimmed);
    }
  }
  return authCookies.join("; ");
}

export async function getSessionUser(cookieHeader: string): Promise<{ id: string } | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;
  const url = `${CONFIG.authApiUrl}/get-session?instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      "Cookie": authCookies,
      "Authorization": `Bearer ${process.env.NCB_SECRET_KEY}`
    },
  });
  if (res.ok) {
    const data = await res.json();
    return data.user || null;
  }
  return null;
}

export async function proxyToNCB(
  req: NextRequest,
  path: string,
  body?: string,
) {
  const searchParams = new URLSearchParams();
  searchParams.set("instance", CONFIG.instance);
  req.nextUrl.searchParams.forEach((val, key) => {
    if (key.toLowerCase() !== "instance") searchParams.append(key, val);
  });
  const url = `${CONFIG.dataApiUrl}/${path}?${searchParams.toString()}`;
  const origin = req.headers.get("origin") || req.nextUrl.origin;
  const cookieHeader = req.headers.get("cookie") || "";
  const authCookies = extractAuthCookies(cookieHeader);
  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      "Cookie": authCookies,
      "Origin": origin,
      "Authorization": `Bearer ${process.env.NCB_SECRET_KEY}`
    },
    body: body || undefined,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function proxyToNCBPublic(
  req: NextRequest,
  path: string,
  body?: string,
) {
  const searchParams = new URLSearchParams();
  searchParams.set("instance", CONFIG.instance);
  req.nextUrl.searchParams.forEach((val, key) => {
    if (key.toLowerCase() !== "instance") searchParams.append(key, val);
  });
  const url = `${CONFIG.dataApiUrl}/${path}?${searchParams.toString()}`;
  const origin = req.headers.get("origin") || req.nextUrl.origin;
  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      "Origin": origin,
      "Authorization": `Bearer ${process.env.NCB_SECRET_KEY}`
      // NO cookies forwarded — anonymous request
    },
    body: body || undefined,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

// --- RLS Policy Cache ---
type RlsPolicies = Record<string, string>;
let cachedPolicies: RlsPolicies | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 60_000; // 1 minute

export async function getRlsPolicies(): Promise<RlsPolicies> {
  const now = Date.now();
  if (cachedPolicies && now < cacheExpiry) return cachedPolicies;
  try {
    const url = `${CONFIG.appUrl}/api/public/rls-policies?instance=${CONFIG.instance}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      cachedPolicies = (data.policies || {}) as RlsPolicies;
      cacheExpiry = now + CACHE_TTL;
      return cachedPolicies;
    }
  } catch {}
  return cachedPolicies || {};
}

export function extractTableFromPath(pathStr: string): string {
  const segments = pathStr.split("/");
  return segments[1] || "";
}

/**
 * Parse a policy string (may be comma-separated for combined policies).
 * E.g. "shared_read,public_scoped_read" → ["shared_read", "public_scoped_read"]
 */
function parsePolicies(policy?: string): string[] {
  if (!policy) return [];
  return policy.split(",").map(p => p.trim()).filter(Boolean);
}

export function allowsPublicRead(policy?: string): boolean {
  const parts = parsePolicies(policy);
  return parts.some(p => ["public_read", "public_readwrite", "public_scoped_read", "public_scoped_readwrite"].includes(p));
}

export function allowsPublicWrite(policy?: string): boolean {
  const parts = parsePolicies(policy);
  return parts.some(p => ["public_write", "public_readwrite", "public_scoped_write", "public_scoped_readwrite"].includes(p));
}

export function requiresOwnerScope(policy?: string): boolean {
  const parts = parsePolicies(policy);
  return parts.some(p => ["public_scoped_read", "public_scoped_write", "public_scoped_readwrite"].includes(p));
}

// Note: isSharedRead/isSharedWrite removed — backend handles shared logic itself.
```

### Authenticated Proxy Code

```typescript
// app/api/data/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, proxyToNCB } from "@/lib/ncb-utils";

const UNAUTHORIZED = (msg = "Unauthorized") =>
  new NextResponse(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join("/");
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();
  return proxyToNCB(req, path.join("/"));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join("/");
  const body = await req.text();
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();

  if (pathStr.startsWith("create/") && body) {
    try {
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      parsed.user_id = user.id;
      return proxyToNCB(req, pathStr, JSON.stringify(parsed));
    } catch {}
  }
  return proxyToNCB(req, pathStr, body);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join("/");
  const body = await req.text();
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();

  if (body) {
    try {
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      return proxyToNCB(req, pathStr, JSON.stringify(parsed));
    } catch {}
  }
  return proxyToNCB(req, pathStr, body);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();
  return proxyToNCB(req, path.join("/"));
}
```

---

## Public Data Proxy (REQUIRED for apps with public pages)

**Path:** `app/api/public-data/[...path]/route.ts`

This route is for **anonymous/unauthenticated access** (public booking pages, storefronts, blogs, etc.). No session required. Only works for tables with a public policy configured in NCB.

```typescript
// app/api/public-data/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  proxyToNCBPublic,
  getRlsPolicies,
  extractTableFromPath,
  allowsPublicRead,
  allowsPublicWrite,
  requiresOwnerScope,
} from "@/lib/ncb-utils";

const json = (body: object, status = 200) =>
  new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join("/");
  const table = extractTableFromPath(pathStr);
  if (!table) return json({ error: "Invalid path" }, 400);

  const policies = await getRlsPolicies();
  const policy = policies[table];
  if (!allowsPublicRead(policy)) {
    return json({ error: "This table does not allow public read access" }, 403);
  }

  if (requiresOwnerScope(policy)) {
    const ownerId = req.nextUrl.searchParams.get("owner_id");
    if (!ownerId) return json({ error: "owner_id query parameter is required for this table" }, 400);
  }

  return proxyToNCBPublic(req, pathStr);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join("/");
  const table = extractTableFromPath(pathStr);
  const body = await req.text();
  if (!table) return json({ error: "Invalid path" }, 400);
  if (!pathStr.startsWith("create/")) {
    return json({ error: "Public route only allows create operations" }, 403);
  }

  const policies = await getRlsPolicies();
  const policy = policies[table];
  if (!allowsPublicWrite(policy)) {
    return json({ error: "This table does not allow public write access" }, 403);
  }

  if (requiresOwnerScope(policy) && body) {
    try {
      const parsed = JSON.parse(body);
      const ownerId = parsed.owner_id;
      if (!ownerId) return json({ error: "owner_id is required in the body for this table" }, 400);
      delete parsed.owner_id;
      delete parsed.user_id;
      parsed.user_id = ownerId;
      return proxyToNCBPublic(req, pathStr, JSON.stringify(parsed));
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
  }

  if (body) {
    try {
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      delete parsed.owner_id;
      return proxyToNCBPublic(req, pathStr, JSON.stringify(parsed));
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
  }

  return proxyToNCBPublic(req, pathStr, body);
}

// Public route does NOT support PUT or DELETE for security.
```

---

## Frontend Usage

### Authenticated routes (admin panel / dashboard)

**Important Rules for NCB Data API:**
1. **Action Prefixes:** Unlike standard REST APIs, ALL routes must be prefixed with their action (`/read/`, `/create/`, `/update/`, `/delete/`).
2. **Single Item Fetching:** To fetch a single item, use `?id=1` instead of `/1`. (e.g., `/read/products?id=1`).
3. **Response Structure:** Queries always return JSON in the format: `{ status: "success", data: [...], metadata: {...} }`.

Always include `credentials: "include"` when calling the authenticated data proxy:

```typescript
// Read Multiple (RLS filters by session user)
const res = await fetch("/api/data/read/products", { credentials: "include" });
const { data, metadata } = await res.json();
console.log("Products:", data);

// Read Single (Use ?id=1, NOT /1)
const singleRes = await fetch("/api/data/read/products?id=123", { credentials: "include" });
const { data: [product] } = await singleRes.json();
console.log("Product:", product);

// Create (user_id injected from session)
const res = await fetch("/api/data/create/products", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "My Product", price: 9.99 }),
});

// Update (Requires /update/ prefix and the ID parameter)
const res = await fetch("/api/data/update/products/123", {
  method: "PUT",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Updated Title" }),
});

// Delete (Requires /delete/ prefix and the ID parameter)
const res = await fetch("/api/data/delete/products/123", {
  method: "DELETE",
  credentials: "include",
});
```

### Public routes (anonymous pages - no credentials needed)

```typescript
// PUBLIC READ (unscoped) - blog posts, marketplace
const res1 = await fetch("/api/public-data/read/posts");
const { data: posts } = await res1.json();

// PUBLIC READ (scoped) - booking page, storefront
const res2 = await fetch(`/api/public-data/read/event_types?owner_id=${adminUserId}`);
const { data: eventTypes } = await res2.json();


// PUBLIC CREATE (unscoped) - feedback, waitlist
const res3 = await fetch("/api/public-data/create/feedback", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Great!", email: "user@example.com" }),
});
const { status, summary, errors } = await res3.json();

// PUBLIC CREATE (scoped) - booking for a specific admin
const res4 = await fetch("/api/public-data/create/bookings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "John",
    email: "john@example.com",
    date: "2026-03-15",
    owner_id: adminUserId, // Required - assigns booking to this admin
  }),
});
const response = await res4.json();
```

---

## How RLS Works

### Authenticated Route (`/api/data/`)
1. Proxy validates session and gets user ID
2. Forwards session cookies to NCB
3. NCB applies `WHERE user_id = <session_user_id>`
4. Admin only sees their own records

### Public Route (`/api/public-data/`)
1. Proxy checks `ncba_rls_config` for the table's policy
2. If no public policy → 403
3. **Unscoped** policies: NCB serves all records (no `user_id` filter)
4. **Scoped** policies: NCB applies `WHERE user_id = <owner_id>` from the `owner_id` query parameter

**Admin isolation is NEVER broken.** The authenticated route always uses session RLS regardless of any policy.

---

## 3. Data API Endpoints Cheat Sheet

When making requests from your frontend to your `/api/data` proxy, use the following HTTP methods and URL paths.
*(Note: Your AI agent must construct frontend `fetch` calls exactly like this!)*

- **Read/List Records:** `GET /api/data/read/YOUR_TABLE_NAME`
- **Get Single Record:** `GET /api/data/read/YOUR_TABLE_NAME?id=123`
- **Create Record:** `POST /api/data/create/YOUR_TABLE_NAME` (body: `{ column: "value" }`)
- **Update Record:** `POST /api/data/update/YOUR_TABLE_NAME?id=123` (body: `{ column: "new_value" }`)
- **Delete Record:** `POST /api/data/delete/YOUR_TABLE_NAME?id=123`

---

## 4. Handling File / Media Uploads (Cloudflare R2 Storage)

Does your application require file, image, avatar, document, or media uploads (or have columns of type `FILE`)?

- **If NO (no file uploads):** No Cloudflare R2 setup is needed. You can skip this section.
- **If YES (app requires file uploads):**

### Step A: Configure R2 Storage via `setup_r2_storage` Tool
Before uploading files, configure Cloudflare R2 storage for this database:
- **Auto-reuse**: Call `setup_r2_storage` with `{ "database": "54686_junaikey" }`. If your NoCodeBackend account already has a Cloudflare R2 connection from any database, it will automatically reuse your credentials, create a brand-new dedicated bucket (`54686_junaikey-storage`), and configure CORS policies.
- **First-time setup**: If no Cloudflare account has been connected yet, the tool will ask for your Cloudflare credentials (`account_id`, `access_key_id`, `secret_access_key`), or you can configure it via the NoCodeBackend Dashboard at `https://app.nocodebackend.com/r2-storage`.

### Step B: Uploading Files via MCP Tool (AI Agents)
During development, testing, or mock data generation, use the `upload_file` MCP tool to upload files directly to Cloudflare R2 storage or generate presigned upload URLs.

### Step C: Frontend Application Uploads
**How to upload files via proxy:**
1. Send a `POST /api/data/upload` request with `multipart/form-data`.
2. Ensure the file is appended under the key `"file"` (e.g. `formData.append("file", fileObj)`).
3. The server uploads it to Cloudflare R2 and returns: `{ success: true, url: "https://..." }`.
4. Take the returned `url` string and pass it when you create or update the record.

Example frontend upload logic:
```javascript
const formData = new FormData();
formData.append("file", fileObject);

const uploadRes = await fetch("/api/data/upload", {
  method: "POST",
  body: formData
});
const { url } = await uploadRes.json();

// Now save `url` in your record
await fetch("/api/data/create/your_table", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ file_column: url, ... })
});
```
