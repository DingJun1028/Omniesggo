// ═══════════════════════════════════════════════════════════════
// @esggo/shared/config — Unified Configuration Module
// Single Source of Truth for all environment variables
// ═══════════════════════════════════════════════════════════════

export interface EsggoConfig {
  // ── App ──
  app: {
    url: string;
    port: number;
    nodeEnv: 'development' | 'production' | 'test';
    isProduction: boolean;
    isDevelopment: boolean;
  };

  // ── Database (PostgreSQL via Prisma) ──
  database: {
    url: string;
    directUrl?: string;
    omniUrl?: string;
  };

  // ── Redis ──
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    url?: string;
    upstashRestUrl?: string;
    upstashRestToken?: string;
  };

  // ── Firebase ──
  firebase: {
    projectId?: string;
    apiKey?: string;
    serviceAccountJson?: string;
    authDomain?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };

  // ── Supabase ──
  supabase: {
    url?: string;
    anonKey?: string;
    serviceRoleKey?: string;
  };

  // ── AI Providers ──
  ai: {
    openrouterApiKey?: string;
    groqApiKey?: string;
    geminiApiKey?: string;
    cloudflareAccountId?: string;
    cloudflareApiKey?: string;
    freeTierOnly: boolean;
  };

  // ── Gateway ──
  gateway: {
    url: string;
    apiKey?: string;
    port: number;
  };

  // ── NCB (NoCodeBackend) ──
  ncb: {
    appId?: string;
    appKey?: string;
    baseUrl?: string;
  };

  // ── Notion ──
  notion: {
    workspaceId?: string;
    apiSecret?: string;
  };

  // ── Observability ──
  otel: {
    endpoint?: string;
    serviceName: string;
  };
}

function env(key: string, fallback?: string): string | undefined {
  return process.env[key] || fallback;
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key];
  if (!val) return fallback;
  return val === 'true' || val === '1';
}

let _config: EsggoConfig | null = null;

/**
 * Get the unified configuration. Cached after first call.
 */
export function getConfig(): EsggoConfig {
  if (_config) return _config;

  _config = {
    app: {
      url: env('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')!,
      port: envInt('PORT', 3000),
      nodeEnv: (env('NODE_ENV', 'development') as EsggoConfig['app']['nodeEnv']),
      get isProduction() { return this.nodeEnv === 'production'; },
      get isDevelopment() { return this.nodeEnv === 'development'; },
    },

    database: {
      url: env('DATABASE_URL', '')!,
      directUrl: env('DIRECT_URL'),
      omniUrl: env('OMNI_DATABASE_URL'),
    },

    redis: {
      host: env('REDIS_HOST', 'localhost')!,
      port: envInt('REDIS_PORT', 6379),
      password: env('REDIS_PASSWORD'),
      db: envInt('REDIS_DB', 0),
      url: env('REDIS_URL'),
      upstashRestUrl: env('UPSTASH_REDIS_REST_URL'),
      upstashRestToken: env('UPSTASH_REDIS_REST_TOKEN'),
    },

    firebase: {
      projectId: env('NEXT_PUBLIC_FIREBASE_PROJECT_ID') || env('FIREBASE_PROJECT_ID'),
      apiKey: env('NEXT_PUBLIC_FIREBASE_API_KEY'),
      serviceAccountJson: env('FIREBASE_SERVICE_ACCOUNT_JSON'),
      authDomain: env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      storageBucket: env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      appId: env('NEXT_PUBLIC_FIREBASE_APP_ID'),
    },

    supabase: {
      url: env('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      serviceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY'),
    },

    ai: {
      openrouterApiKey: env('OPENROUTER_API_KEY'),
      groqApiKey: env('GROQ_API_KEY'),
      geminiApiKey: env('GEMINI_API_KEY') || env('GOOGLE_AI_API_KEY'),
      cloudflareAccountId: env('CLOUDFLARE_ACCOUNT_ID'),
      cloudflareApiKey: env('CLOUDFLARE_API_KEY'),
      freeTierOnly: envBool('FREE_TIER_ONLY', true),
    },

    gateway: {
      url: env('GATEWAY_URL', 'http://localhost:8642')!,
      apiKey: env('GATEWAY_API_KEY') || env('OMNI_KEY'),
      port: envInt('GATEWAY_PORT', 8642),
    },

    ncb: {
      appId: env('NCB_APP_ID'),
      appKey: env('NCB_APP_KEY'),
      baseUrl: env('NCB_BASE_URL'),
    },

    notion: {
      workspaceId: env('NOTION_WORKSPACE_ID'),
      apiSecret: env('NOTION_API_SECRET'),
    },

    otel: {
      endpoint: env('OTEL_EXPORTER_OTLP_ENDPOINT'),
      serviceName: env('OTEL_SERVICE_NAME', 'omnicore')!,
    },
  };

  return _config;
}

/**
 * Check if a config section is properly configured.
 */
export function checkConfig(
  section: keyof EsggoConfig
): { configured: boolean; missing: string[] } {
  const config = getConfig();
  const sectionConfig = config[section] as Record<string, unknown>;
  const missing: string[] = [];

  for (const [key, value] of Object.entries(sectionConfig)) {
    if (value === undefined || value === null || value === '') {
      missing.push(key);
    }
  }

  return {
    configured: missing.length === 0,
    missing,
  };
}
