# NoCodeBackend Auth Proxy Setup Guide

> **IMPORTANT:** Save this file as `auth_proxy_setup.md` in your project root.

## Overview

The auth proxy handles user authentication by proxying requests to NCB Auth API and managing session cookies.

**Key Points:**
- Session cookies are the only authentication mechanism needed
- NCB accepts cookies in BOTH formats:
  - `better-auth.session_token` (without prefix)
  - `__Secure-better-auth.session_token` (with prefix)
- NCB dynamically finds any cookie ending with `better-auth.session_token`

---

## Environment Variables

Create `.env.local` in the project root:

```env
NCB_INSTANCE=54686_junaikey
NCB_AUTH_API_URL=https://app.nocodebackend.com/api/user-auth
NCB_DATA_API_URL=https://app.nocodebackend.com/api/data
NCB_APP_URL=https://app.nocodebackend.com
NCB_SECRET_KEY=<the server-only key returned by create_database>
```

**Rules:**
- Read values only from `process.env`
- Do NOT hardcode values
- Do NOT expose to client
- Do NOT use `NEXT_PUBLIC_*`
- `NCB_SECRET_KEY` is required by the Account gateway and must remain server-only

---

## Create Auth Proxy Route

Create the file at: `app/api/auth/[...path]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";

const CONFIG = {
  instance: process.env.NCB_INSTANCE!,
  apiUrl: process.env.NCB_AUTH_API_URL!,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path.join("/"));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");

  // Special handling for sign-out
  if (pathStr === "sign-out") {
    return handleSignOut(req);
  }

  return proxy(req, pathStr, await req.text());
}

/**
 * Extract only better-auth cookies from the request.
 * NCB accepts cookies as-is (with or without __Secure- prefix).
 */
function extractAuthCookies(cookieHeader: string): string {
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

/**
 * Transform Set-Cookie headers from NCB for localhost compatibility.
 * NCB sends cookies with __Secure- prefix which browsers reject on localhost.
 */
function transformSetCookieForLocalhost(cookie: string): string {
  const parts = cookie.split(";");
  const nameValue = parts[0].trim();

  // Strip __Secure- or __Host- prefix from cookie name
  let cleanedNameValue = nameValue;
  if (nameValue.startsWith("__Secure-better-auth.")) {
    cleanedNameValue = nameValue.replace("__Secure-", "");
  } else if (nameValue.startsWith("__Host-better-auth.")) {
    cleanedNameValue = nameValue.replace("__Host-", "");
  }

  // Filter out attributes that don't work on localhost
  const otherAttributes = parts.slice(1)
    .map(attr => attr.trim())
    .filter(attr => {
      const lower = attr.toLowerCase();
      return !lower.startsWith("domain=") &&
             !lower.startsWith("secure") &&
             !lower.startsWith("samesite=");
    });

  // Add SameSite=Lax for localhost
  otherAttributes.push("SameSite=Lax");

  return [cleanedNameValue, ...otherAttributes].join("; ");
}

// Sign-out handler that always returns 200 and clears cookies
async function handleSignOut(req: NextRequest) {
  const response = new NextResponse(
    JSON.stringify({ success: true }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );

  // Try to call upstream sign-out
  try {
    const searchParams = new URLSearchParams();
    searchParams.set("Instance", CONFIG.instance);
    const url = `${CONFIG.apiUrl}/sign-out?${searchParams.toString()}`;
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const authCookies = extractAuthCookies(req.headers.get("cookie") || "");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Database-Instance": CONFIG.instance,
        "Cookie": authCookies,
        "Origin": origin,
      },
      body: "{}",
    });

    // Forward any Set-Cookie headers from upstream
    const cookies = res.headers.getSetCookie?.() || [];
    for (const cookie of cookies) {
      response.headers.append("Set-Cookie", transformSetCookieForLocalhost(cookie));
    }
  } catch {
    // Ignore upstream errors
  }

  // Always clear auth cookies
  const cookiesToClear = [
    "better-auth.session_token",
    "better-auth.session_data",
  ];

  for (const cookieName of cookiesToClear) {
    response.headers.append(
      "Set-Cookie",
      `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    );
  }

  return response;
}

async function proxy(req: NextRequest, path: string, body?: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("Instance", CONFIG.instance);
  const url = `${CONFIG.apiUrl}/${path}?${searchParams.toString()}`;
  const origin = req.headers.get("origin") || req.nextUrl.origin;

  const authCookies = extractAuthCookies(req.headers.get("cookie") || "");

  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      "Cookie": authCookies,
      "Origin": origin,
    },
    body: body || undefined,
  });

  const data = await res.text();
  const response = new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });

  // Transform Set-Cookie headers for localhost compatibility
  const cookies = res.headers.getSetCookie?.() || [];
  for (const cookie of cookies) {
    response.headers.append("Set-Cookie", transformSetCookieForLocalhost(cookie));
  }

  return response;
}
```

---

## Cookie Handling

### When Receiving from NCB (Set-Cookie)

NCB sends cookies with `__Secure-` prefix. For localhost compatibility:
- Strip `__Secure-` and `__Host-` prefixes
- Strip `Domain` attribute
- Strip `Secure` flag
- Set `SameSite=Lax`

### When Forwarding to NCB

NCB accepts cookies in BOTH formats:
- `better-auth.session_token` (without prefix)
- `__Secure-better-auth.session_token` (with prefix)

Simply forward the cookies as stored in the browser.

---

## Auth Providers Endpoint (REQUIRED — CREATE FIRST)

**CRITICAL:** You MUST fetch available auth providers from the server and only render the enabled ones. NEVER hardcode auth buttons.

Create `app/api/auth-providers/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const url = `${process.env.NCB_AUTH_API_URL}/providers?instance=${process.env.NCB_INSTANCE}`;
  const res = await fetch(url);
  const data = await res.json();
  return NextResponse.json(data);
}
```

### Response Format

```json
{
  "providers": {
    "email": true,
    "google": false,
    "emailOTP": false
  }
}
```

### Provider Types

| Provider Key | Auth Method | When `true` |
|-------------|-------------|-------------|
| `email` | Email + Password | Show email/password sign-in and sign-up forms |
| `google` | Google OAuth | Show "Sign in with Google" button |
| `emailOTP` | Email OTP (passwordless) | Show "Sign in with Email OTP" flow (email → 6-digit code) |

**IMPORTANT:** These are THREE separate and distinct providers. `email` (password-based) and `emailOTP` (passwordless code) are DIFFERENT — do NOT confuse them.

---

## Authentication Usage

### Session Retrieval

```typescript
const res = await fetch("/api/auth/get-session", {
  credentials: "include",
});
const session = await res.json();

