export interface Subscriber {
    id: string;
    email?: string;
    telegramChatId?: string;
    slackChannelId?: string;
    discordChannelId?: string;
    webhookUrl?: string;
    platform: 'email' | 'telegram' | 'slack' | 'discord' | 'webhook';
    verified: boolean;
    preferences: Record<string, unknown>;
    createdAt: number;
    unsubscribedAt?: number;
}
export interface SubscriberSegment {
    name: string;
    filter: (subscriber: Subscriber) => boolean;
    subscribers: string[];
}
export interface Template {
    id: string;
    name: string;
    subject: string;
    htmlBody: string;
    textBody: string;
    brand: string;
    createdAt: number;
    updatedAt: number;
}
export interface TemplateEngine {
    render(template: Template, variables: Record<string, unknown>): Promise<{
        subject: string;
        html: string;
        text: string;
    }>;
    renderString(template: string, variables: Record<string, unknown>): string;
}
export declare class SimpleTemplateEngine implements TemplateEngine {
    private readonly builtInHandlers;
    private customHandlers;
    constructor();
    render(template: Template, variables: Record<string, unknown>): Promise<{
        subject: string;
        html: string;
        text: string;
    }>;
    renderString(template: string, variables: Record<string, unknown>): Promise<string>;
    register(name: string, handler: (fmt: string | undefined, ctx: Record<string, unknown>) => string | Promise<string>, options?: {
        dynamic?: boolean;
    }): void;
    renderAsContext(variables: Record<string, unknown>): string;
}
export interface DeliveryResult {
    success: boolean;
    channel: string;
    recipient: string;
    messageId?: string;
    error?: string;
    timestamp: number;
}
export interface DeliveryConfig {
    smtp?: {
        host: string;
        port: number;
        user: string;
        pass: string;
        secure: boolean;
    };
    telegram?: {
        botToken: string;
        parseMode: 'HTML' | 'Markdown';
    };
    slack?: {
        webhookUrl: string;
        channel: string;
    };
    discord?: {
        webhookUrl: string;
    };
    webhook?: {
        secret: string;
        rateLimit: {
            maxRequests: number;
            perSeconds: number;
        };
    };
}
export declare class DeliveryScheduler {
    private config;
    private rateLimits;
    constructor(config: DeliveryConfig);
    send(channel: 'email' | 'telegram' | 'slack' | 'discord' | 'webhook', to: string, content: {
        subject: string;
        html: string;
        text: string;
    }, options?: {
        threadId?: string;
    }): Promise<DeliveryResult>;
    private _sendEmail;
    private _sendTelegram;
    private _sendSlack;
    private _sendDiscord;
    private _sendWebhook;
    private _checkRateLimit;
}
export interface NewsletterMetrics {
    sendCount: number;
    openCount: number;
    clickCount: number;
    unsubscribeCount: number;
    bounceCount: number;
    channelCounts: Record<string, number>;
    successRate: number;
    deliveryTimeAvg: number;
}
export declare class AnalyticsDashboard {
    private deliveries;
    private events;
    recordDelivery(result: DeliveryResult): void;
    recordEvent(type: string, data?: Record<string, unknown>): void;
    getMetrics(): NewsletterMetrics;
    getEvents(options?: {
        type?: string;
        since?: number;
    }): Array<{
        type: string;
        timestamp: number;
        data: Record<string, unknown>;
    }>;
}
export declare class NewsletterDispatchSystem {
    private engine;
    private scheduler;
    private dashboard;
    private subscriberStore;
    private templateStore;
    private segments;
    private readonly rateLimit;
    constructor(engine: TemplateEngine, scheduler: DeliveryScheduler, dashboard: AnalyticsDashboard);
    saveTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template>;
    getTemplate(id: string): Promise<Template | undefined>;
    listTemplates(brand?: string): Promise<Template[]>;
    addSubscriber(subscriber: Omit<Subscriber, 'id' | 'createdAt'>): Promise<Subscriber>;
    getSubscribers(segment?: string): Promise<Subscriber[]>;
    createSegment(name: string, filter: (sub: Subscriber) => boolean): Promise<SubscriberSegment>;
    dispatch(templateId: string, variables: Record<string, unknown>, options?: {
        segment?: string;
        channels?: ('email' | 'telegram' | 'slack' | 'discord' | 'webhook')[];
        threadId?: string;
        priority?: 'normal' | 'high' | 'low';
    }): Promise<{
        results: DeliveryResult[];
        metrics: NewsletterMetrics;
    }>;
    private _getRecipient;
    private _registerDefaultTemplates;
}
export declare function createNewsletterSystem(config: {
    smtp?: DeliveryConfig['smtp'];
    telegram?: DeliveryConfig['telegram'];
    slack?: DeliveryConfig['slack'];
    webhook?: DeliveryConfig['webhook'];
}): NewsletterDispatchSystem;
export { SimpleTemplateEngine };
export type { TemplateEngine };
//# sourceMappingURL=dispatch.d.ts.map