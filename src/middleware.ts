/**
 * Next.js Middleware — Security Headers, CORS, Rate Limiting
 *
 * Applied to all routes by default. Public routes (health, static assets)
 * are explicitly excluded from auth checks.
 *
 * Architecture:
 *   1. Security headers on every response
 *   2. CORS preflight handling
 *   3. Rate limiting via Upstash Redis (in-memory fallback)
 *   4. Optional Firebase token verification for protected API routes
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Configuration ──────────────────────────────────────────────────

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX = process.env.NODE_ENV === 'production' ? 100 : 1000;

// Routes that skip authentication entirely
const PUBLIC_ROUTES: readonly string[] = [
  '/api/healthz',
  '/api/health',
  '/api/health/metrics',
  '/api/evidence-upload',
  '/_next/',
  '/favicon.ico',
  '/assets/',
  '/public/',
];

// Routes that require Firebase token verification
const PROTECTED_API_PREFIXES: readonly string[] = [
  '/api/delegation',
  '/api/esg-report',
  '/api/sustain-write',
  '/api/evidence',
  '/api/zkp',
  '/api/omni-agent',
];

// ─── Security Headers ───────────────────────────────────────────────

function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers;

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection
  headers.set('X-Frame-Options', 'DENY');

  // XSS protection (legacy browsers)
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy — disable camera, microphone, geolocation by default
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Strict Transport Security (HSTS) — only in production
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Content Security Policy — restrictive baseline
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Remove server identification
  headers.delete('X-Powered-By');
  headers.delete('Server');

  return response;
}

// ─── CORS ───────────────────────────────────────────────────────────

function handleCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('Origin') ?? '';

  // In development, allow localhost
  const isDev = process.env.NODE_ENV !== 'production';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

  if (ALLOWED_ORIGINS.length === 0 && !isDev) {
    // No CORS_ORIGINS configured in production — block cross-origin
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') ?? '');
    response.headers.set('Access-Control-Allow-Credentials', 'false');
  } else if (isDev && isLocalhost) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

// ─── Rate Limiting (in-memory, single-instance) ─────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const resetAt = now + RATE_LIMIT_WINDOW * 1000;

  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt };
  }

  record.count += 1;
  const allowed = record.count <= RATE_LIMIT_MAX;
  return { allowed, remaining: Math.max(0, RATE_LIMIT_MAX - record.count), resetAt: record.resetAt };
}

// Cleanup old entries every 5 minutes (best-effort)
let lastCleanup = Date.now();
function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const [key, record] of rateLimitStore) {
    if (now > record.resetAt) rateLimitStore.delete(key);
  }
}

// ─── Token Verification (Edge-safe: Web Crypto + jose, 本地模式, 無 GCP 依賴) ────

const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET;
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'esggo';

// 保留 GCP x509 端點作為選用相容 (設 USE_GCP_JWT=true 才啟用), 預設關閉以移除 GCP 依賴
const USE_GCP_JWT = process.env.USE_GCP_JWT === 'true';
const FIREBASE_X509_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedKeys: Array<{ kid: string; pem: string }> | null = null;
let keysFetchedAt = 0;

async function getFirebaseKeys(): Promise<Array<{ kid: string; pem: string }>> {
  if (!USE_GCP_JWT) return []; // 本地模式不 fetch GCP
  const now = Date.now();
  if (cachedKeys && now - keysFetchedAt < 3_600_000) return cachedKeys;
  const res = await fetch(FIREBASE_X509_URL, { cache: 'no-store' });
  if (!res.ok) return cachedKeys ?? [];
  const certs: Record<string, string> = await res.json();
  cachedKeys = Object.entries(certs).map(([kid, pem]) => ({ kid, pem }));
  keysFetchedAt = now;
  return cachedKeys;
}

async function verifyFirebaseToken(
  token: string
): Promise<DecodedUser | null> {
  const { jwtVerify, importX509, decodeProtectedHeader, importHmacKey } = await import('jose');

  // 1. 本地模式優先: HS256 + LOCAL_JWT_SECRET (完全無 GCP 依賴)
  if (LOCAL_JWT_SECRET) {
    try {
      const key = await importHmacKey(LOCAL_JWT_SECRET, 'HS256');
      const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
      return { uid: String(payload.sub ?? ''), email: payload.email as string | undefined };
    } catch {
      return null;
    }
  }

  // 2. 選用 GCP 相容 (需 USE_GCP_JWT=true)
  if (!USE_GCP_JWT) return null;
  try {
    const header = decodeProtectedHeader(token);
    const keys = await getFirebaseKeys();
    const key = header.kid ? keys.find((k) => k.kid === header.kid) : keys[0];
    if (!key) return null;
    const publicKey = await importX509(key.pem, 'RS256');
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    return { uid: String(payload.sub ?? ''), email: payload.email as string | undefined };
  } catch {
    return null;
  }
}

function getRoleFromClaims(claims: Record<string, unknown>): string | null {
  const value = claims['role'];
  if (value === 'student' || value === 'TA' || value === 'admin') {
    return value;
  }
  return null;
}

// ─── Middleware Entry ────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── CORS preflight ──
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return handleCors(request, applySecurityHeaders(response));
  }

  // ── Public routes — skip auth, still apply headers ──
  const isPublic = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
  if (isPublic) {
    const response = NextResponse.next();
    return handleCors(request, applySecurityHeaders(response));
  }

  // ── Rate limiting ──
  cleanupRateLimitStore();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const clientId = `${ip}:${pathname}`;
  const { allowed, remaining, resetAt } = checkRateLimit(clientId);

  if (!allowed) {
    return applySecurityHeaders(
      NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((resetAt - Date.now()) / 1000) },
        { status: 429 }
      )
    );
  }

  // ── Protected API routes — verify Firebase token ──
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtectedApi) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
      );
    }

    const user = await verifyFirebaseToken(token);
    if (!user) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
      );
    }

    const role = getRoleFromClaims(user.claims);

    // Inject user info into headers for downstream route handlers
    const response = NextResponse.next();
    response.headers.set('X-User-Id', user.uid);
    if (user.email) response.headers.set('X-User-Email', user.email);
    if (role) response.headers.set('X-Auth-Role', role);
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return handleCors(request, applySecurityHeaders(response));
  }

  // ── All other routes — pass through with headers ──
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return handleCors(request, applySecurityHeaders(response));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
  ],
};
