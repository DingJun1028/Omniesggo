import { EventEmitter } from 'events';
export class SharedWorkspacePluginNextGen {
    entries = new Map();
    eventLog = [];
    events = new EventEmitter();
    maxEntries = 1000;
    archives = new Map();
    /**
     * Post a new entry to the workspace
     */
    post(entry) {
        const id = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = Date.now();
        const workspaceEntry = {
            ...entry,
            id,
            createdAt: now,
            updatedAt: now,
            tags: entry.tags || [],
        };
        this.entries.set(id, workspaceEntry);
        this._logEntry(id, 'set', workspaceEntry.content, workspaceEntry.owner);
        this.events.emit('entry:posted', workspaceEntry);
        // Evict oldest if over limit
        if (this.entries.size > this.maxEntries) {
            const oldest = Array.from(this.entries.entries())
                .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
            this._archive(oldest[0], oldest[1]);
            this.entries.delete(oldest[0]);
        }
        return workspaceEntry;
    }
    /**
     * Get entry by key
     */
    get(key) {
        return Array.from(this.entries.values()).find(e => e.key === key);
    }
    /**
     * Get entry by ID
     */
    getById(id) {
        return this.entries.get(id);
    }
    /**
     * Update an existing entry
     */
    update(id, content) {
        const entry = this.entries.get(id);
        if (!entry)
            return false;
        entry.content = content;
        entry.updatedAt = Date.now();
        this._logEntry(id, 'update', content, entry.owner);
        this.events.emit('entry:updated', entry);
        return true;
    }
    /**
     * Archive an entry
     */
    archive(id) {
        const entry = this.entries.get(id);
        if (!entry)
            return false;
        const key = entry.key;
        if (!this.archives.has(key)) {
            this.archives.set(key, []);
        }
        this.archives.get(key).push(entry);
        this.entries.delete(id);
        this._logEntry(id, 'archive', entry.content, entry.owner);
        this.events.emit('entry:archived', entry);
        return true;
    }
    /**
     * Delete an entry
     */
    delete(id) {
        const entry = this.entries.get(id);
        if (!entry)
            return false;
        this.entries.delete(id);
        this._logEntry(id, 'delete', '', entry.owner);
        this.events.emit('entry:deleted', entry);
        return true;
    }
    /**
     * List all entries
     */
    list(options) {
        let entries = Array.from(this.entries.values());
        if (options?.owner) {
            entries = entries.filter(e => e.owner === options.owner);
        }
        if (options?.type) {
            entries = entries.filter(e => e.type === options.type);
        }
        if (options?.tags && options.tags.length > 0) {
            entries = entries.filter(e => options.tags.some(tag => e.tags.includes(tag)));
        }
        return entries.sort((a, b) => b.createdAt - a.createdAt);
    }
    /**
     * History for a specific key
     */
    history(key) {
        const entries = Array.from(this.entries.values()).filter(e => e.key === key);
        const archived = this.archives.get(key) || [];
        return [...archived, ...entries].sort((a, b) => a.createdAt - b.createdAt);
    }
    /**
     * Get event log
     */
    getEventLog() {
        return [...this.eventLog];
    }
    /**
     * Get tools for agent use
     */
    getTools() {
        const self = this;
        return [
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'workspace_post',
                        description: 'Post an artifact to the shared workspace',
                        parameters: {
                            type: 'object',
                            properties: {
                                key: { type: 'string', description: 'Unique key for this workspace entry' },
                                content: { type: 'string', description: 'The content to post' },
                                type: { type: 'string', enum: ['artifact', 'status', 'note', 'task'], description: 'Entry type' },
                                tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
                            },
                            required: ['key', 'content', 'type'],
                        },
                    },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const entry = self.post({
                        key: args.key,
                        content: args.content,
                        owner: 'current_agent',
                        type: args.type,
                        tags: args.tags || [],
                    });
                    return { success: true, id: entry.id };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'workspace_get',
                        description: 'Retrieve an entry from the shared workspace',
                        parameters: {
                            type: 'object',
                            properties: {
                                key: { type: 'string', description: 'The key to look up' },
                            },
                            required: ['key'],
                        },
                    },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const entry = self.get(args.key);
                    return entry ? { entry } : { error: 'Entry not found' };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'workspace_list',
                        description: 'List workspace entries with optional filtering',
                        parameters: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['artifact', 'status', 'note', 'task'], description: 'Filter by entry type' },
                                tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
                            },
                        },
                    },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const entries = self.list({
                        type: args.type,
                        tags: args.tags,
                    });
                    return { entries, count: entries.length };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'workspace_history',
                        description: 'Get version history for a workspace key',
                        parameters: {
                            type: 'object',
                            properties: {
                                key: { type: 'string', description: 'The key to get history for' },
                            },
                            required: ['key'],
                        },
                    },
                },
                permission: { scope: 'always', riskLevel: 'low' },
                execute: async (args) => {
                    const history = self.history(args.key);
                    return { history, count: history.length };
                },
            },
            {
                definition: {
                    type: 'function',
                    function: {
                        name: 'workspace_action',
                        description: 'Perform an action on the workspace (archive, delete, log)',
                        parameters: {
                            type: 'object',
                            properties: {
                                action: { type: 'string', enum: ['archive', 'delete', 'log'], description: 'The action to perform' },
                                id: { type: 'string', description: 'The entry ID' },
                                options: { type: 'object' },
                            },
                            required: ['action', 'id'],
                        },
                    },
                },
                permission: { scope: 'session', riskLevel: 'medium' },
                execute: async (args) => {
                    const entry = self.getById(args.id);
                    if (!entry)
                        return { success: false, error: 'Entry not found' };
                    switch (args.action) {
                        case 'archive':
                            return { success: self.archive(args.id) };
                        case 'delete':
                            return { success: self.delete(args.id) };
                        case 'log':
                            const entries = self.getEventLog();
                            return { log: entries };
                    }
                    return { success: false, error: 'Unknown action' };
                },
            },
        ];
    }
    // Event handling
    on(event, listener) {
        this.events.on(event, listener);
    }
    off(event, listener) {
        this.events.off(event, listener);
    }
    // Private helpers
    _logEntry(id, type, content, agentId) {
        this.eventLog.push({
            id: `log_${this.eventLog.length + 1}`,
            key: id,
            type,
            content,
            timestamp: Date.now(),
            agentId,
        });
        // Keep log bounded
        if (this.eventLog.length > 10000) {
            this.eventLog = this.eventLog.slice(1000);
        }
    }
    _archive(key, entry) {
        if (!this.archives.has(key)) {
            this.archives.set(key, []);
        }
        this.archives.get(key).push(entry);
    }
}
//# sourceMappingURL=workspace.js.map