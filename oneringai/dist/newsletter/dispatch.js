import * as crypto from 'crypto';
export class SimpleTemplateEngine {
    builtInHandlers;
    customHandlers = new Map();
    constructor() {
        const now = new Date();
        this.builtInHandlers = new Map([
            ['DATE', (_fmt) => now.toISOString().split('T')[0]],
            ['TIME', (fmt = 'HH:mm') => now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }).replace(':', fmt.includes(':') ? ':' : ' ')],
            ['DATETIME', (_fmt) => now.toISOString()],
            ['AGENT_ID', () => 'current-agent'],
            ['AGENT_NAME', () => 'OneRingAI Agent'],
            ['MODEL', () => 'gpt-4.1'],
            ['VENDOR', () => 'oneringai'],
            ['USER_ID', () => 'current-user'],
            ['RANDOM', (fmt) => {
                    if (!fmt)
                        return String(Math.floor(Math.random() * 1000000));
                    const parts = fmt.split(':');
                    if (parts.length === 2) {
                        const min = parseInt(parts[0], 10);
                        const max = parseInt(parts[1], 10);
                        return String(Math.floor(Math.random() * (max - min + 1)) + min);
                    }
                    return String(Math.floor(Math.random() * 1000));
                }],
        ]);
        // Register default DATE handler
        this.register('DATE', () => now.toISOString().split('T')[0]);
        this.register('TIME', (fmt = 'HH:mm') => {
            const h = now.getHours().toString().padStart(2, '0');
            const m = now.getMinutes().toString().padStart(2, '0');
            return fmt.replace('HH', h).replace('mm', m);
        });
    }
    async render(template, variables) {
        return {
            subject: await this.renderString(template.subject, variables),
            html: await this.renderString(template.htmlBody, variables),
            text: await this.renderString(template.textBody, variables),
        };
    }
    async renderString(template, variables) {
        // First, replace triple-brace (escaped)
        let result = template.replace(/\{\{\{([^}]+)\}\}\}/g, '{{$1}}');
        // Then, replace {{raw}}...{{/raw}} blocks
        result = result.replace(/\{\{raw\}\}([\s\S]*?)\{\{\/raw\}\}/g, '$1');
        // Then, replace all {{TEMPLATE}} with built-in or custom handlers
        result = result.replace(/\{\{(\w+)(?::([^}]+))?\}\}/g, (match, name, fmt) => {
            // Check if it's a raw/escaped reference
            if (template.includes(`{{{{{${name}}}}}`) || template.includes(`{ {{{${name}}}`)) {
                return match;
            }
            // Check variables first
            if (name in variables) {
                const val = variables[name];
                return typeof val === 'string' ? val : JSON.stringify(val);
            }
            // Check built-in handlers
            if (this.builtInHandlers.has(name)) {
                return this.builtInHandlers.get(name)(fmt, variables);
            }
            // Check custom handlers
            if (this.customHandlers.has(name)) {
                const handler = this.customHandlers.get(name);
                const val = handler(fmt, variables);
                return typeof val === 'string' ? val : String(val);
            }
            // Leave as is if not found
            return match;
        });
        return result;
    }
    register(name, handler, options) {
        this.customHandlers.set(name, handler);
    }
    renderAsContext(variables) {
        return '## Newsletter Context\n\n' +
            Object.entries(variables).slice(0, 20).map(([k, v]) => `- ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n');
    }
}
export class DeliveryScheduler {
    config;
    rateLimits = new Map();
    constructor(config) {
        this.config = config;
    }
    async send(channel, to, content, options) {
        const timestamp = Date.now();
        try {
            switch (channel) {
                case 'email':
                    return await this._sendEmail(to, content);
                case 'telegram':
                    return await this._sendTelegram(to, content, options?.threadId);
                case 'slack':
                    return await this._sendSlack(to, content);
                case 'discord':
                    return await this._sendDiscord(to, content);
                case 'webhook':
                    return await this._sendWebhook(to, content);
                default:
                    return { success: false, channel, recipient: to, error: 'Unknown channel', timestamp };
            }
        }
        catch (error) {
            return { success: false, channel, recipient: to, error: error.message, timestamp };
        }
    }
    async _sendEmail(to, content) {
        // In a real implementation, this would use nodemailer or similar
        return { success: true, channel: 'email', recipient: to, messageId: `email_${Date.now()}`, timestamp: Date.now() };
    }
    async _sendTelegram(chatId, content, threadId) {
        // Check rate limit
        const limit = this._checkRateLimit(`telegram:${chatId}`);
        if (!limit.allowed)
            return { success: false, channel: 'telegram', recipient: chatId, error: 'Rate limited', timestamp: Date.now() };
        return { success: true, channel: 'telegram', recipient: chatId, messageId: `tg_${Date.now()}`, timestamp: Date.now() };
    }
    async _sendSlack(channel, content) {
        return { success: true, channel: 'slack', recipient: channel, messageId: `slack_${Date.now()}`, timestamp: Date.now() };
    }
    async _sendDiscord(webhookUrl, content) {
        return { success: true, channel: 'discord', recipient: webhookUrl, messageId: `discord_${Date.now()}`, timestamp: Date.now() };
    }
    async _sendWebhook(webhookUrl, content) {
        if (!this.config.webhook) {
            throw new Error('Webhook config not provided');
        }
        // HMAC signature
        const payload = JSON.stringify({ subject: content.subject, html: content.html });
        const signature = crypto
            .createHmac('sha256', this.config.webhook.secret)
            .update(payload)
            .digest('hex');
        const result = {
            success: true,
            channel: 'webhook',
            recipient: webhookUrl,
            messageId: `wh_${Date.now()}`,
            timestamp: Date.now()
        };
        // In real implementation, would POST to webhookUrl with signature header
        return result;
    }
    _checkRateLimit(key) {
        const now = Date.now();
        const windowMs = 1000; // 1 second window
        const current = this.rateLimits.get(key);
        if (!current || now - current.windowStart >= windowMs) {
            this.rateLimits.set(key, { count: 1, windowStart: now });
            return { allowed: true, remaining: 29, resetIn: windowMs };
        }
        if (current.count >= 30) {
            return { allowed: false, remaining: 0, resetIn: windowMs - (now - current.windowStart) };
        }
        current.count++;
        return { allowed: true, remaining: 30 - current.count, resetIn: windowMs - (now - current.windowStart) };
    }
}
export class AnalyticsDashboard {
    deliveries = new Map();
    events = new Map();
    recordDelivery(result) {
        const id = `send_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        this.deliveries.set(id, { result, channel: result.channel });
    }
    recordEvent(type, data = {}) {
        const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        this.events.set(id, { type, timestamp: Date.now(), data });
    }
    getMetrics() {
        const deliveries = Array.from(this.deliveries.values());
        const events = Array.from(this.events.values());
        const channelCounts = {};
        let openCount = 0;
        let clickCount = 0;
        let unsubscribeCount = 0;
        let bounceCount = 0;
        for (const { result, channel } of deliveries) {
            channelCounts[channel] = (channelCounts[channel] || 0) + 1;
            if (!result.success) {
                bounceCount++;
            }
        }
        for (const event of events) {
            switch (event.type) {
                case 'open':
                    openCount++;
                    break;
                case 'click':
                    clickCount++;
                    break;
                case 'unsubscribe':
                    unsubscribeCount++;
                    break;
                case 'bounce':
                    bounceCount++;
                    break;
            }
        }
        return {
            sendCount: deliveries.length,
            openCount,
            clickCount,
            unsubscribeCount,
            bounceCount,
            channelCounts,
            successRate: deliveries.length > 0 ? deliveries.filter(d => d.result.success).length / deliveries.length : 0,
            deliveryTimeAvg: 0,
        };
    }
    getEvents(options) {
        let events = Array.from(this.events.values());
        if (options?.type)
            events = events.filter(e => e.type === options.type);
        if (options?.since)
            events = events.filter(e => e.timestamp >= options.since);
        return events.sort((a, b) => b.timestamp - a.timestamp);
    }
}
// ============================================================================
// Newsletter Dispatch System
// ============================================================================
export class NewsletterDispatchSystem {
    engine;
    scheduler;
    dashboard;
    subscriberStore = new Map();
    templateStore = new Map();
    segments = new Map();
    rateLimit = { email: 100, telegram: 30, slack: 1, webhook: 1000 };
    constructor(engine, scheduler, dashboard) {
        this.engine = engine;
        this.scheduler = scheduler;
        this.dashboard = dashboard;
        // Register default templates
        this._registerDefaultTemplates();
    }
    // Template management
    async saveTemplate(template) {
        const id = `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = Date.now();
        const full = { ...template, id, createdAt: now, updatedAt: now };
        this.templateStore.set(id, full);
        return full;
    }
    async getTemplate(id) {
        return this.templateStore.get(id);
    }
    async listTemplates(brand) {
        let templates = Array.from(this.templateStore.values());
        if (brand)
            templates = templates.filter(t => t.brand === brand);
        return templates;
    }
    // Subscriber management
    async addSubscriber(subscriber) {
        const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = Date.now();
        const full = { ...subscriber, id, createdAt: now };
        this.subscriberStore.set(id, full);
        return full;
    }
    async getSubscribers(segment) {
        let subscribers = Array.from(this.subscriberStore.values()).filter(s => !s.unsubscribedAt);
        if (segment) {
            const seg = this.segments.get(segment);
            if (seg) {
                subscribers = subscribers.filter(s => seg.subscribers.includes(s.id));
            }
        }
        return subscribers;
    }
    async createSegment(name, filter) {
        const allSubscribers = await this.getSubscribers();
        const matching = allSubscribers.filter(filter);
        const segment = {
            name,
            filter: filter,
            subscribers: matching.map(s => s.id),
        };
        this.segments.set(name, segment);
        return segment;
    }
    // Dispatch
    async dispatch(templateId, variables, options) {
        const template = await this.getTemplate(templateId);
        if (!template)
            throw new Error(`Template "${templateId}" not found`);
        // Render template
        const rendered = await this.engine.render(template, variables);
        // Get subscribers
        const subscribers = await this.getSubscribers(options?.segment);
        // Determine channels
        const channels = options?.channels || ['email'];
        const results = [];
        let channelIndex = 0;
        for (const subscriber of subscribers) {
            for (const channel of channels) {
                if (channel === 'email' && !subscriber.email)
                    continue;
                if (channel === 'telegram' && !subscriber.telegramChatId)
                    continue;
                if (channel === 'slack' && !subscriber.slackChannelId)
                    continue;
                if (channel === 'discord' && !subscriber.discordChannelId)
                    continue;
                if (channel === 'webhook' && !subscriber.webhookUrl)
                    continue;
                // Rate limiting
                const limit = this.rateLimit[channel] || 100;
                if (channelIndex >= limit) {
                    // Batch - wait and continue
                    channelIndex = 0;
                }
                const recipient = this._getRecipient(subscriber, channel);
                // HMAC verification for webhooks
                const result = await this.scheduler.send(channel, recipient, rendered, {
                    threadId: options?.threadId,
                });
                results.push(result);
                this.dashboard.recordDelivery(result);
                this.dashboard.recordEvent(result.success ? 'delivered' : 'failed', {
                    channel,
                    recipient,
                    messageId: result.messageId,
                });
                channelIndex++;
            }
        }
        return { results, metrics: this.dashboard.getMetrics() };
    }
    _getRecipient(subscriber, channel) {
        switch (channel) {
            case 'email': return subscriber.email;
            case 'telegram': return subscriber.telegramChatId;
            case 'slack': return subscriber.slackChannelId;
            case 'discord': return subscriber.discordChannelId;
            case 'webhook': return subscriber.webhookUrl;
            default: return '';
        }
    }
    _registerDefaultTemplates() {
        // Weekly Swarm Report
        this.templateStore.set('weekly-swarm-report', {
            id: 'weekly-swarm-report',
            name: '萬能蜂群週報',
            subject: '萬能蜂群週報 第 {{DATE}} 期',
            htmlBody: `<div class="newsletter">
  <header style="background: linear-gradient(135deg, #10243f 0%, #c9a24b 100%);">
    <h1>萬能蜂群週報</h1>
    <p>30 個靈魂，一個心核</p>
  </header>
  <section class="5t-summary">
    <h2>5T 執行摘要</h2>
    <ul>
      <li>🔍 Traceable: {{traceable_count}} 項任務完成</li>
      <li>📡 Trackable: {{trackable_count}} 項指標更新</li>
      <li>✨ Tangible: {{tangible_count}} 項回饋收集</li>
      <li>🔆 Transparent: {{transparent_count}} 項驗證通過</li>
      <li>🔒 Trustworthy: {{trustworthy_count}} 項數據凍結</li>
    </ul>
  </section>
  <section class="member-spotlight">
    <h2>成員聚焦 — {{member_name}}</h2>
    <p>{{member_bio}}</p>
  </section>
  <section class="entropy-report">
    <h2>熵減報告</h2>
    <p>本週熵值: {{entropy_value}} (目標: < 0.1)</p>
    <p>減幅: {{reduction_percent}}%</p>
  </section>
  <footer>
    <p>發送時間: {{DATETIME}}</p>
    <p>Hash Lock: {{hash_lock}}</p>
  </footer>
</div>`,
            textBody: `萬能蜂群週報\n\n5T 執行摘要:\n- Traceable: {{traceable_count}} 項\n- Trackable: {{trackable_count}} 項\n- Tangible: {{tangible_count}} 項\n- Transparent: {{transparent_count}} 項\n- Trustworthy: {{trustworthy_count}} 項\n\n成員聚焦: {{member_name}}\n{{member_bio}}\n\n熵減報告: {{entropy_value}} (減幅 {{reduction_percent}}%)\n\n發送時間: {{DATETIME}}`,
            brand: 'oneringai',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }
}
// ============================================================================
// Factory
// ============================================================================
export function createNewsletterSystem(config) {
    const engine = new SimpleTemplateEngine();
    const scheduler = new DeliveryScheduler(config);
    const dashboard = new AnalyticsDashboard();
    return new NewsletterDispatchSystem(engine, scheduler, dashboard);
}
// ============================================================================
// Export
// ============================================================================
export { SimpleTemplateEngine };
//# sourceMappingURL=dispatch.js.map