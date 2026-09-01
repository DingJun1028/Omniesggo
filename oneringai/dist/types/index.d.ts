/**
 * Core types and interfaces for the OneRingAI unified agent library.
 * These are the fundamental building blocks that all other modules depend on.
 */
/**
 * Supported AI vendors/providers
 */
export declare enum Vendor {
    OpenAI = "openai",
    Anthropic = "anthropic",
    Google = "google",
    Vertex = "vertex",
    Groq = "groq",
    Together = "together",
    Perplexity = "perplexity",
    Grok = "grok",
    DeepSeek = "deepseek",
    Mistral = "mistral",
    Ollama = "ollama",
    Custom = "custom"
}
/**
 * Service types for external APIs (connectors)
 */
export declare enum Services {
    Serper = "serper",
    Brave = "brave",
    Tavily = "tavily",
    RapidAPI = "rapidapi",
    Zenrows = "zenrows",
    JinaReader = "jinareader",
    Firecrawl = "firecrawl",
    ScrapingBee = "scrapingbee",
    Github = "github",
    Gitlab = "gitlab",
    Slack = "slack",
    Discord = "discord",
    Telegram = "telegram",
    Twilio = "twilio",
    Zoom = "zoom",
    Microsoft = "microsoft",
    GoogleAPI = "google-api",
    Notion = "notion",
    Asana = "asana",
    Airtable = "airtable",
    Trello = "trello",
    Salesforce = "salesforce",
    HubSpot = "hubspot",
    Zendesk = "zendesk",
    Intercom = "intercom",
    Stripe = "stripe",
    PayPal = "paypal",
    QuickBooks = "quickbooks",
    Ramp = "ramp",
    AWS = "aws",
    Cloudflare = "cloudflare",
    Dropbox = "dropbox",
    Box = "box",
    SendGrid = "sendgrid",
    Mailchimp = "mailchimp",
    Postmark = "postmark",
    Mailgun = "mailgun",
    EmailBison = "emailbison",
    Datadog = "datadog",
    PagerDuty = "pagerduty",
    Sentry = "sentry",
    Jira = "jira",
    Linear = "linear",
    Bitbucket = "bitbucket",
    Confluence = "confluence",
    CalCom = "calcom",
    Calendly = "calendly"
}
/**
 * Authentication configuration for a connector
 */
export type AuthConfig = {
    type: 'api_key';
    apiKey: string;
} | {
    type: 'oauth';
    flow: 'authorization_code';
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    authorizationUrl: string;
    tokenUrl: string;
    scope?: string | string[];
} | {
    type: 'oauth';
    flow: 'client_credentials';
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scope?: string | string[];
} | {
    type: 'oauth';
    flow: 'implicit';
    clientId: string;
    redirectUri: string;
    authorizationUrl: string;
    scope?: string | string[];
} | {
    type: 'none';
} | {
    type: 'bearer';
    token: string;
};
/**
 * Connector configuration
 */
export interface ConnectorConfig {
    readonly name: string;
    readonly vendor?: Vendor;
    readonly serviceType?: Services;
    readonly auth: AuthConfig;
    readonly baseURL?: string;
    readonly options?: Record<string, unknown>;
    readonly config?: Record<string, unknown>;
    readonly tags?: string[];
    readonly readonly?: boolean;
}
/**
 * Connector access context for scoped registry
 */
export interface ConnectorAccessContext {
    readonly userId?: string;
    readonly tenantId?: string;
    readonly roles?: string[];
    readonly [key: string]: unknown;
}
/**
 * Identity for restricting agent connector access
 */
export interface AgentIdentity {
    readonly connector: string;
    readonly accountId?: string;
    readonly toolFilter?: string[];
}
/**
 * Tool function definition (vendor-neutral)
 */
export interface ToolFunction {
    definition: {
        type: 'function';
        function: {
            name: string;
            description?: string;
            parameters: {
                type: 'object';
                properties: Record<string, unknown>;
                required?: string[];
                additionalProperties?: boolean;
            };
        };
    };
    execute: (args: Record<string, unknown>) => Promise<unknown>;
    permission?: {
        scope: 'always' | 'session' | 'once';
        riskLevel: 'low' | 'medium' | 'high';
        approvalMessage?: string;
        sensitiveArgs?: string[];
    };
    readonly id?: string;
    readonly source?: string;
}
/**
 * Agent creation options
 */
export interface AgentCreateOptions {
    readonly connector: string;
    readonly model: string;
    readonly userId?: string;
    readonly identities?: AgentIdentity[];
    readonly tools?: ToolFunction[];
    readonly instructions?: string | string[];
    readonly systemPrompt?: string;
    readonly temperature?: number;
    readonly maxOutputTokens?: number;
    readonly topP?: number;
    readonly thinking?: {
        enabled: boolean;
        effort?: 'low' | 'medium' | 'high';
        budgetTokens?: number;
    };
    readonly timeout?: number;
    readonly storageRegistry?: StorageRegistryType;
    readonly context?: {
        features?: Partial<Record<ContextFeature, boolean>>;
        agentId?: string;
        storage?: ContextStorage;
        plugins?: Record<string, Record<string, unknown>>;
    };
    readonly permissions?: {
        policies?: PermissionPolicy[];
        onApprovalRequired?: (ctx: ApprovalContext) => Promise<ApprovalResult | undefined>;
        allowlist?: string[];
        blocklist?: string[];
    };
    readonly asyncTools?: {
        autoContinue?: boolean;
        batchWindowMs?: number;
        asyncTimeout?: number;
    };
}
/**
 * Context feature flags
 */
