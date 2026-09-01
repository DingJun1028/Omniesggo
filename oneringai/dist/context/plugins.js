export class MemoryPluginNextGen {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Inject user profile into system message
     */
    async injectProfile(userId, principal) {
        const profile = await this.config.memory.getUserProfile(userId, { owner: `user:${principal}` });
        if (!profile)
            return '';
        return `## About the User\n\n${profile.displayName}\n\n${profile.summary}\n\n` +
            `Key facts:\n${profile.keyFacts.map(f => `- ${f.predicate}: ${f.value || f.objectId}`).join('\n')}\n\n` +
            `Behavior rules:\n${profile.behaviorRules.map(r => `- ${r}`).join('\n')}`;
    }
    /**
     * Get all read tools
     */
    getReadTools() {
        return [
            this.memory_recall(),
            this.memory_graph(),
            this.memory_search(),
            this.memory_search_documents(),
            this.memory_find_entity(),
            this.memory_list_facts(),
        ];
    }
    /**
     * Get all write tools
     */
    getWriteTools() {
        return [
            this.memory_remember(),
            this.memory_link(),
            this.memory_upsert_entity(),
            this.memory_forget(),
            this.memory_restore(),
            this.memory_set_agent_rule(),
        ];
    }
    // =========================================================================
    // Read Tools
    // =========================================================================
    memory_recall() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_recall',
                    description: 'Recall the user profile, top facts, and optionally documents, semantic search results, or graph neighbors',
                    parameters: {
                        type: 'object',
                        properties: {
                            subject: { type: ['string', 'object'], description: 'Subject reference (id, "me", {id}, {identifier}, {surface})' },
                            include: { type: 'array', items: { type: 'string', enum: ['documents', 'semantic', 'neighbors'] }, description: 'What to include in the recall' },
                            topK: { type: 'number', description: 'Number of items to retrieve (default 10)', default: 10 },
                        },
                        required: ['subject'],
                    },
                },
            },
            permission: { scope: 'always', riskLevel: 'low' },
            execute: async (args) => {
                const subject = this._resolveSubject(args.subject);
                const include = args.include || [];
                const topK = args.topK || 10;
                // Get profile
                const profile = await this.config.memory.getUserProfile(subject, 'user:current');
                const result = {
                    profile: profile ? { displayName: profile.displayName, summary: profile.summary } : null,
                    keyFacts: profile ? profile.keyFacts.slice(0, this.config.userProfileInjection?.topFacts || 10) : [],
                    behaviorRules: profile ? profile.behaviorRules : [],
                };
                if (include.includes('semantic')) {
                    const facts = await this.config.memory.searchFacts(subject, 'user:current', { topK });
                    result.semanticResults = facts;
                }
                if (include.includes('documents')) {
                    // Would need a query - use subject name as query
                    const docs = await this.config.memory.searchDocuments(subject, { limit: topK });
                    result.documents = docs;
                }
                if (include.includes('neighbors')) {
                    const graph = await this.config.memory.graphTraversal(subject, 'both', 1);
                    result.neighbors = graph.nodes;
                }
                return result;
            },
        };
    }
    memory_graph() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_graph',
                    description: 'Traverse the knowledge graph from a starting entity',
                    parameters: {
                        type: 'object',
                        properties: {
                            start: { type: ['string', 'object'], description: 'Starting entity reference' },
                            direction: { type: 'string', enum: ['out', 'in', 'both'], default: 'both' },
                            maxDepth: { type: 'number', default: 3, description: 'Maximum traversal depth' },
                            predicates: { type: 'array', items: { type: 'string' }, description: 'Optional predicate filter' },
                        },
                        required: ['start'],
                    },
                },
            },
            permission: { scope: 'always', riskLevel: 'low' },
            execute: async (args) => {
                const subject = this._resolveSubject(args.start);
                return this.config.memory.graphTraversal(subject, args.direction || 'both', args.maxDepth || 3, args.predicates);
            },
        };
    }
    memory_search() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_search',
                    description: 'Search facts semantically using vector embeddings',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Search query' },
                            topK: { type: 'number', default: 10, description: 'Number of results (default 10)' },
                            filter: { type: 'object', description: 'Optional filter on fact fields' },
                        },
                        required: ['query'],
                    },
                },
            },
            permission: { scope: 'always', riskLevel: 'low' },
            execute: async (args) => {
                return this.config.memory.searchFacts(args.query, 'user:current', { topK: args.topK, filter: args.filter });
            },
        };
    }
    memory_search_documents() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_search_documents',
                    description: 'Search long-form documents by content',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Search query' },
                            mode: { type: 'string', enum: ['semantic', 'keyword'], default: 'keyword' },
                            attachedTo: { type: 'string', description: 'Filter by attached entity' },
                            role: { type: 'string', description: 'Filter by role (e.g. "context", "evidence")' },
                            limit: { type: 'number', default: 10 },
                        },
                        required: ['query'],
                    },
                },
            },
            permission: { scope: 'always', riskLevel: 'low' },
            execute: async (args) => {
                return this.config.memory.searchDocuments(args.query, {
                    mode: args.mode,
                    attachedTo: args.attachedTo,
                    role: args.role,
                    limit: args.limit,
                });
            },
        };
    }
    memory_find_entity() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_find_entity',
                    description: 'Look up an entity by ID or identifier, or list all entities',
                    parameters: {
                        type: 'object',
                        properties: {
                            by: { type: ['string', 'object'], description: 'Subject reference or identifier lookup', default: 'find' },
                            action: { type: 'string', enum: ['find', 'list'], default: 'find' },
                        },
                        required: ['by'],
                    },
                },
            },
            permission: { scope: 'always', riskLevel: 'low' },
            execute: async (args) => {
                if (args.action === 'list') {
                    return this.config.memory.findEntity({ surface: 'all' }, 'list');
                }
                const entity = await this.config.memory.findEntity(args.by, 'find');
                return entity;
            },
        };
    }
    memory_list_facts() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_list_facts',
                    description: 'List structured facts for a subject',
                    parameters: {
                        type: 'object',
                        properties: {
                            subject: { type: ['string', 'object'], description: 'Subject reference' },
                            predicate: { type: 'string', description: 'Optional predicate filter' },
                            archivedOnly: { type: 'boolean', default: false, description: 'Show only archived (superseded) facts' },
                        },
                        required: ['subject'],
                    },
                },
            },
            permission: { scope: 'always', riskLevel: 'low' },
            execute: async (args) => {
                const subject = this._resolveSubject(args.subject);
                return this.config.memory.listFacts(subject, args.predicate, { archivedOnly: args.archivedOnly });
            },
        };
    }
    // =========================================================================
    // Write Tools
    // =========================================================================
    memory_remember() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_remember',
                    description: 'Record a fact about a subject (atomic) or attach a document',
                    parameters: {
                        type: 'object',
                        properties: {
                            subject: { type: ['string', 'object'], description: 'Subject reference' },
                            predicate: { type: 'string', description: 'Predicate name from registry' },
                            value: { type: 'string', description: 'Atomic fact value (for attribute predicates)' },
                            objectId: { type: 'string', description: 'Object entity ID (for relation predicates)' },
                            details: { type: 'object', description: 'Additional payload details' },
                            confidence: { type: 'number', description: 'Confidence 0-1 (default 0.9)' },
                            importance: { type: 'number', description: 'Importance 1-5 (default 1)' },
                        },
                        required: ['subject', 'predicate'],
                    },
                },
            },
            permission: { scope: 'session', riskLevel: 'medium', approvalMessage: 'Record a fact in memory' },
            execute: async (args) => {
                const subject = this._resolveSubject(args.subject);
                return this.config.memory.remember(subject, args.predicate, {
                    value: args.value,
                    objectId: args.objectId,
                    details: args.details,
                }, {
                    confidence: args.confidence,
                    importance: args.importance,
                });
            },
        };
    }
    memory_link() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_link',
                    description: 'Record a relational fact between two subjects',
                    parameters: {
                        type: 'object',
                        properties: {
                            from: { type: ['string', 'object'], description: 'Source subject' },
                            predicate: { type: 'string', description: 'Predicate name' },
                            to: { type: ['string', 'object'], description: 'Target subject' },
                        },
                        required: ['from', 'predicate', 'to'],
                    },
                },
            },
            permission: { scope: 'session', riskLevel: 'medium', approvalMessage: 'Link two entities in memory' },
            execute: async (args) => {
                return this.config.memory.link(this._resolveSubject(args.from), args.predicate, this._resolveSubject(args.to));
            },
        };
    }
    memory_upsert_entity() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_upsert_entity',
                    description: 'Create or merge an entity by identifier',
                    parameters: {
                        type: 'object',
                        properties: {
                            type: { type: 'string', description: 'Entity type (person, organization, project, etc.)' },
                            displayName: { type: 'string', description: 'Display name' },
                            identifiers: {
                                type: 'array',
                                items: { type: 'object', properties: { kind: { type: 'string' }, value: { type: 'string' } }, required: ['kind', 'value'] },
                                description: 'Identifiers (email, slack_id, github_login, domain, etc.)'
                            },
                            aliases: { type: 'array', items: { type: 'string' }, description: 'Alternative names' },
                            groupId: { type: 'string', description: 'Group ID (host-managed, not from LLM)' },
                        },
                        required: ['type', 'displayName', 'identifiers'],
                    },
                },
            },
            permission: { scope: 'session', riskLevel: 'medium', approvalMessage: 'Create or merge an entity' },
            execute: async (args) => {
                // groupId must be host-managed, not from LLM args
                return this.config.memory.upsertEntity({
                    type: args.type,
                    displayName: args.displayName,
                    identifiers: args.identifiers,
                    aliases: args.aliases || [],
                    owner: 'user:current',
                    visibility: { owner: 'user:current', group: args.groupId, world: 'none' },
                    metadata: {},
                });
            },
        };
    }
    memory_forget() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_forget',
                    description: 'Archive a fact (supersede with correction if provided). Rate-limited to 10/60s per user.',
                    parameters: {
                        type: 'object',
                        properties: {
                            factId: { type: 'string', description: 'ID of the fact to forget' },
                            replaceWith: { type: 'string', description: 'Optional replacement fact content' },
                        },
                        required: ['factId'],
                    },
                },
            },
            permission: { scope: 'session', riskLevel: 'high', approvalMessage: 'Archive a fact in memory' },
            execute: async (args) => {
                return this.config.memory.forget(args.factId, args.replaceWith);
            },
        };
    }
    memory_restore() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_restore',
                    description: 'Un-archive a forgotten fact (undo)',
                    parameters: {
                        type: 'object',
                        properties: {
                            factId: { type: 'string', description: 'ID of the fact to restore' },
                        },
                        required: ['factId'],
                    },
                },
            },
            permission: { scope: 'session', riskLevel: 'medium', approvalMessage: 'Restore an archived fact' },
            execute: async (args) => {
                return this.config.memory.restoreFact(args.factId);
            },
        };
    }
    memory_set_agent_rule() {
        return {
            definition: {
                type: 'function',
                function: {
                    name: 'memory_set_agent_rule',
                    description: 'Record a user-specific behavior rule for THIS agent (e.g., "be terse", "reply in Russian")',
                    parameters: {
                        type: 'object',
                        properties: {
                            rule: { type: 'string', description: 'The behavior rule to set' },
                            replaces: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Optional existing rules to replace'
                            },
                        },
                        required: ['rule'],
                    },
                },
            },
            permission: { scope: 'session', riskLevel: 'medium', approvalMessage: 'Set a behavior rule for this agent' },
            execute: async (args) => {
                await this.config.memory.setAgentRule(args.rule, args.replaces);
                return { success: true, rule: args.rule };
            },
        };
    }
    // =========================================================================
    // Private helpers
    // =========================================================================
    _resolveSubject(ref) {
        if (typeof ref === 'string') {
            return ref;
        }
        if ('id' in ref)
            return ref.id;
        if ('identifier' in ref)
            return ref.identifier.value;
        if ('surface' in ref)
            return ref.surface;
        return '';
    }
}
export class WorkingMemoryPluginNextGen {
    storage = new Map();
    maxSize = 100;
    async store(key, value, priority = 'raw') {
        const entry = {
            key,
            value,
            priority,
            createdAt: Date.now(),
            tags: [],
        };
        // Simple eviction - remove oldest if over max size
        if (this.storage.size >= this.maxSize) {
            const oldest = Array.from(this.storage.entries())
                .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
            if (oldest)
                this.storage.delete(oldest[0]);
        }
        this.storage.set(key, entry);
        return entry;
    }
    async retrieve(key) {
        const entry = this.storage.get(key);
        if (!entry)
            return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.storage.delete(key);
            return null;
        }
        return entry.value;
    }
    async delete(key) {
        return this.storage.delete(key);
    }
    async list() {
        return Array.from(this.storage.values())
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    getTools() {
        return [
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'store_get',
                        description: 'Retrieve a value from working memory',
                        parameters: {
                            type: 'object',
                            properties: {
                                store: { type: 'string', enum: ['notes', 'whiteboard', 'instructions', 'user_info', 'workspace'] },
                                key: { type: 'string' },
                            },
                            required: ['store', 'key'],
                        },
                    },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const plugin = this._getPluginForStore(args.store);
                    const value = await plugin?.retrieve(args.key);
                    return { key: args.key, value };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'store_set',
                        description: 'Store a value in working memory',
                        parameters: {
                            type: 'object',
                            properties: {
                                store: { type: 'string', enum: ['notes', 'whiteboard', 'instructions', 'user_info', 'workspace'] },
                                key: { type: 'string' },
                                value: { type: 'string' },
                                description: { type: 'string' },
                                priority: { type: 'string', enum: ['raw', 'summary', 'findings'], default: 'raw' },
                            },
                            required: ['store', 'key', 'value'],
                        },
                    },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const plugin = this._getPluginForStore(args.store);
                    await plugin?.store(args.key, args.value, args.priority);
                    return { success: true };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'store_delete',
                        description: 'Delete a value from working memory',
                        parameters: {
                            type: 'object',
                            properties: {
                                store: { type: 'string', enum: ['notes', 'whiteboard', 'instructions', 'user_info', 'workspace'] },
                                key: { type: 'string' },
                            },
                            required: ['store', 'key'],
                        },
                    },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const plugin = this._getPluginForStore(args.store);
                    return { success: await plugin?.delete(args.key) };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'store_list',
                        description: 'List all values in a working memory store',
                        parameters: {
                            type: 'object',
                            properties: {
                                store: { type: 'string', enum: ['notes', 'whiteboard', 'instructions', 'user_info', 'workspace'] },
                            },
                            required: ['store'],
                        },
                    },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const plugin = this._getPluginForStore(args.store);
                    return { entries: await plugin?.list() };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'store_action',
                        description: 'Perform an action on a working memory store',
                        parameters: {
                            type: 'object',
                            properties: {
                                store: { type: 'string', enum: ['notes', 'whiteboard', 'instructions', 'user_info', 'workspace'] },
                                action: { type: 'string', enum: ['cleanup_raw', 'query', 'archive', 'clear'] },
                                options: { type: 'object' },
                            },
                            required: ['store', 'action'],
                        },
                    },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    // Handle store-specific actions
                    if (args.action === 'clear' && args.store === 'instructions') {
                        // Would clear persistent instructions
                    }
                    return { success: true, action: args.action };
                },
            },
        ];
    }
    _getPluginForStore(_store) {
        // In a real implementation, this would route to different storage backends
        // For now, all stores use this same plugin
        return this;
    }
}
export class InContextMemoryPluginNextGen {
    storage = new Map();
    maxEntries = 100;
    set(key, description, value, priority = 'normal', showInUI = false) {
        const entry = {
            key,
            description,
            value,
            priority,
            showInUI,
            createdAt: Date.now(),
        };
        if (this.storage.size >= this.maxEntries) {
            // Evict lowest priority
            const entries = Array.from(this.storage.entries())
                .sort((a, b) => this._priorityScore(a[1]) - this._priorityScore(b[1]));
            if (entries.length > 0) {
                this.storage.delete(entries[0][0]);
            }
        }
        this.storage.set(key, entry);
        return entry;
    }
    get(key) {
        return this.storage.get(key);
    }
    delete(key) {
        return this.storage.delete(key);
    }
    list() {
        return Array.from(this.storage.values())
            .sort((a, b) => this._priorityScore(b) - this._priorityScore(a));
    }
    /**
     * Get entries as context string for LLM
     */
    getAsContext() {
        const entries = this.list();
        return entries
            .map(e => `<context key="${e.key}">${e.description}: ${JSON.stringify(e.value)}</context>`)
            .join('\n\n');
    }
    _priorityScore(entry) {
        const scores = { high: 3, normal: 2, low: 1 };
        return scores[entry.priority] + (entry.createdAt / 1e9);
    }
}
// ============================================================================
// Persistent Instructions Plugin
// ============================================================================
export class PersistentInstructionsPluginNextGen {
    instructions = new Map();
    set(key, content) {
        const now = Date.now();
        const existing = this.instructions.get(key);
        this.instructions.set(key, {
            content,
            createdAt: existing?.createdAt || now,
            updatedAt: now,
        });
    }
    delete(key) {
        return this.instructions.delete(key);
    }
    clear() {
        this.instructions.clear();
    }
    list() {
        return Array.from(this.instructions.entries()).map(([key, entry]) => ({ key, content: entry.content }));
    }
    getAsContext() {
        const entries = this.list();
        if (entries.length === 0)
            return '';
        return '## Persistent Instructions\n\n' + entries.map(e => `- ${e.key}: ${e.content}`).join('\n');
    }
}
export class UserInfoPluginNextGen {
    userInfo = new Map();
    todos = new Map();
    // User Info
    setInfo(key, value, description) {
        const now = Date.now();
        const existing = this.userInfo.get(key);
        const entry = { key, value, description, createdAt: existing?.createdAt || now, updatedAt: now };
        this.userInfo.set(key, entry);
        return entry;
    }
    getInfo(key) {
        if (!key)
            return Array.from(this.userInfo.values());
        return this.userInfo.get(key);
    }
    deleteInfo(key) {
        return this.userInfo.delete(key);
    }
    clearInfo() {
        this.userInfo.clear();
    }
    getAsContext() {
        const entries = Array.from(this.userInfo.values());
        if (entries.length === 0)
            return '';
        return '## About the User\n\n' + entries.map(e => `- ${e.key}: ${e.value}${e.description ? ` (${e.description})` : ''}`).join('\n');
    }
    // TODOs
    addTodo(todo) {
        const now = Date.now();
        const id = `todo_${now}_${Math.random().toString(36).slice(2, 8)}`;
        const full = { ...todo, id, status: 'pending', createdAt: now, updatedAt: now, tags: todo.tags || [], people: todo.people || [] };
        this.todos.set(id, full);
        return full;
    }
    updateTodo(id, updates) {
        const existing = this.todos.get(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates, id, createdAt: existing.createdAt, updatedAt: Date.now() };
        this.todos.set(id, updated);
        return updated;
    }
    removeTodo(id) {
        return this.todos.delete(id);
    }
    listTodos(options) {
        let todos = Array.from(this.todos.values());
        if (options?.status)
            todos = todos.filter(t => t.status === options.status);
        if (options?.tags)
            todos = todos.filter(t => options.tags.some(tag => t.tags?.includes(tag)));
        return todos.sort((a, b) => b.createdAt - a.createdAt);
    }
    getTodosContext() {
        // Clean up completed TODOs after 48 hours
        const now = Date.now();
        const cutoff = 48 * 3600 * 1000;
        for (const [id, todo] of this.todos) {
            if (todo.status === 'done' && now - todo.updatedAt > cutoff) {
                this.todos.delete(id);
            }
        }
        const todos = this.listTodos({ status: 'pending' });
        if (todos.length === 0)
            return '';
        return '## Current TODOs\n\n' + todos.map(t => `- [ ] ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ''}`).join('\n');
    }
    getTools() {
        return [
            {
                definition: {
                    type: 'function',
                    function: { name: 'todo_add', description: 'Create a TODO item', parameters: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, people: { type: 'array', items: { type: 'string' } }, dueDate: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['title'] } },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const todo = this.addTodo({
                        title: args.title,
                        description: args.description,
                        people: args.people,
                        dueDate: args.dueDate,
                        tags: args.tags,
                    });
                    return todo;
                },
            },
            {
                definition: {
                    type: 'function',
                    function: { name: 'todo_update', description: 'Update a TODO item', parameters: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string', enum: ['pending', 'in_progress', 'done', 'cancelled'] } }, required: ['id'] } },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const result = this.updateTodo(args.id, { status: args.status });
                    return { success: !!result };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: { name: 'todo_remove', description: 'Delete a TODO item', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    return { success: this.removeTodo(args.id) };
                },
            },
        ];
    }
}
// ============================================================================
// Tool Catalog Plugin
// ============================================================================
export class ToolCatalogPluginNextGen {
    pinnedCategories = new Set();
    autoLoadCategories = [];
    availableCategories = new Map();
    setPinned(categories) {
        this.pinnedCategories = new Set(categories);
    }
    setAutoLoad(categories) {
        this.autoLoadCategories = categories;
    }
    registerCategory(name, toolNames) {
        this.availableCategories.set(name, toolNames);
    }
    getAvailableCategories() {
        return Array.from(this.availableCategories.keys());
    }
    getPinnedCategories() {
        return Array.from(this.pinnedCategories);
    }
    getAutoLoadCategories() {
        return this.autoLoadCategories;
    }
    isPinned(category) {
        return this.pinnedCategories.has(category);
    }
    isLoaded(category) {
        return this.isPinned(category) || this.autoLoadCategories.includes(category);
    }
    getToolsForCategory(category) {
        return this.availableCategories.get(category) || [];
    }
    getInstructions() {
        const all = this.getAvailableCategories();
        const pinned = this.getPinnedCategories();
        const autoLoaded = this.getAutoLoadCategories().filter(c => !pinned.includes(c));
        let result = '## Available Tool Categories\n\n';
        if (all.length > 0) {
            result += all.map(cat => {
                const marker = pinned.includes(cat) ? ' [PINNED]' : '';
                return `- ${cat}${marker}`;
            }).join('\n');
        }
        else {
            result += '(No tool categories available)';
        }
        if (autoLoaded.length > 0) {
            result += `\n\nAuto-loaded: ${autoLoaded.join(', ')}`;
        }
        return result;
    }
    getTools() {
        return [
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'tool_catalog_search',
                        description: 'Search available tool categories by name or description',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'Search query for tool categories' },
                            },
                            required: ['query'],
                        },
                    },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const query = args.query.toLowerCase();
                    const matches = this.getAvailableCategories().filter(cat => cat.toLowerCase().includes(query) ||
                        this.getToolsForCategory(cat).some(t => t.toLowerCase().includes(query)));
                    return { categories: matches, count: matches.length };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'tool_catalog_load',
                        description: 'Load a tool category (make its tools available to the agent)',
                        parameters: {
                            type: 'object',
                            properties: {
                                category: { type: 'string', description: 'The tool category to load' },
                            },
                            required: ['category'],
                        },
                    },
                },
                permission: { scope: 'session', riskLevel: 'medium' },
                execute: async (args) => {
                    const category = args.category;
                    if (!this.availableCategories.has(category)) {
                        return { success: false, error: `Category "${category}" not found` };
                    }
                    if (this.isPinned(category)) {
                        return { success: false, error: `Category "${category}" is pinned and cannot be unloaded` };
                    }
                    // In a real implementation, this would trigger tool loading
                    return { success: true, category, tools: this.getToolsForCategory(category) };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'tool_catalog_unload',
                        description: 'Unload a tool category (remove its tools from the agent)',
                        parameters: {
                            type: 'object',
                            properties: {
                                category: { type: 'string', description: 'The tool category to unload' },
                            },
                            required: ['category'],
                        },
                    },
                },
                permission: { scope: 'session', riskLevel: 'medium' },
                execute: async (args) => {
                    const category = args.category;
                    if (this.isPinned(category)) {
                        return { success: false, error: `Category "${category}" is pinned` };
                    }
                    return { success: true, category };
                },
            },
        ];
    }
}
// ============================================================================
// Re-exports
// ============================================================================
export { SubjectRef };
//# sourceMappingURL=plugins.js.map