if (session.user) {
  // User is logged in
} else {
  // User is logged out
}
```

### 1. Email + Password (provider key: `email`)

Only render if `providers.email === true`.

#### Sign In
```typescript
const res = await fetch("/api/auth/sign-in/email", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

#### Sign Up
```typescript
const res = await fetch("/api/auth/sign-up/email", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, name }),
});
```

### 2. Google OAuth (provider key: `google`)

Only render if `providers.google === true`.

```typescript
window.location.href = `/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(window.location.origin + "/auth/callback")}`;
```

Create callback page at `app/auth/callback/page.tsx`:
```typescript
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard"); }, [router]);
  return <div>Authenticating...</div>;
}
```

### 3. Email OTP — Passwordless (provider key: `emailOTP`)

Only render if `providers.emailOTP === true`. This is a 2-step flow — completely separate from email+password.

**Step 1 — Send OTP:**
```typescript
const res = await fetch("/api/auth/email-otp/send-verification-otp", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, type: "sign-in" }),
});
```

**Step 2 — Verify OTP:**
```typescript
const res = await fetch("/api/auth/sign-in/email-otp", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, otp }), // 6-digit code
});
```

**Notes:** `type: "sign-in"` auto-creates user if new. OTP is 6 digits, expires in 5 minutes. No password needed.

### Sign Out (all providers)

```typescript
await fetch("/api/auth/sign-out", { method: "POST", credentials: "include" });
window.location.href = "/";
```

---

## Rendering Auth UI (MUST follow this pattern)

**CRITICAL:** Always fetch providers FIRST, then conditionally render ONLY the enabled auth methods.

```typescript
"use client";
import { useEffect, useState } from "react";

type Providers = { email?: boolean; google?: boolean; emailOTP?: boolean };

export default function AuthPage() {
  const [providers, setProviders] = useState<Providers | null>(null);

  useEffect(() => {
    fetch("/api/auth-providers")
      .then(res => res.json())
      .then(data => setProviders(data.providers || {}))
      .catch(() => setProviders({ email: true }));
  }, []);

  if (!providers) return <div>Loading...</div>;

  return (
    <div>
      {providers.google && <GoogleSignInButton />}
      {providers.emailOTP && <EmailOTPForm />}
      {providers.email && <EmailPasswordForm />}
    </div>
  );
}
```

**Rules:**
- NEVER show a Google button if `providers.google` is not `true`
- NEVER show an Email+Password form if `providers.email` is not `true`
- NEVER show an Email OTP form if `providers.emailOTP` is not `true`
- ALWAYS fetch from `/api/auth-providers` on page load — do NOT hardcode

---

## Completion Checklist

Auth proxy setup is complete when:
- [ ] `/api/auth-providers` endpoint created and returns provider list
- [ ] UI fetches providers on load and ONLY renders enabled auth methods
- [ ] Email+Password sign-in/sign-up works (if `email` enabled)
- [ ] Google OAuth redirect and callback works (if `google` enabled)
- [ ] Email OTP send + verify flow works (if `emailOTP` enabled)
- [ ] `/api/auth/get-session` returns user info
- [ ] Page refresh keeps user logged in
- [ ] Sign-out clears cookies and UI state

---

## 4. Auth Endpoints Cheat Sheet

Once your proxy is set up at `/api/auth/[...path]`, you can call these endpoints from your frontend components:

### Standard Email/Password
- **Sign Up:** `POST /api/auth/sign-up` (body: `{ email, password, name }`)
- **Sign In:** `POST /api/auth/sign-in/email` (body: `{ email, password }`)
- **Sign Out:** `POST /api/auth/sign-out`

### Passwordless (Email OTP)
- **Send OTP:** `POST /api/auth/email-otp/send-verification-otp` (body: `{ email, type: "sign-in" }`)
- **Verify OTP:** `POST /api/auth/sign-in/email-otp` (body: `{ email, otp }`)

### Social OAuth
- **Google Login:** `GET /api/auth/sign-in/google`
  *(Note: Social logins often require redirect handling. Make sure you set up an OAuth callback page.)*

### Config / Providers
- **Get Enabled Providers:** `GET /api/auth-providers` (Custom proxy route to fetch `{ email: true, google: false, ... }`)

---

## Next Step

Proceed to `data_proxy_setup.md` for CRUD operations.
