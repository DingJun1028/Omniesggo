/**
 * Connector-First Authentication System
 * 
 * Single source of truth for authentication across all vendors.
 * Supports API keys, OAuth, and custom authentication.
 */
import type { ConnectorConfig, AuthConfig, ConnectorAccessContext, Services } from '../types/index.js';
import { Vendor } from '../types/index.js';
import { EventEmitter } from 'events';

// ============================================================================
// Connector Interface
// ============================================================================

export interface IConnector {
  readonly name: string;
  readonly vendor: Vendor;
  readonly serviceType?: Services;
  readonly baseURL?: string;
  readonly auth: AuthConfig;
  readonly options: Record<string, unknown>;
  readonly readonly: boolean;
  readonly tags: string[];
  
  // HTTP methods
  fetch(path: string, options?: RequestInit): Promise<Response>;
  fetchJSON(path: string, options?: RequestInit): Promise<unknown>;
  postJSON(path: string, body: unknown, options?: RequestInit): Promise<unknown>;
  getJSON(path: string, options?: RequestInit): Promise<unknown>;
  
  // Auth helpers
  getAuthHeaders(): Promise<Record<string, string>>;
  getAuthToken(accountId?: string): Promise<string | null>;
  
  // Metrics
  getMetrics(): { requestCount: number; successCount: number; errorCount: number; avgLatencyMs: number };
}

// ============================================================================
// Connector Implementation
// ============================================================================

export class Connector implements IConnector {
  public readonly name: string;
  public readonly vendor: Vendor;
  public readonly serviceType?: Services;
  public readonly baseURL?: string;
  public readonly auth: AuthConfig;
  public readonly options: Record<string, unknown>;
  public readonly readonly: boolean;
  public readonly tags: string[];
  private metrics: { requestCount: number; successCount: number; errorCount: number; latencies: number[] };
  private events: EventEmitter;
  
