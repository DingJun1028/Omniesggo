import { EventEmitter } from 'events';
import * as crypto from 'crypto';
// ============================================================================
// Predicate Registry
// ============================================================================
export class PredicateRegistry {
    predicates = new Map();
    register(predicate) {
        this.predicates.set(predicate.name, predicate);
        return this;
    }
    get(name) {
        return this.predicates.get(name);
    }
    list() {
        return Array.from(this.predicates.values());
    }
    listByCategory(category) {
        return this.list().filter(p => p.category === category);
    }
    isValid(name) {
        return this.predicates.has(name);
    }
    static standard() {
        const registry = new PredicateRegistry();
        // Standard predicates
        const standardPredicates = [
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
export class MemorySystem {
    config;
    store;
    predicates;
    events = new EventEmitter();
    userProfiles = new Map();
    behaviorRules = new Map();
    factCounters = new Map();
    profilesNeedingRegeneration = new Set();
    constructor(config) {
        this.config = config;
        this.store = config.store;
        this.predicates = config.predicates || PredicateRegistry.standard();
    }
    // =========================================================================
    // Entity Operations
    // =========================================================================
    async upsertEntity(entity) {
        const result = await this.store.upsertEntity(entity);
        this.events.emit('entity:upserted', result);
        return result;
    }
    async findEntity(subject, action = 'find') {
        if (action === 'list') {
            const entities = await this.store.listEntities();
            return entities;
        }
        // Resolve subject
        if (typeof subject === 'string') {
            // Could be entity ID or identifier
            const entity = await this.store.findEntityById(subject);
            if (entity)
                return entity;
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
    async findEntityById(id) {
        return this.store.findEntityById(id);
    }
    async searchEntities(query, principal) {
        return this.store.searchEntities(query, { owner: principal });
    }
    // =========================================================================
    // Fact Operations
    // =========================================================================
    async remember(subject, predicate, valueOrOptions = {}, options) {
        // Validate predicate
        if (this.config.predicateMode === 'strict' && !this.predicates.isValid(predicate)) {
            throw new Error(`Unknown predicate: ${predicate}`);
        }
        // Resolve subject to entity ID
        const entity = await this.findEntity(subject);
        let subjectId;
        if (Array.isArray(entity)) {
            throw new Error('Cannot determine single subject entity');
        }
        if (entity) {
            subjectId = entity.id;
        }
        else {
            // Auto-create entity for "me"
            if (typeof subject === 'string' && subject === 'me') {
                subjectId = await this._ensurePersonEntity('me');
            }
            else {
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
    async forget(factId, replaceWith) {
        const result = await this.store.forgetFact(factId, replaceWith);
        this.events.emit('fact:forgotten', { factId, replaceWith });
        return result;
    }
    async restoreFact(factId) {
        const result = await this.store.restoreFact(factId);
        this.events.emit('fact:restored', { factId });
        return result;
    }
    async listFacts(subject, predicate, archivedOnly = false) {
        const entity = await this.findEntity(subject);
        if (!entity || Array.isArray(entity))
            return [];
        return this.store.listFacts(entity.id, predicate, { archivedOnly });
    }
    async searchFacts(query, principal, options) {
        return this.store.searchFacts(query, { owner: principal }, {
            limit: options?.topK || 10,
            filter: options?.filter,
        });
    }
    // =========================================================================
    // Entity Linking (Relations)
    // =========================================================================
    async link(from, predicate, to) {
        const fromEntity = await this.findEntity(from);
        const toEntity = await this.findEntity(to);
        if (!fromEntity || !toEntity || Array.isArray(fromEntity) || Array.isArray(toEntity)) {
            throw new Error('Cannot resolve entities for linking');
        }
        return this.remember({ id: fromEntity.id }, predicate, { objectId: toEntity.id }, { source: 'link' });
    }
    // =========================================================================
    // Document Operations
    // =========================================================================
    async storeDocument(doc) {
        const result = await this.store.storeDocument(doc);
        this.events.emit('document:stored', result);
        return result;
    }
    async searchDocuments(query, options) {
        return this.store.searchDocuments(query, options);
    }
    // =========================================================================
    // Graph Traversal
    // =========================================================================
    async graphTraversal(start, direction, maxDepth, predicates) {
        const entity = await this.findEntity(start);
        if (!entity || Array.isArray(entity)) {
            throw new Error('Cannot resolve starting entity for graph traversal');
        }
        return this.store.traverseGraph(entity.id, direction, maxDepth, predicates, { owner: 'user:current' });
    }
    // =========================================================================
    // Profile Management
    // =========================================================================
    async getUserProfile(userId, visibility) {
        // Check cache first
        const cacheKey = `${userId}:${visibility.owner}`;
        const cached = this.userProfiles.get(cacheKey);
        if (cached)
            return cached;
        const profile = await this.store.getProfile(userId, visibility);
        if (profile) {
            this.userProfiles.set(cacheKey, profile);
        }
        return profile;
    }
    async regenerateProfile(userId) {
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
        const profile = {
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
    async setAgentRule(rule, replaces, principal = 'user:current') {
        const key = `${principal}:current_agent`;
        if (!this.behaviorRules.has(key)) {
            this.behaviorRules.set(key, []);
        }
        const rules = this.behaviorRules.get(key);
        if (replaces) {
            for (const r of replaces) {
                const idx = rules.indexOf(r);
                if (idx >= 0)
                    rules.splice(idx, 1);
            }
        }
        rules.push(rule);
        this.events.emit('rule:set', { rule, replaces });
    }
    // =========================================================================
    // Batch Operations
    // =========================================================================
    async batchRemember(operations) {
        const results = [];
        for (const op of operations) {
            results.push(await this.remember(op.subject, op.predicate, { value: op.value, objectId: op.objectId }, { confidence: op.confidence }));
        }
        return results;
    }
    // =========================================================================
    // Event Handling
    // =========================================================================
    on(event, listener) {
        this.events.on(event, listener);
        return this;
    }
    off(event, listener) {
        this.events.off(event, listener);
        return this;
    }
    // =========================================================================
    // Private Methods
    // =========================================================================
    async _ensurePersonEntity(subject) {
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
    _incrementFactCounter(subjectId) {
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
    async backfillAccessPrincipals() {
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
export function createMemorySystemWithConnectors(config) {
    return new MemorySystem(config);
}
// ============================================================================
// In-Memory Adapter (for development/testing)
// =========================================================================
export class InMemoryAdapter {
    entities = new Map();
    facts = new Map();
    documents = new Map();
    profiles = new Map();
    entityIdCounter = 0;
    factIdCounter = 0;
    docIdCounter = 0;
    async upsertEntity(entity) {
        const now = Date.now();
        if (!entity.id) {
            entity.id = `ent_${this.entityIdCounter++}`;
        }
        const existing = this.entities.get(entity.id);
        if (existing) {
            // Merge - merge identifiers, aliases
            const merged = {
                ...existing,
                ...entity,
                identifiers: [...new Set([...existing.identifiers, ...entity.identifiers])],
                aliases: [...new Set([...existing.aliases, ...entity.aliases])],
                updatedAt: now,
            };
            this.entities.set(entity.id, merged);
            return merged;
        }
        const newEntity = {
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
    async findEntityById(id) {
        return this.entities.get(id) || null;
    }
    async findEntityByIdentifier(identifier) {
        for (const entity of this.entities.values()) {
            const found = entity.identifiers.some(id => id.kind === identifier.kind && id.value === identifier.value);
            if (found)
                return entity;
        }
        return null;
    }
    async findEntitiesByIdentifiers(identifiers) {
        const results = [];
        for (const id of identifiers) {
            const entity = await this.findEntityByIdentifier(id);
            if (entity)
                results.push(entity);
        }
        return results;
    }
    async mergeEntities(targetId, sourceIds) {
        const target = this.entities.get(targetId);
        if (!target)
            throw new Error(`Target entity ${targetId} not found`);
        for (const sourceId of sourceIds) {
            const source = this.entities.get(sourceId);
            if (!source)
                continue;
            // Merge
            target.identifiers = [...new Set([...target.identifiers, ...source.identifiers])];
            target.aliases = [...new Set([...target.aliases, ...source.aliases])];
            target.updatedAt = Date.now();
            this.entities.delete(sourceId);
        }
        this.entities.set(targetId, target);
        return target;
    }
    async listEntities(_type, _visibility) {
        return Array.from(this.entities.values());
    }
    async deleteEntity(id) {
        return this.entities.delete(id);
    }
    async searchEntities(query, _visibility) {
        const lower = query.toLowerCase();
        return Array.from(this.entities.values()).filter(e => e.displayName.toLowerCase().includes(lower) ||
            e.aliases.some(a => a.toLowerCase().includes(lower)));
    }
    async storeFact(fact) {
        const now = Date.now();
        const id = fact.id || `fact_${this.factIdCounter++}`;
        const newFact = { ...fact, id, createdAt: now, updatedAt: now };
        this.facts.set(id, newFact);
        return newFact;
    }
    async getFact(id, _visibility) {
        return this.facts.get(id) || null;
    }
    async listFacts(subjectId, predicate, options) {
        return Array.from(this.facts.values()).filter(f => {
            if (f.subjectId !== subjectId)
                return false;
            if (predicate && f.predicate !== predicate)
                return false;
            if (options?.archivedOnly && !f.archived)
                return false;
            return true;
        });
    }
    async forgetFact(id, _replaceWith) {
        const fact = this.facts.get(id);
        if (!fact)
            return false;
        fact.archived = true;
        fact.supersededBy = _replaceWith;
        fact.updatedAt = Date.now();
        return true;
    }
    async restoreFact(id) {
        const fact = this.facts.get(id);
        if (!fact)
            return false;
        fact.archived = false;
        fact.supersededBy = undefined;
        fact.updatedAt = Date.now();
        return true;
    }
    async searchFacts(query, _visibility, options) {
        const lower = query.toLowerCase();
        let results = Array.from(this.facts.values()).filter(f => {
            // Search in predicate, value, and source
            return (f.predicate.toLowerCase().includes(lower) ||
                (f.value && f.value.toLowerCase().includes(lower)) ||
                f.source.toLowerCase().includes(lower));
        });
        if (options?.filter) {
            results = results.filter(f => {
                for (const [key, val] of Object.entries(options.filter)) {
                    if (f[key] !== val)
                        return false;
                }
                return true;
            });
        }
        if (options?.limit) {
            results = results.slice(0, options.limit);
        }
        return results;
    }
    async traverseGraph(_startId, _direction, _maxDepth, _predicates, _visibility) {
        return { nodes: [], edges: [], paths: [] };
    }
    async storeDocument(doc) {
        const now = Date.now();
        const id = doc.id || `doc_${this.docIdCounter++}`;
        const newDoc = { ...doc, id, createdAt: now, updatedAt: now };
        this.documents.set(id, newDoc);
        return newDoc;
    }
    async getDocument(id, _visibility) {
        return this.documents.get(id) || null;
    }
    async searchDocuments(query, options) {
        const lower = query.toLowerCase();
        let results = Array.from(this.documents.values()).filter(d => {
            if (options?.attachedTo && d.metadata?.attachedTo !== options.attachedTo)
                return false;
            if (d.title.toLowerCase().includes(lower) || d.content.toLowerCase().includes(lower))
                return true;
            return false;
        });
        if (options?.limit) {
            results = results.slice(0, options.limit);
        }
        return results;
    }
    async storeProfile(profile) {
        this.profiles.set(profile.entityId, profile);
        return profile;
    }
    async getProfile(entityId, _visibility) {
        return this.profiles.get(entityId) || null;
    }
    async updateProfile(entityId, updates, _visibility) {
        const existing = this.profiles.get(entityId);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates, updatedAt: Date.now() };
        this.profiles.set(entityId, updated);
        return updated;
    }
    async vectorSearch(_queryEmbedding, _visibility, _options) {
        // Simplified - in real impl would use actual vector similarity
        const allFacts = Array.from(this.facts.values());
        return allFacts.map(f => ({ fact: f, score: 0.8 })).slice(0, _options?.limit || 10);
    }
}
//# sourceMappingURL=system.js.map