export type ContextFeature = 'workingMemory' | 'inContextMemory' | 'persistentInstructions' | 'userInfo' | 'toolCatalog' | 'sharedWorkspace' | 'memory' | 'memoryWrite';
/**
 * Storage registry type
 */
export interface StorageRegistryType {
    configure(registry: Record<string, unknown>): void;
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    setContext(context: {
        userId?: string;
        tenantId?: string;
        [key: string]: unknown;
    }): void;
}
/**
 * Context storage interface
 */
export interface ContextStorage {
    load(agentId: string, sessionId: string): Promise<unknown | null>;
    save(agentId: string, sessionId: string, data: unknown, metadata?: Record<string, unknown>): Promise<void>;
    delete(agentId: string, sessionId: string): Promise<boolean>;
    list(agentId: string): Promise<string[]>;
}
export type PermissionVerdict = 'allow' | 'deny' | 'abstain' | 'approval';
export interface PermissionContext {
    readonly toolName: string;
    readonly args: unknown;
    readonly userId?: string;
    readonly agentId?: string;
    readonly conversationId?: string;
}
export interface PermissionDecision {
    verdict: PermissionVerdict;
    reason?: string;
    policyName: string;
}
export interface PermissionPolicy {
    name: string;
    priority: number;
    evaluate(ctx: PermissionContext): PermissionDecision;
}
export interface ApprovalContext {
    readonly toolName: string;
    readonly args: unknown;
    readonly userId?: string;
}
export interface ApprovalResult {
    approved: boolean;
    createRule?: {
        description: string;
        conditions?: Array<{
            argName: string;
            operator: 'starts_with' | 'not_starts_with' | 'contains' | 'not_contains' | 'equals' | 'not_equals' | 'matches' | 'not_matches';
            value: string;
        }>;
    };
}
export interface RunOptions {
    readonly thinking?: {
        enabled: boolean;
        effort?: 'low' | 'medium' | 'high';
        budgetTokens?: number;
    };
    readonly temperature?: number;
    readonly vendorOptions?: Record<string, unknown>;
    readonly responseFormat?: ResponseFormat;
    readonly promptCache?: PromptCacheOptions;
    readonly nativeTools?: Array<{
        capability: string;
        options?: Record<string, unknown>;
    }>;
    readonly dataHandling?: DataHandlingOptions;
    readonly maxOutputTokens?: number;
    readonly topP?: number;
}
export type ResponseFormat = {
    type: 'json_schema';
    name: string;
    schema: object;
    strict?: boolean;
} | {
    type: 'json_object';
};
export interface PromptCacheOptions {
    readonly mode: 'auto' | 'request' | 'off';
    readonly ttl?: 'short' | 'extended';
    readonly key?: string;
    readonly strict?: boolean;
    readonly breakpointMode?: 'implicit' | 'explicit';
}
export interface DataHandlingOptions {
    readonly allowProviderCaching?: boolean;
    readonly allowProviderTools?: boolean;
    readonly allowBatchRetention?: boolean;
    readonly allowThirdPartyTools?: boolean;
}
export interface AgentResponse {
    readonly output_text: string;
    readonly output_parsed?: unknown;
    readonly usage: UsageInfo;
    readonly status?: 'completed' | 'suspended' | 'stopped';
    readonly suspension?: {
        correlationId: string;
        sessionId: string;
        metadata: Record<string, unknown>;
    };
    readonly native_tool_events?: unknown[];
    readonly structured_output_enforcement?: 'native' | 'prompt' | 'repair';
}
export interface UsageInfo {
    input_tokens: number;
    output_tokens: number;
    cached_input_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_creation_details?: {
        short_ttl_input_tokens?: number;
        extended_ttl_input_tokens?: number;
    };
    output_tokens_details?: {
        reasoning_tokens?: number;
    };
    native_tool_calls?: number;
    processing_mode?: 'interactive' | 'batch';
    service_tier?: string;
}
export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool' | 'function';
    content: string | ContentBlock[];
    name?: string;
    tool_call_id?: string;
}
export type ContentBlock = {
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
    };
} | {
    type: 'input_text';
    text: string;
} | {
    type: 'input_image_url';
    image_url: {
        url: string;
    };
} | {
    type: 'input_file';
    filename: string;
    file_data: string;
};
export interface ProviderCapabilities {
    readonly text: boolean;
    readonly vision: boolean;
    readonly tts: boolean;
    readonly stt: boolean;
    readonly imageGeneration: boolean;
    readonly videoGeneration: boolean;
    readonly tools: boolean;
    readonly contextWindow: number;
    readonly batch?: boolean;
    readonly promptCaching?: {
        mode: 'implicit' | 'explicit' | 'none';
        reportsCacheUsage?: boolean;
        ttlModes?: string[];
    };
    readonly nativeTools?: string[];
}
export interface AdvancedCapabilities {
    readonly promptCaching: ProviderCapabilities['promptCaching'];
    readonly nativeTools: string[];
    readonly batch: {
        supported: boolean;
    };
}
//# sourceMappingURL=index.d.ts.map