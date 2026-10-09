/**
 * Memory System - Entity/Fact Store with Graph + Vector Search
 * 
 * A brain-like knowledge store with typed entities, atomic and relational facts,
 * provenance-aware storage, and three-principal permissions (owner/group/world).
 */
import { Connector } from '../core/connector.js';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ============================================================================
// Entity & Fact Types
// ============================================================================

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
  paths: Array<{ source: string; target: string; path: string[] }>;
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

// ============================================================================
// Connector Types
// ============================================================================

export interface EmbeddingConnector {
  embed(text: string | string[], options?: { dimensions?: number }): Promise<{ embeddings: number[][] }>;
  embedMultimodal?(assets: Array<{ type: string; data: string | Buffer; mimeType: string }>, options?: { dimensions?: number }): Promise<{ embeddings: number[][] }>;
  listModels?(): Promise<string[]>;
}

export interface ProfileConnector {
  generateProfile(prompt: string): Promise<string>;
}

export interface MemoryConnectors {
  embedding: EmbeddingConnector;
  profile?: ProfileConnector;
}

// ============================================================================
// Adapter Interface
// ============================================================================

export interface IMemoryStore {
  // Entity operations
  upsertEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Entity, 'id'>>): Promise<Entity>;
  findEntityById(id: string): Promise<Entity | null>;
  findEntityByIdentifier(identifier: Identifier): Promise<Entity | null>;
  findEntitiesByIdentifiers(identifiers: Identifier[]): Promise<Entity[]>;
  mergeEntities(targetId: string, sourceIds: string[]): Promise<Entity>;
  listEntities(type?: EntityType, visibility?: { owner: Principal }): Promise<Entity[]>;
  deleteEntity(id: string): Promise<boolean>;
  searchEntities(query: string, visibility: { owner: Principal }): Promise<Entity[]>;
  
  // Fact operations
  storeFact(fact: Omit<Fact, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Fact, 'id'>>): Promise<Fact>;
  getFact(id: string, visibility: { owner: Principal }): Promise<Fact | null>;
  listFacts(subjectId: string, predicate?: string, options?: { archivedOnly?: boolean }): Promise<Fact[]>;
  forgetFact(id: string, replaceWith?: string): Promise<boolean>;
  restoreFact(id: string): Promise<boolean>;
  searchFacts(query: string, visibility: { owner: Principal }, options?: { limit?: number; filter?: Partial<Fact> }): Promise<Fact[]>;
  
  // Graph operations
  traverseGraph(startId: string, direction: 'out' | 'in' | 'both', maxDepth: number, predicates?: string[], visibility?: { owner: Principal }): Promise<GraphTraversalResult>;
  
  // Document operations
  storeDocument(doc: Omit<DocumentResult, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<DocumentResult, 'id'>>): Promise<DocumentResult>;
  getDocument(id: string, visibility: { owner: Principal }): Promise<DocumentResult | null>;
  searchDocuments(query: string, options?: { mode?: 'semantic' | 'keyword'; attachedTo?: string; role?: string; limit?: number }): Promise<DocumentResult[]>;
  vectorSearch(queryEmbedding: number[], visibility: { owner: Principal }, options?: { limit?: number; minScore?: number }): Promise<Array<{ fact: Fact; score: number }>>;
  
  // Profile operations
  storeProfile(profile: UserProfile): Promise<UserProfile>;
  getProfile(entityId: string, visibility: { owner: Principal }): Promise<UserProfile | null>;
  updateProfile(entityId: string, updates: Partial<UserProfile>, visibility: { owner: Principal }): Promise<UserProfile | null>;
}

// ============================================================================
// Predicate Registry
// ============================================================================

export class PredicateRegistry {
  private predicates: Map<string, PredicateDef> = new Map();
  
  register(predicate: PredicateDef): this {
    this.predicates.set(predicate.name, predicate);
    return this;
  }
  
  get(name: string): PredicateDef | undefined {
    return this.predicates.get(name);
  }
  
  list(): PredicateDef[] {
    return Array.from(this.predicates.values());
  }
  
  listByCategory(category: string): PredicateDef[] {
    return this.list().filter(p => p.category === category);
  }
  
  isValid(name: string): boolean {
    return this.predicates.has(name);
  }
  
