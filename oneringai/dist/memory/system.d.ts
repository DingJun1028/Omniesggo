export type EntityType = 'person' | 'organization' | 'project' | 'document' | 'task' | 'note' | 'concept' | 'event' | 'tool' | string;
export type Principal = `user:${string}` | `entity:${string}` | `group:${string}` | `service:${string}` | 'world';
export type FactLifecycle = 'stable' | 'evolving' | 'transient';
export interface Identifier {
    kind: 'email' | 'slack_id' | 'github_login' | 'domain' | 'phone' | 'custom' | 'auto';
    value: string;
}
export interface Entity {
    id: string;
    type: EntityType;
    displayName: string;
    identifiers: Identifier[];
    aliases: string[];
    createdAt: number;
    updatedAt: number;
    owner: Principal;
    visibility: VisibilitySpec;
    metadata: Record<string, unknown>;
}
export interface VisibilitySpec {
    owner: Principal;
    group: Principal | null;
    world: 'read' | 'none';
    readPrincipals?: Principal[];
    writePrincipals?: Principal[];
}
export interface Fact {
    id: string;
    subjectId: string;
    predicate: string;
    value?: string;
    objectId?: string;
    confidence: number;
    importance: number;
    createdAt: number;
    updatedAt: number;
    source: string;
    contextIds: string[];
    supersededBy?: string;
    archived: boolean;
    owner: Principal;
    visibility: VisibilitySpec;
    payload?: Record<string, unknown>;
}
export interface Relation extends Fact {
    relationType: string;
}
export interface PredicateDef {
    name: string;
    description: string;
    category: string;
    payloadKind: 'none' | 'attribute' | 'relation';
    subjectTypes: EntityType[];
    lifecycle: FactLifecycle;
    weight?: number;
}
export interface UserProfile {
    entityId: string;
    displayName: string;
    summary: string;
    keyFacts: Fact[];
    relatedTasks: Fact[];
    behaviorRules: string[];
    metadata: Record<string, unknown>;
}
export interface MemoryQueryResult {
    facts: Fact[];
    entities: Entity[];
    query: string;
    total: number;
}
export interface GraphTraversalResult {
    nodes: Entity[];
    edges: Fact[];
    paths: Array<{
        source: string;
        target: string;
        path: string[];
    }>;
}
export interface DocumentResult {
    id: string;
    title: string;
    content: string;
    owner: Principal;
    visibility: VisibilitySpec;
    metadata: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}
