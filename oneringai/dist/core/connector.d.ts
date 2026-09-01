/**
 * Connector-First Authentication System
 *
 * Single source of truth for authentication across all vendors.
 * Supports API keys, OAuth, and custom authentication.
 */
import type { ConnectorConfig, AuthConfig, ConnectorAccessContext, Vendor, Services } from '../types/index.js';
export interface IConnector {
    readonly name: string;
    readonly vendor: Vendor;
    readonly serviceType?: Services;
    readonly baseURL?: string;
    readonly auth: AuthConfig;
    readonly options: Record<string, unknown>;
    readonly readonly: boolean;
    readonly tags: string[];
    fetch(path: string, options?: RequestInit): Promise<Response>;
    fetchJSON(path: string, options?: RequestInit): Promise<unknown>;
    postJSON(path: string, body: unknown, options?: RequestInit): Promise<unknown>;
    getJSON(path: string, options?: RequestInit): Promise<unknown>;
    getAuthHeaders(): Promise<Record<string, string>>;
    getAuthToken(accountId?: string): Promise<string | null>;
    getMetrics(): {
        requestCount: number;
        successCount: number;
        errorCount: number;
        avgLatencyMs: number;
    };
}
export declare class Connector implements IConnector {
    readonly name: string;
    readonly vendor: Vendor;
    readonly serviceType?: Services;
    readonly baseURL?: string;
    readonly auth: AuthConfig;
    readonly options: Record<string, unknown>;
    readonly readonly: boolean;
    readonly tags: string[];
    private metrics;
    private events;
    private constructor();
    static create(config: ConnectorConfig): Connector;
    static get(name: string): Connector;
    static list(): Connector[];
    static delete(name: string): boolean;
    static scoped(context: ConnectorAccessContext): ScopedConnectorRegistry;
    static setAccessPolicy(policy: IConnectorAccessPolicy): void;
    fetch(path: string, options?: RequestInit): Promise<Response>;
    fetchJSON(path: string, options?: RequestInit): Promise<unknown>;
    postJSON(path: string, body: unknown, options?: RequestInit): Promise<unknown>;
    getJSON(path: string, options?: RequestInit): Promise<unknown>;
    getAuthHeaders(): Promise<Record<string, string>>;
    getAuthToken(accountId?: string): Promise<string | null>;
    getMetrics(): {
        requestCount: number;
        successCount: number;
        errorCount: number;
        avgLatencyMs: number;
    };
    private _buildURL;
    private _refreshOAuthToken;
}
export interface IConnectorAccessPolicy {
    canAccess(connector: IConnector, context: ConnectorAccessContext): boolean;
}
export declare class ConnectorRegistry {
    private static connectors;
    private static accessPolicy;
    static register(connector: Connector): void;
    static get(name: string, context?: ConnectorAccessContext): Connector;
    static getSafe(name: string, context?: ConnectorAccessContext): Connector | null;
    static list(context?: ConnectorAccessContext): Connector[];
    static delete(name: string): boolean;
    static clear(): void;
    static setAccessPolicy(policy: IConnectorAccessPolicy): void;
    static hasAccessPolicy(): boolean;
}
export declare class ScopedConnectorRegistry {
    private context;
    constructor(context: ConnectorAccessContext);
    get(name: string): Connector;
    getSafe(name: string): Connector | null;
    list(): Connector[];
    has(name: string): boolean;
    resolve(connectorOrName: string | Connector): Connector;
}
declare global {
    var __OAUTH_TOKENS__: any, Record: any;
}
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
export declare function getVendorTemplate(vendorId: string): VendorTemplate | null;
export declare function listVendors(): string[];
export declare function createConnectorFromTemplate(name: string, vendorId: string, authMethod: string, credentials: Record<string, string>, options?: Record<string, unknown>): Connector;
export interface IScopedRegistry {
    get(name: string): Connector;
    getSafe(name: string): Connector | null;
    list(): Connector[];
    has(name: string): boolean;
}
export declare function scopedRegistry(context: ConnectorAccessContext): ScopedConnectorRegistry;
//# sourceMappingURL=connector.d.ts.map