  static standard(): PredicateRegistry {
    const registry = new PredicateRegistry();
    
    // Standard predicates
    const standardPredicates: PredicateDef[] = [
      { name: 'prefers', description: 'A durable user preference.', category: 'preference', payloadKind: 'attribute', subjectTypes: ['person'], lifecycle: 'stable', weight: 2 },
      { name: 'works_at', description: 'Employment relationship.', category: 'employment', payloadKind: 'relation', subjectTypes: ['person'], lifecycle: 'evolving', weight: 3 },
      { name: 'located_in', description: 'Physical or virtual location.', category: 'location', payloadKind: 'attribute', subjectTypes: ['person', 'organization', 'project'], lifecycle: 'evolving' },
      { name: 'uses_tool', description: 'Tool or service used.', category: 'usage', payloadKind: 'relation', subjectTypes: ['person', 'organization'], lifecycle: 'evolving' },
      { name: 'has_skill', description: 'Skill or competency.', category: 'skill', payloadKind: 'relation', subjectTypes: ['person'], lifecycle: 'evolving', weight: 2 },
      { name: 'created', description: 'Created an entity.', category: 'action', payloadKind: 'relation', subjectTypes: ['person', 'organization'], lifecycle: 'transient' },
      { name: 'mentions', description: 'Mentioned in a document.', category: 'reference', payloadKind: 'relation', subjectTypes: ['entity'], lifecycle: 'transient' },
    ];
    
    for (const p of standardPredicates) {
      registry.register(p);
    }
    
    return registry;
  }
}

// ============================================================================
// Memory System
// ============================================================================

export interface MemorySystemConfig {
  store: IMemoryStore;
  connectors: MemoryConnectors;
  predicates?: PredicateRegistry;
  predicateMode?: 'strict' | 'permissive';
  visibilityPolicy?: (owner: Principal) => VisibilitySpec;
  profileRegenerationThreshold?: number; // Number of new facts before profile regenerates
  groupBootstrap?: {
    displayName: string;
    identifiers: Identifier[];
  };
}

export class MemorySystem {
  private config: MemorySystemConfig;
  private store: IMemoryStore;
  private predicates: PredicateRegistry;
  private events: EventEmitter = new EventEmitter();
  private userProfiles: Map<string, UserProfile> = new Map();
  private behaviorRules: Map<string, string[]> = new Map();
  private factCounters: Map<string, number> = new Map();
  private profilesNeedingRegeneration: Set<string> = new Set();
  
  constructor(config: MemorySystemConfig) {
    this.config = config;
    this.store = config.store;
    this.predicates = config.predicates || PredicateRegistry.standard();
  }
  
  // =========================================================================
  // Entity Operations
  // =========================================================================
  