  private constructor(config: ConnectorConfig) {
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
  
  static create(config: ConnectorConfig): Connector {
    const connector = new Connector(config);
    ConnectorRegistry.register(connector);
    return connector;
  }
  
  static get(name: string): Connector {
    const c = ConnectorRegistry.get(name);
    if (!c) {
      throw new Error(`Connector "${name}" not found. Call Connector.create() first.`);
    }
    return c;
  }
  
  static list(): Connector[] {
    return ConnectorRegistry.list();
  }
  
  static delete(name: string): boolean {
    return ConnectorRegistry.delete(name);
  }
  
  static scoped(context: ConnectorAccessContext): ScopedConnectorRegistry {
    return new ScopedConnectorRegistry(context);
  }
  
  static setAccessPolicy(policy: IConnectorAccessPolicy): void {
    ConnectorRegistry.setAccessPolicy(policy);
  }
  
  // HTTP methods
  async fetch(path: string, options: RequestInit = {}): Promise<Response> {
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
      } else {
        this.metrics.errorCount++;
      }
      this.events.emit('request', { url, status: response.status, latency });
      return response;
    } catch (error) {
      this.metrics.errorCount++;
      this.events.emit('error', { url, error });
      throw error;
    }
  }
  
  async fetchJSON(path: string, options: RequestInit = {}): Promise<unknown> {
    const response = await this.fetch(path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
  
  async postJSON(path: string, body: unknown, options: RequestInit = {}): Promise<unknown> {
    return this.fetchJSON(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  
  async getJSON(path: string, options: RequestInit = {}): Promise<unknown> {
    return this.fetchJSON(path, { ...options, method: 'GET' });
  }
  
  // Auth helpers
  async getAuthHeaders(): Promise<Record<string, string>> {
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
  
  async getAuthToken(accountId?: string): Promise<string | null> {
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
  private _buildURL(path: string): string {
    if (!this.baseURL) {
      throw new Error(`Connector "${this.name}" has no baseURL`);
    }
    const base = this.baseURL.replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }
  
  private async _refreshOAuthToken(accountId?: string): Promise<string> {
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

// ============================================================================
// Connector Registry
// ============================================================================

export interface IConnectorAccessPolicy {
  canAccess(connector: IConnector, context: ConnectorAccessContext): boolean;
}

export class ConnectorRegistry {
  private static connectors: Map<string, Connector> = new Map();
  private static accessPolicy: IConnectorAccessPolicy | null = null;
  
  static register(connector: Connector): void {
    this.connectors.set(connector.name, connector);
  }
  
  static get(name: string, context?: ConnectorAccessContext): Connector {
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
  
  static getSafe(name: string, context?: ConnectorAccessContext): Connector | null {
    try {
      return this.get(name, context);
    } catch {
      return null;
    }
  }
  
  static list(context?: ConnectorAccessContext): Connector[] {
    const all = Array.from(this.connectors.values());
    if (!this.accessPolicy || !context) {
      return all;
    }
    return all.filter(c => this.accessPolicy!.canAccess(c, context));
  }
  
  static delete(name: string): boolean {
    return this.connectors.delete(name);
  }
  
  static clear(): void {
    this.connectors.clear();
  }
  
  static setAccessPolicy(policy: IConnectorAccessPolicy): void {
    this.accessPolicy = policy;
  }
  
  static hasAccessPolicy(): boolean {
    return this.accessPolicy !== null;
  }
}

// ============================================================================
// Scoped Connector Registry
// ============================================================================

export class ScopedConnectorRegistry {
  private context: ConnectorAccessContext;
  
  constructor(context: ConnectorAccessContext) {
    this.context = context;
  }
  
  get(name: string): Connector {
    return ConnectorRegistry.get(name, this.context);
  }
  
  getSafe(name: string): Connector | null {
    return ConnectorRegistry.getSafe(name, this.context);
  }
  
  list(): Connector[] {
    return ConnectorRegistry.list(this.context);
  }
  
  has(name: string): boolean {
    return this.getSafe(name) !== null;
  }
  
  // Context-aware resolution
  resolve(connectorOrName: string | Connector): Connector {
    if (typeof connectorOrName === 'string') {
      return this.get(connectorOrName);
    }
    return connectorOrName;
  }
}

// ============================================================================
// In-memory OAuth token storage (for demo/testing)
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __OAUTH_TOKENS__: Record<string, { token: string; expiresAt: number }> | undefined;
}

if (typeof globalThis !== 'undefined' && !globalThis.__OAUTH_TOKENS__) {
  (globalThis as any).__OAUTH_TOKENS__ = {};
}

// ============================================================================
// Vendor Templates
// ============================================================================

export interface VendorTemplate {
  id: string;
  name: string;
  authMethods: string[];
  baseURL?: string;
  credentialsSetupURL?: string;
  recommendedScopes?: string[];
  logoSvg?: string;
  brandColor?: string;
}

// This will be expanded in the registry module
export function getVendorTemplate(vendorId: string): VendorTemplate | null {
  // Implemented in the registry module
  return null;
}

export function listVendors(): string[] {
  // Implemented in the registry module
  return [];
}

export function createConnectorFromTemplate(
  name: string,
  vendorId: string,
  authMethod: string,
  credentials: Record<string, string>,
  options?: Record<string, unknown>
): Connector {
  // Implemented in the registry module
  const template = getVendorTemplate(vendorId);
  if (!template) {
    throw new Error(`Unknown vendor: ${vendorId}`);
  }
  
  const authConfig: AuthConfig = authMethod.includes('oauth')
    ? { type: 'oauth', flow: authMethod.replace('oauth-', '') as 'authorization_code' | 'client_credentials', ...credentials } as AuthConfig
    : { type: 'api_key', apiKey: credentials.apiKey || credentials.token } as AuthConfig;
  
  return Connector.create({
    name,
    vendor: vendorId as Vendor,
    auth: authConfig,
    baseURL: template.baseURL,
    options,
    tags: [vendorId],
  });
}

// ============================================================================
// Scoped Registry for Connectors
// ============================================================================

export interface IScopedRegistry {
  get(name: string): Connector;
  getSafe(name: string): Connector | null;
  list(): Connector[];
  has(name: string): boolean;
}

export function scopedRegistry(context: ConnectorAccessContext): ScopedConnectorRegistry {
  return new ScopedConnectorRegistry(context);
}