export interface EmbeddingConnector {
    embed(text: string | string[], options?: {
        dimensions?: number;
    }): Promise<{
        embeddings: number[][];
    }>;
    embedMultimodal?(assets: Array<{
        type: string;
        data: string | Buffer;
        mimeType: string;
    }>, options?: {
        dimensions?: number;
    }): Promise<{
        embeddings: number[][];
    }>;
    listModels?(): Promise<string[]>;
}
export interface ProfileConnector {
    generateProfile(prompt: string): Promise<string>;
}
export interface MemoryConnectors {
    embedding: EmbeddingConnector;
    profile?: ProfileConnector;
}
export interface IMemoryStore {
    upsertEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Entity, 'id'>>): Promise<Entity>;
    findEntityById(id: string): Promise<Entity | null>;
    findEntityByIdentifier(identifier: Identifier): Promise<Entity | null>;
    findEntitiesByIdentifiers(identifiers: Identifier[]): Promise<Entity[]>;
    mergeEntities(targetId: string, sourceIds: string[]): Promise<Entity>;
    listEntities(type?: EntityType, visibility?: {
        owner: Principal;
    }): Promise<Entity[]>;
    deleteEntity(id: string): Promise<boolean>;
    searchEntities(query: string, visibility: {
        owner: Principal;
    }): Promise<Entity[]>;
    storeFact(fact: Omit<Fact, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Fact, 'id'>>): Promise<Fact>;
    getFact(id: string, visibility: {
        owner: Principal;
    }): Promise<Fact | null>;
    listFacts(subjectId: string, predicate?: string, options?: {
        archivedOnly?: boolean;
    }): Promise<Fact[]>;
    forgetFact(id: string, replaceWith?: string): Promise<boolean>;
    restoreFact(id: string): Promise<boolean>;
    searchFacts(query: string, visibility: {
        owner: Principal;
    }, options?: {
        limit?: number;
        filter?: Partial<Fact>;
    }): Promise<Fact[]>;
    traverseGraph(startId: string, direction: 'out' | 'in' | 'both', maxDepth: number, predicates?: string[], visibility: {
        owner: Principal;
    }): Promise<GraphTraversalResult>;
    storeDocument(doc: Omit<DocumentResult, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<DocumentResult, 'id'>>): Promise<DocumentResult>;
    getDocument(id: string, visibility: {
        owner: Principal;
    }): Promise<DocumentResult | null>;
    searchDocuments(query: string, options?: {
        mode?: 'semantic' | 'keyword';
        attachedTo?: string;
        role?: string;
        limit?: number;
    }): Promise<DocumentResult[]>;
    vectorSearch(queryEmbedding: number[], visibility: {
        owner: Principal;
    }, options?: {
        limit?: number;
        minScore?: number;
    }): Promise<Array<{
        fact: Fact;
        score: number;
    }>>;
    storeProfile(profile: UserProfile): Promise<UserProfile>;
    getProfile(entityId: string, visibility: {
        owner: Principal;
    }): Promise<UserProfile | null>;
    updateProfile(entityId: string, updates: Partial<UserProfile>, visibility: {
        owner: Principal;
    }): Promise<UserProfile | null>;
}
export declare class PredicateRegistry {
    private predicates;
    register(predicate: PredicateDef): this;
    get(name: string): PredicateDef | undefined;
    list(): PredicateDef[];
    listByCategory(category: string): PredicateDef[];
    isValid(name: string): boolean;
    static standard(): PredicateRegistry;
}
export interface MemorySystemConfig {
    store: IMemoryStore;
    connectors: MemoryConnectors;
    predicates?: PredicateRegistry;
    predicateMode?: 'strict' | 'permissive';
    visibilityPolicy?: (owner: Principal) => VisibilitySpec;
    profileRegenerationThreshold?: number;
    groupBootstrap?: {
        displayName: string;
        identifiers: Identifier[];
    };
}
export declare class MemorySystem {
    private config;
    private store;
    private predicates;
    private events;
    private userProfiles;
    private behaviorRules;
    private factCounters;
    private profilesNeedingRegeneration;
    constructor(config: MemorySystemConfig);
    upsertEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Entity, 'id'>>): Promise<Entity>;
    findEntity(subject: SubjectRef, action?: 'find' | 'list'): Promise<Entity | Entity[] | null>;
    findEntityById(id: string): Promise<Entity | null>;
    searchEntities(query: string, principal: Principal): Promise<Entity[]>;
    remember(subject: SubjectRef, predicate: string, valueOrOptions?: string | {
        value?: string;
        objectId?: string;
        details?: Record<string, unknown>;
    }, options?: {
        confidence?: number;
        importance?: number;
        source?: string;
        contextIds?: string[];
        visibility?: Partial<VisibilitySpec>;
    }): Promise<Fact>;
    forget(factId: string, replaceWith?: string): Promise<boolean>;
    restoreFact(factId: string): Promise<boolean>;
    listFacts(subject: SubjectRef, predicate?: string, archivedOnly?: boolean): Promise<Fact[]>;
    searchFacts(query: string, principal: Principal, options?: {
        topK?: number;
        filter?: Partial<Fact>;
    }): Promise<Fact[]>;
    link(from: SubjectRef, predicate: string, to: SubjectRef): Promise<Fact>;
    storeDocument(doc: Omit<DocumentResult, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<DocumentResult, 'id'>>): Promise<DocumentResult>;
    searchDocuments(query: string, options?: {
        mode?: 'semantic' | 'keyword';
        attachedTo?: string;
        role?: string;
        limit?: number;
    }): Promise<DocumentResult[]>;
    graphTraversal(start: SubjectRef, direction: 'out' | 'in' | 'both', maxDepth: number, predicates?: string[]): Promise<GraphTraversalResult>;
    getUserProfile(userId: string, visibility: {
        owner: Principal;
    }): Promise<UserProfile | null>;
    regenerateProfile(userId: string): Promise<UserProfile>;
    setAgentRule(rule: string, replaces?: string[], principal?: Principal): Promise<void>;
    batchRemember(operations: Array<{
        subject: SubjectRef;
        predicate: string;
        value?: string;
        objectId?: string;
        confidence?: number;
    }>): Promise<Fact[]>;
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    private _ensurePersonEntity;
    private _incrementFactCounter;
    backfillAccessPrincipals(): Promise<{
        processed: number;
        updated: number;
    }>;
}
export type SubjectRef = string | {
    id: string;
} | {
    identifier: {
        kind: Identifier['kind'];
        value: string;
    };
} | {
    surface: string;
};
export interface CreateMemorySystemOptions extends MemorySystemConfig {
}
export declare function createMemorySystemWithConnectors(config: CreateMemorySystemOptions): MemorySystem;
export declare class InMemoryAdapter implements IMemoryStore {
    private entities;
    private facts;
    private documents;
    private profiles;
    private entityIdCounter;
    private factIdCounter;
    private docIdCounter;
    upsertEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Entity, 'id'>>): Promise<Entity>;
    findEntityById(id: string): Promise<Entity | null>;
    findEntityByIdentifier(identifier: Identifier): Promise<Entity | null>;
    findEntitiesByIdentifiers(identifiers: Identifier[]): Promise<Entity[]>;
    mergeEntities(targetId: string, sourceIds: string[]): Promise<Entity>;
    listEntities(_type?: EntityType, _visibility?: {
        owner: Principal;
    }): Promise<Entity[]>;
    deleteEntity(id: string): Promise<boolean>;
    searchEntities(query: string, _visibility: {
        owner: Principal;
    }): Promise<Entity[]>;
    storeFact(fact: Omit<Fact, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Fact, 'id'>>): Promise<Fact>;
    getFact(id: string, _visibility: {
        owner: Principal;
    }): Promise<Fact | null>;
    listFacts(subjectId: string, predicate?: string, options?: {
        archivedOnly?: boolean;
    }): Promise<Fact[]>;
    forgetFact(id: string, _replaceWith?: string): Promise<boolean>;
    restoreFact(id: string): Promise<boolean>;
    searchFacts(query: string, _visibility: {
        owner: Principal;
    }, options?: {
        limit?: number;
        filter?: Partial<Fact>;
    }): Promise<Fact[]>;
    traverseGraph(_startId: string, _direction: 'out' | 'in' | 'both', _maxDepth: number, _predicates?: string[], _visibility?: {
        owner: Principal;
    }): Promise<GraphTraversalResult>;
    storeDocument(doc: Omit<DocumentResult, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<DocumentResult, 'id'>>): Promise<DocumentResult>;
    getDocument(id: string, _visibility: {
        owner: Principal;
    }): Promise<DocumentResult | null>;
    searchDocuments(query: string, options?: {
        mode?: 'semantic' | 'keyword';
        attachedTo?: string;
        role?: string;
        limit?: number;
    }): Promise<DocumentResult[]>;
    storeProfile(profile: UserProfile): Promise<UserProfile>;
    getProfile(entityId: string, _visibility: {
        owner: Principal;
    }): Promise<UserProfile | null>;
    updateProfile(entityId: string, updates: Partial<UserProfile>, _visibility: {
        owner: Principal;
    }): Promise<UserProfile | null>;
    vectorSearch(_queryEmbedding: number[], _visibility: {
        owner: Principal;
    }, _options?: {
        limit?: number;
        minScore?: number;
    }): Promise<Array<{
        fact: Fact;
        score: number;
    }>>;
}
export type { Entity, Fact, Relation, VisibilitySpec, PredicateDef, UserProfile, MemoryQueryResult, GraphTraversalResult, DocumentResult, Principal, FactLifecycle };
//# sourceMappingURL=system.d.ts.map