  async upsertEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Entity, 'id'>>): Promise<Entity> {
    const result = await this.store.upsertEntity(entity);
    this.events.emit('entity:upserted', result);
    return result;
  }
  
  async findEntity(subject: SubjectRef, action: 'find' | 'list' = 'find'): Promise<Entity | Entity[] | null> {
    if (action === 'list') {
      const entities = await this.store.listEntities();
      return entities;
    }
    
    // Resolve subject
    if (typeof subject === 'string') {
      // Could be entity ID or identifier
      const entity = await this.store.findEntityById(subject);
      if (entity) return entity;
      
      // Try as identifier
      const byId = await this.store.findEntityByIdentifier({ kind: 'auto', value: subject });
      return byId;
    }
    
    if ('id' in subject) {
      return this.store.findEntityById(subject.id);
    }
    
    if ('identifier' in subject) {
      return this.store.findEntityByIdentifier(subject.identifier);
    }
    
    if ('surface' in subject) {
      // Surface-based lookup
      return null;
    }
    
    return null;
  }
  
  async findEntityById(id: string): Promise<Entity | null> {
    return this.store.findEntityById(id);
  }
  
  async searchEntities(query: string, principal: Principal): Promise<Entity[]> {
    return this.store.searchEntities(query, { owner: principal });
  }
  
  // =========================================================================
  // Fact Operations
  // =========================================================================
  
  async remember(
    subject: SubjectRef,
    predicate: string,
    valueOrOptions: string | { value?: string; objectId?: string; details?: Record<string, unknown> } = {},
    options?: {
      confidence?: number;
      importance?: number;
      source?: string;
      contextIds?: string[];
      visibility?: Partial<VisibilitySpec>;
    }
  ): Promise<Fact> {
    // Validate predicate
    if (this.config.predicateMode === 'strict' && !this.predicates.isValid(predicate)) {
      throw new Error(`Unknown predicate: ${predicate}`);
    }
    
    // Resolve subject to entity ID
    const entity = await this.findEntity(subject);
    let subjectId: string;
    
    if (Array.isArray(entity)) {
      throw new Error('Cannot determine single subject entity');
    }
    
    if (entity) {
      subjectId = entity.id;
    } else {
      // Auto-create entity for "me"
      if (typeof subject === 'string' && subject === 'me') {
        subjectId = await this._ensurePersonEntity('me');
      } else {
        subjectId = `unknown_${Date.now()}`;
      }
    }
    
    // Build fact
    const factDef = typeof valueOrOptions === 'string' 
      ? { value: valueOrOptions }
      : valueOrOptions;
    
    const fact = await this.store.storeFact({
      subjectId,
      predicate,
      ...factDef,
      confidence: options?.confidence ?? 0.9,
      importance: options?.importance ?? 1,
      source: options?.source || 'llm',
      contextIds: options?.contextIds || [],
      owner: 'user:current',
      visibility: {
        owner: 'user:current',
        group: null,
        world: 'none',
        ...options?.visibility,
      },
      archived: false,
    });
    
    this.events.emit('fact:stored', fact);
    
    // Track for profile regeneration
    this._incrementFactCounter(subjectId);
    
    return fact;
  }
  
  async forget(factId: string, replaceWith?: string): Promise<boolean> {
    const result = await this.store.forgetFact(factId, replaceWith);
    this.events.emit('fact:forgotten', { factId, replaceWith });
    return result;
  }
  
  async restoreFact(factId: string): Promise<boolean> {
    const result = await this.store.restoreFact(factId);
    this.events.emit('fact:restored', { factId });
    return result;
  }
  
  async listFacts(subject: SubjectRef, predicate?: string, archivedOnly = false): Promise<Fact[]> {
    const entity = await this.findEntity(subject);
    if (!entity || Array.isArray(entity)) return [];
    
    return this.store.listFacts(entity.id, predicate, { archivedOnly });
  }
  
  async searchFacts(query: string, principal: Principal, options?: { topK?: number; filter?: Partial<Fact> }): Promise<Fact[]> {
    return this.store.searchFacts(query, { owner: principal }, {
      limit: options?.topK || 10,
      filter: options?.filter,
    });
  }
  
  // =========================================================================
  // Entity Linking (Relations)
  // =========================================================================
  
  async link(from: SubjectRef, predicate: string, to: SubjectRef): Promise<Fact> {
    const fromEntity = await this.findEntity(from);
    const toEntity = await this.findEntity(to);
    
    if (!fromEntity || !toEntity || Array.isArray(fromEntity) || Array.isArray(toEntity)) {
      throw new Error('Cannot resolve entities for linking');
    }
    
    return this.remember(
      { id: fromEntity.id },
      predicate,
      { objectId: toEntity.id },
      { source: 'link' }
    );
  }
  
  // =========================================================================
  // Document Operations
  // =========================================================================
  
  async storeDocument(doc: Omit<DocumentResult, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<DocumentResult, 'id'>>): Promise<DocumentResult> {
    const result = await this.store.storeDocument(doc);
    this.events.emit('document:stored', result);
    return result;
  }
  
  async searchDocuments(query: string, options?: {
    mode?: 'semantic' | 'keyword';
    attachedTo?: string;
    role?: string;
    limit?: number;
  }): Promise<DocumentResult[]> {
    return this.store.searchDocuments(query, options);
  }
  
  // =========================================================================
  // Graph Traversal
  // =========================================================================
  
  async graphTraversal(
    start: SubjectRef,
    direction: 'out' | 'in' | 'both',
    maxDepth: number,
    predicates?: string[]
  ): Promise<GraphTraversalResult> {
    const entity = await this.findEntity(start);
    if (!entity || Array.isArray(entity)) {
      throw new Error('Cannot resolve starting entity for graph traversal');
    }
    
    return this.store.traverseGraph(entity.id, direction, maxDepth, predicates, { owner: 'user:current' });
  }
  
  // =========================================================================
  // Profile Management
  // =========================================================================
  
  async getUserProfile(userId: string, visibility: { owner: Principal }): Promise<UserProfile | null> {
    // Check cache first
    const cacheKey = `${userId}:${visibility.owner}`;
    const cached = this.userProfiles.get(cacheKey);
    if (cached) return cached;
    
    const profile = await this.store.getProfile(userId, visibility);
    if (profile) {
      this.userProfiles.set(cacheKey, profile);
    }
    return profile;
  }
  
  async regenerateProfile(userId: string): Promise<UserProfile> {
    // Gather facts for this user
    const facts = await this.store.listFacts(userId);
    const entities = await this.store.listEntities();
    
    // Generate profile using the profile connector
    let summary = '';
    if (this.config.connectors.profile) {
      const prompt = `Generate a user profile summary from these facts: ${JSON.stringify(facts.map(f => ({ predicate: f.predicate, value: f.value })))}`;
      summary = await this.config.connectors.profile.generateProfile(prompt);
    }
    
    // Build profile
    const profile: UserProfile = {
      entityId: userId,
      displayName: `User ${userId}`,
      summary,
      keyFacts: facts.filter(f => f.importance >= 2).slice(0, 20),
      relatedTasks: [],
      behaviorRules: this.behaviorRules.get(`${userId}:current_agent`) || [],
      metadata: { generatedAt: Date.now() },
    };
    
    await this.store.storeProfile(profile);
    this.userProfiles.set(`${userId}:user:${userId}`, profile);
    
    this.events.emit('profile:regenerated', profile);
    return profile;
  }
  
  async setAgentRule(rule: string, replaces?: string[], principal: Principal = 'user:current'): Promise<void> {
    const key = `${principal}:current_agent`;
    if (!this.behaviorRules.has(key)) {
      this.behaviorRules.set(key, []);
    }
    
    const rules = this.behaviorRules.get(key)!;
    if (replaces) {
      for (const r of replaces) {
        const idx = rules.indexOf(r);
        if (idx >= 0) rules.splice(idx, 1);
      }
    }
    rules.push(rule);
    
    this.events.emit('rule:set', { rule, replaces });
  }
  
  // =========================================================================
  // Batch Operations
  // =========================================================================
  
  async batchRemember(operations: Array<{
    subject: SubjectRef;
    predicate: string;
    value?: string;
    objectId?: string;
    confidence?: number;
  }>): Promise<Fact[]> {
    const results: Fact[] = [];
    for (const op of operations) {
      results.push(await this.remember(
        op.subject,
        op.predicate,
        { value: op.value, objectId: op.objectId },
        { confidence: op.confidence }
      ));
    }
    return results;
  }
  
  // =========================================================================
  // Event Handling
  // =========================================================================
  
  on(event: string, listener: (...args: any[]) => void): this {
    this.events.on(event, listener);
    return this;
  }
  
  off(event: string, listener: (...args: any[]) => void): this {
    this.events.off(event, listener);
    return this;
  }
  
  // =========================================================================
  // Private Methods
  // =========================================================================
  
  private async _ensurePersonEntity(subject: string): Promise<string> {
    if (subject === 'me') {
      // Bootstrap user entity
      const entity = await this.store.upsertEntity({
        type: 'person',
        displayName: 'Current User',
        identifiers: [{ kind: 'auto', value: 'me' }],
        aliases: ['current_user'],
        owner: 'user:current',
        visibility: { owner: 'user:current', group: null, world: 'none' },
        metadata: {},
      });
      return entity.id;
    }
    return `entity_${Date.now()}`;
  }
  
  private _incrementFactCounter(subjectId: string): void {
    const count = (this.factCounters.get(subjectId) || 0) + 1;
    this.factCounters.set(subjectId, count);
    
    const threshold = this.config.profileRegenerationThreshold || 5;
    if (count >= threshold) {
      this.profilesNeedingRegeneration.add(subjectId);
    }
  }
  
  // =========================================================================
  // Backfill / Migration
  // =========================================================================
  
  async backfillAccessPrincipals(): Promise<{ processed: number; updated: number }> {
    // In a real implementation, this would backfill existing facts with
    // explicit readPrincipals/writePrincipals fields
    let processed = 0;
    let updated = 0;
    
    const entities = await this.store.listEntities();
    for (const entity of entities) {
      processed++;
      if (!entity.visibility.readPrincipals && !entity.visibility.writePrincipals) {
        updated++;
        // Would update in store...
      }
    }
    
    return { processed, updated };
  }
}

