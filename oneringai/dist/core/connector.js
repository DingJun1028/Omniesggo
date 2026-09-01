import { EventEmitter } from 'events';
// ============================================================================
// Connector Implementation
// ============================================================================
export class Connector {
    name;
    vendor;
    serviceType;
    baseURL;
    auth;
    options;
    readonly;
    tags;
    metrics;
    events;
    constructor(config) {
        this.name = config.name;
        this.vendor = config.vendor || Vendor.Custom;
        this.serviceType = config.serviceType;
        this.baseURL = config.baseURL;
        this.auth = config.auth;
        this.options = config.options || {};
        this.readonly = config.readonly ?? false;
        this.tags = config.tags || [];
        this.metrics = { requestCount: 0, successCount: 0, errorCount: 0, latencies: [] };
        this.events = new EventEmitter();
    }
    static create(config) {
        const connector = new Connector(config);
        ConnectorRegistry.register(connector);
        return connector;
    }
    static get(name) {
        const c = ConnectorRegistry.get(name);
        if (!c) {
            throw new Error(`Connector "${name}" not found. Call Connector.create() first.`);
        }
        return c;
    }
    static list() {
        return ConnectorRegistry.list();
    }
    static delete(name) {
        return ConnectorRegistry.delete(name);
    }
    static scoped(context) {
        return new ScopedConnectorRegistry(context);
    }
    static setAccessPolicy(policy) {
        ConnectorRegistry.setAccessPolicy(policy);
    }
    // HTTP methods
    async fetch(path, options = {}) {
        const url = this._buildURL(path);
        const headers = await this.getAuthHeaders();
        const start = Date.now();
        this.metrics.requestCount++;
        try {
            const response = await fetch(url, { ...options, headers: { ...options.headers, ...headers } });
            const latency = Date.now() - start;
            this.metrics.latencies.push(latency);
            if (response.ok) {
                this.metrics.successCount++;
            }
            else {
                this.metrics.errorCount++;
            }
            this.events.emit('request', { url, status: response.status, latency });
            return response;
        }
        catch (error) {
            this.metrics.errorCount++;
            this.events.emit('error', { url, error });
            throw error;
        }
    }
    async fetchJSON(path, options = {}) {
        const response = await this.fetch(path, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }
    async postJSON(path, body, options = {}) {
        return this.fetchJSON(path, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
    async getJSON(path, options = {}) {
        return this.fetchJSON(path, { ...options, method: 'GET' });
    }
    // Auth helpers
    async getAuthHeaders() {
        switch (this.auth.type) {
            case 'api_key':
                return { Authorization: `Bearer ${this.auth.apiKey}` };
            case 'bearer':
                return { Authorization: `Bearer ${this.auth.token}` };
            case 'oauth':
                const token = await this._refreshOAuthToken();
                return { Authorization: `Bearer ${token}` };
            case 'none':
                return {};
            default:
                return {};
        }
    }
    async getAuthToken(accountId) {
        if (this.auth.type === 'oauth') {
            return await this._refreshOAuthToken(accountId);
        }
        if (this.auth.type === 'api_key') {
            return this.auth.apiKey;
        }
        if (this.auth.type === 'bearer') {
            return this.auth.token;
        }
        return null;
    }
    // Metrics
    getMetrics() {
        const avgLatency = this.metrics.latencies.length > 0
            ? this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length
            : 0;
        return {
            requestCount: this.metrics.requestCount,
            successCount: this.metrics.successCount,
            errorCount: this.metrics.errorCount,
            avgLatencyMs: Math.round(avgLatency),
        };
    }
    // Private methods
    _buildURL(path) {
        if (!this.baseURL) {
            throw new Error(`Connector "${this.name}" has no baseURL`);
        }
        const base = this.baseURL.replace(/\/+$/, '');
        const p = path.startsWith('/') ? path : `/${path}`;
        return `${base}${p}`;
    }
    async _refreshOAuthToken(accountId) {
        // In a real implementation, this would use the OAuthManager
        // For now, we store tokens in memory
        const tokenKey = accountId ? `${this.name}:${accountId}` : this.name;
        const stored = __OAUTH_TOKENS__?.[tokenKey];
        if (stored && stored.expiresAt > Date.now()) {
            return stored.token;
        }
        if (this.auth.type === 'oauth' && 'clientSecret' in this.auth) {
            // Refresh logic would go here
            throw new Error(`OAuth token expired or not available for connector "${this.name}"`);
        }
        throw new Error(`No OAuth token available for connector "${this.name}"`);
    }
}
export class ConnectorRegistry {
    static connectors = new Map();
    static accessPolicy = null;
    static register(connector) {
        this.connectors.set(connector.name, connector);
    }
    static get(name, context) {
        const connector = this.connectors.get(name);
        if (!connector) {
            throw new Error(`Connector "${name}" not found`);
        }
        if (this.accessPolicy && context) {
            if (!this.accessPolicy.canAccess(connector, context)) {
                throw new Error(`Access denied to connector "${name}"`);
            }
        }
        return connector;
    }
    static getSafe(name, context) {
        try {
            return this.get(name, context);
        }
        catch {
            return null;
        }
    }
    static list(context) {
        const all = Array.from(this.connectors.values());
        if (!this.accessPolicy || !context) {
            return all;
        }
        return all.filter(c => this.accessPolicy.canAccess(c, context));
    }
    static delete(name) {
        return this.connectors.delete(name);
    }
    static clear() {
        this.connectors.clear();
    }
    static setAccessPolicy(policy) {
        this.accessPolicy = policy;
    }
    static hasAccessPolicy() {
        return this.accessPolicy !== null;
    }
}
// ============================================================================
// Scoped Connector Registry
// ============================================================================
export class ScopedConnectorRegistry {
    context;
    constructor(context) {
        this.context = context;
    }
    get(name) {
        return ConnectorRegistry.get(name, this.context);
    }
    getSafe(name) {
        return ConnectorRegistry.getSafe(name, this.context);
    }
    list() {
        return ConnectorRegistry.list(this.context);
    }
    has(name) {
        return this.getSafe(name) !== null;
    }
    // Context-aware resolution
    resolve(connectorOrName) {
        if (typeof connectorOrName === 'string') {
            return this.get(connectorOrName);
        }
        return connectorOrName;
    }
}
if (typeof globalThis !== 'undefined' && !globalThis.__OAUTH_TOKENS__) {
    globalThis.__OAUTH_TOKENS__ = {};
}
// This will be expanded in the registry module
export function getVendorTemplate(vendorId) {
    // Implemented in the registry module
    return null;
}
export function listVendors() {
    // Implemented in the registry module
    return [];
}
export function createConnectorFromTemplate(name, vendorId, authMethod, credentials, options) {
    // Implemented in the registry module
    const template = getVendorTemplate(vendorId);
    if (!template) {
        throw new Error(`Unknown vendor: ${vendorId}`);
    }
    const authConfig = authMethod.includes('oauth')
        ? { type: 'oauth', flow: authMethod.replace('oauth-', ''), ...credentials }
        : { type: 'api_key', apiKey: credentials.apiKey || credentials.token };
    return Connector.create({
        name,
        vendor: vendorId,
        auth: authConfig,
        baseURL: template.baseURL,
        options,
        tags: [vendorId],
    });
}
export function scopedRegistry(context) {
    return new ScopedConnectorRegistry(context);
}
//# sourceMappingURL=connector.js.map