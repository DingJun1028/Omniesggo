declare module 'cloudflare:workers' {
  export interface Env {
    OMNI_GATEWAY_KEY?: string;
    OPENROUTER_API_KEY?: string;
    GROQ_API_KEY?: string;
    GEMINI_API_KEY?: string;
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
    DISCORD_ALERT_WEBHOOK_ID?: string;
    DISCORD_ALERT_WEBHOOK_TOKEN?: string;
    AI_CRAWL_CONTROL?: string;
    CF_AI_CRAWL_CONTROL?: string;
    OMNI_KV?: {
      get(key: string, type?: 'text' | 'json' | 'stream' | 'arrayBuffer' | 'kv'): Promise<string | object | null>;
      put(key: string, value: string | ArrayBuffer | ReadableStream, opts?: { expirationTtl?: number }): Promise<void>;
    };
    PRIVATE_API?: { fetch(req: Request): Promise<Response> };
  }
  export interface ExecutionContext { waitUntil(p: Promise<any>): void; passThroughOnException(): void; }
}

declare type KVNamespace = NonNullable<import('cloudflare:workers').Env['OMNI_KV']>;
declare type Fetcher = NonNullable<import('cloudflare:workers').Env['PRIVATE_API']>;
declare type ExecutionContext = import('cloudflare:workers').ExecutionContext;