// ============================================================================
// Subject Reference Type (flexible entity lookup)
// ============================================================================

export type SubjectRef =
  | string
  | { id: string }
  | { identifier: { kind: Identifier['kind']; value: string } }
  | { surface: string };

// ============================================================================
// Factory Function
// =========================================================================

export interface CreateMemorySystemOptions extends MemorySystemConfig {}

export function createMemorySystemWithConnectors(config: CreateMemorySystemOptions): MemorySystem {
  return new MemorySystem(config);
}

// ============================================================================
// In-Memory Adapter (for development/testing)
// =========================================================================

export class InMemoryAdapter implements IMemoryStore {
  private entities: Map<string, Entity> = new Map();
  private facts: Map<string, Fact> = new Map();
  private documents: Map<string, DocumentResult> = new Map();
  private profiles: Map<string, UserProfile> = new Map();
  private entityIdCounter = 0;
  private factIdCounter = 0;
  private docIdCounter = 0;
  
  async upsertEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Entity, 'id'>>): Promise<Entity> {
    const now = Date.now();
    if (!entity.id) {
      entity.id = `ent_${this.entityIdCounter++}`;
    }
    
    const existing = this.entities.get(entity.id);
    if (existing) {
      // Merge - merge identifiers, aliases
      const merged: Entity = {
        ...existing,
        ...entity,
        identifiers: [...new Set([...existing.identifiers, ...entity.identifiers])],
        aliases: [...new Set([...existing.aliases, ...entity.aliases])],
        updatedAt: now,
      };
      this.entities.set(entity.id, merged);
      return merged;
    }
    
    const newEntity: Entity = {
      ...entity,
      id: entity.id,
      createdAt: now,
      updatedAt: now,
      aliases: entity.aliases || [],
      identifiers: entity.identifiers || [],
      metadata: entity.metadata || {},
    };
    this.entities.set(entity.id, newEntity);
    return newEntity;
  }
  
  async findEntityById(id: string): Promise<Entity | null> {
    return this.entities.get(id) || null;
  }
  
  async findEntityByIdentifier(identifier: Identifier): Promise<Entity | null> {
    for (const entity of this.entities.values()) {
      const found = entity.identifiers.some(id => 
        id.kind === identifier.kind && id.value === identifier.value
      );
      if (found) return entity;
    }
    return null;
  }
  
  async findEntitiesByIdentifiers(identifiers: Identifier[]): Promise<Entity[]> {
    const results: Entity[] = [];
    for (const id of identifiers) {
      const entity = await this.findEntityByIdentifier(id);
      if (entity) results.push(entity);
    }
    return results;
  }
  
  async mergeEntities(targetId: string, sourceIds: string[]): Promise<Entity> {
    const target = this.entities.get(targetId);
    if (!target) throw new Error(`Target entity ${targetId} not found`);
    
    for (const sourceId of sourceIds) {
      const source = this.entities.get(sourceId);
      if (!source) continue;
      
      // Merge
      target.identifiers = [...new Set([...target.identifiers, ...source.identifiers])];
      target.aliases = [...new Set([...target.aliases, ...source.aliases])];
      target.updatedAt = Date.now();
      
      this.entities.delete(sourceId);
    }
    
    this.entities.set(targetId, target);
    return target;
  }
  
  async listEntities(_type?: EntityType, _visibility?: { owner: Principal }): Promise<Entity[]> {
    return Array.from(this.entities.values());
  }
  
  async deleteEntity(id: string): Promise<boolean> {
    return this.entities.delete(id);
  }
  
  async searchEntities(query: string, _visibility: { owner: Principal }): Promise<Entity[]> {
    const lower = query.toLowerCase();
    return Array.from(this.entities.values()).filter(e => 
      e.displayName.toLowerCase().includes(lower) ||
      e.aliases.some(a => a.toLowerCase().includes(lower))
    );
  }
  
  async storeFact(fact: Omit<Fact, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Fact, 'id'>>): Promise<Fact> {
    const now = Date.now();
    const id = fact.id || `fact_${this.factIdCounter++}`;
    const newFact: Fact = { ...fact, id, createdAt: now, updatedAt: now };
    this.facts.set(id, newFact);
    return newFact;
  }
  
  async getFact(id: string, _visibility: { owner: Principal }): Promise<Fact | null> {
    return this.facts.get(id) || null;
  }
  
  async listFacts(subjectId: string, predicate?: string, options?: { archivedOnly?: boolean }): Promise<Fact[]> {
    return Array.from(this.facts.values()).filter(f => {
      if (f.subjectId !== subjectId) return false;
      if (predicate && f.predicate !== predicate) return false;
      if (options?.archivedOnly && !f.archived) return false;
      return true;
    });
  }
  
  async forgetFact(id: string, _replaceWith?: string): Promise<boolean> {
    const fact = this.facts.get(id);
    if (!fact) return false;
    fact.archived = true;
    fact.supersededBy = _replaceWith;
    fact.updatedAt = Date.now();
    return true;
  }
  
  async restoreFact(id: string): Promise<boolean> {
    const fact = this.facts.get(id);
    if (!fact) return false;
    fact.archived = false;
    fact.supersededBy = undefined;
    fact.updatedAt = Date.now();
    return true;
  }
  
  async searchFacts(query: string, _visibility: { owner: Principal }, options?: { limit?: number; filter?: Partial<Fact> }): Promise<Fact[]> {
    const lower = query.toLowerCase();
    let results = Array.from(this.facts.values()).filter(f => {
      // Search in predicate, value, and source
      return (
        f.predicate.toLowerCase().includes(lower) ||
        (f.value && f.value.toLowerCase().includes(lower)) ||
        f.source.toLowerCase().includes(lower)
      );
    });
    
    if (options?.filter) {
      results = results.filter(f => {
        for (const [key, val] of Object.entries(options!.filter!)) {
          if (f[key as keyof Fact] !== val) return false;
        }
        return true;
      });
    }
    
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    
    return results;
  }
  
  async traverseGraph(_startId: string, _direction: 'out' | 'in' | 'both', _maxDepth: number, _predicates?: string[], _visibility?: { owner: Principal }): Promise<GraphTraversalResult> {
    return { nodes: [], edges: [], paths: [] };
  }
  
  async storeDocument(doc: Omit<DocumentResult, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<DocumentResult, 'id'>>): Promise<DocumentResult> {
    const now = Date.now();
    const id = doc.id || `doc_${this.docIdCounter++}`;
    const newDoc: DocumentResult = { ...doc, id, createdAt: now, updatedAt: now };
    this.documents.set(id, newDoc);
    return newDoc;
  }
  
  async getDocument(id: string, _visibility: { owner: Principal }): Promise<DocumentResult | null> {
    return this.documents.get(id) || null;
  }
  
  async searchDocuments(query: string, options?: { mode?: 'semantic' | 'keyword'; attachedTo?: string; role?: string; limit?: number }): Promise<DocumentResult[]> {
    const lower = query.toLowerCase();
    let results = Array.from(this.documents.values()).filter(d => {
      if (options?.attachedTo && d.metadata?.attachedTo !== options.attachedTo) return false;
      if (d.title.toLowerCase().includes(lower) || d.content.toLowerCase().includes(lower)) return true;
      return false;
    });
    
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    
    return results;
  }
  
  async storeProfile(profile: UserProfile): Promise<UserProfile> {
    this.profiles.set(profile.entityId, profile);
    return profile;
  }
  
  async getProfile(entityId: string, _visibility: { owner: Principal }): Promise<UserProfile | null> {
    return this.profiles.get(entityId) || null;
  }
  
  async updateProfile(entityId: string, updates: Partial<UserProfile>, _visibility: { owner: Principal }): Promise<UserProfile | null> {
    const existing = this.profiles.get(entityId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    this.profiles.set(entityId, updated);
    return updated;
  }
  
  async vectorSearch(_queryEmbedding: number[], _visibility: { owner: Principal }, _options?: { limit?: number; minScore?: number }): Promise<Array<{ fact: Fact; score: number }>> {
    // Simplified - in real impl would use actual vector similarity
    const allFacts = Array.from(this.facts.values());
    return allFacts.map(f => ({ fact: f, score: 0.8 })).slice(0, _options?.limit || 10);
  }
}

// ============================================================================
// Re-exports (type re-exports for external consumers)
// ============================================================================
// Note: Entity, Fact, Relation, etc. are defined and exported above as interfaces

