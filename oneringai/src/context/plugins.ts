/**
 * Memory Plugin NextGen - Integrates MemorySystem into Agent Context
 * 
 * 6 read tools: memory_recall, memory_graph, memory_search,
 * memory_search_documents, memory_find_entity, memory_list_facts
 */
import type { MemorySystem, SubjectRef, Fact, Entity, UserProfile, MemoryQueryResult, GraphTraversalResult, DocumentResult } from '../memory/system.js';
import type { ToolFunction } from '../types/index.js';

export interface MemoryPluginConfig {
  memory: MemorySystem;
  userProfileInjection?: {
    topFacts?: number;
    relatedTasks?: boolean;
    behaviorRules?: boolean;
    groupProfile?: boolean;
  };
  groupBootstrap?: {
    displayName: string;
    identifiers: { kind: string; value: string }[];
  };
}

export class MemoryPluginNextGen {
  private config: MemoryPluginConfig;
  
  constructor(config: MemoryPluginConfig) {
    this.config = config;
  }
  
  /**
   * Inject user profile into system message
   */
  async injectProfile(userId: string, principal: string): Promise<string> {
    const profile = await this.config.memory.getUserProfile(userId, { owner: `user:${principal}` as any });
    if (!profile) return '';
    
    return `## About the User\n\n${profile.displayName}\n\n${profile.summary}\n\n` +
           `Key facts:\n${profile.keyFacts.map(f => `- ${f.predicate}: ${f.value || f.objectId}`).join('\n')}\n\n` +
           `Behavior rules:\n${profile.behaviorRules.map(r => `- ${r}`).join('\n')}`;
  }
  
  /**
   * Get all read tools
   */
  getReadTools(): ToolFunction[] {
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
  getWriteTools(): ToolFunction[] {
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
  
  private memory_recall(): ToolFunction {
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
        const args_ = args as any;
        const subject = this._resolveSubject(args_.subject);
        const include = (args_.include || []) as string[];
        const topK = args_.topK || 10;
        
        // Get profile
        const profile = await this.config.memory.getUserProfile(subject, 'user:current' as any);
        
        const result: any = {
          profile: profile ? { displayName: profile.displayName, summary: profile.summary } : null,
          keyFacts: profile ? profile.keyFacts.slice(0, this.config.userProfileInjection?.topFacts || 10) : [],
          behaviorRules: profile ? profile.behaviorRules : [],
        };
        
        if (include.includes('semantic')) {
          const facts = await this.config.memory.searchFacts(subject as string, 'user:current' as any, { topK });
          result.semanticResults = facts;
        }
        
        if (include.includes('documents')) {
          // Would need a query - use subject name as query
          const docs = await this.config.memory.searchDocuments(subject as string, { limit: topK });
          result.documents = docs;
        }
        
        if ((include as string[]).includes('neighbors')) {
          const graph = await this.config.memory.graphTraversal(subject, 'both', 1);
          result.neighbors = graph.nodes;
        }
        
        return result;
      },
    };
  }
  
  private memory_graph(): ToolFunction {
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
        const args_ = args as any;
        const subject = this._resolveSubject(args_.start);
        return this.config.memory.graphTraversal(
          subject,
          args_.direction || 'both',
          args_.maxDepth || 3,
          args_.predicates
        );
      },
    };
  }
  
  private memory_search(): ToolFunction {
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
        const args_ = args as any;
        return this.config.memory.searchFacts(
          args_.query,
          'user:current' as any,
          { topK: args_.topK, filter: args_.filter }
        );
      },
    };
  }
  
  private memory_search_documents(): ToolFunction {
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
        const args_ = args as any;
        return this.config.memory.searchDocuments(args_.query, {
          mode: args_.mode,
          attachedTo: args_.attachedTo,
          role: args_.role,
          limit: args_.limit,
        });
      },
    };
  }
  
  private memory_find_entity(): ToolFunction {
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
        const args_ = args as any;
        if (args_.action === 'list') {
          return this.config.memory.findEntity({ surface: 'all' } as any, 'list');
        }
        
        const entity = await this.config.memory.findEntity(args_.by, 'find');
        return entity;
      },
    };
  }
  
  private memory_list_facts(): ToolFunction {
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
        const args_ = args as any;
        const subject = this._resolveSubject(args_.subject);
        return this.config.memory.listFacts(
          subject as string,
          args_.predicate,
          { archivedOnly: args_.archivedOnly || false } as any
        );
      },
    };
  }
  
  // =========================================================================
  // Write Tools
  // =========================================================================
  
  private memory_remember(): ToolFunction {
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
        const args_ = args as any;
        const subject = this._resolveSubject(args_.subject);
        
        return this.config.memory.remember(
          subject,
          args_.predicate,
          {
            value: args_.value,
            objectId: args_.objectId,
            details: args_.details,
          },
          {
            confidence: args_.confidence,
            importance: args_.importance,
          }
        );
      },
    };
  }
  
  private memory_link(): ToolFunction {
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
        const args_ = args as any;
        return this.config.memory.link(
          this._resolveSubject(args_.from),
          args_.predicate,
          this._resolveSubject(args_.to)
        );
      },
    };
  }
  
  private memory_upsert_entity(): ToolFunction {
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
        const args_ = args as any;
        // groupId must be host-managed, not from LLM args
        return this.config.memory.upsertEntity({
          type: args_.type,
          displayName: args_.displayName,
          identifiers: args_.identifiers,
          aliases: args_.aliases || [],
          owner: 'user:current' as any,
          visibility: { owner: 'user:current', group: args_.groupId, world: 'none' } as any,
          metadata: {},
        });
      },
    };
  }
  
  private memory_forget(): ToolFunction {
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
        const args_ = args as any;
        return this.config.memory.forget(args_.factId, args_.replaceWith);
      },
    };
  }
  
  private memory_restore(): ToolFunction {
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
        const args_ = args as any;
        return this.config.memory.restoreFact(args_.factId);
      },
    };
  }
  
  private memory_set_agent_rule(): ToolFunction {
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
        const args_ = args as any;
        await this.config.memory.setAgentRule(args_.rule, args_.replaces);
        return { success: true, rule: args_.rule };
      },
    };
  }
  
  // =========================================================================
  // Private helpers
  // =========================================================================
  
  private _resolveSubject(ref: SubjectRef): string {
    if (typeof ref === 'string') {
      return ref;
    }
    if ('id' in ref) return ref.id;
    if ('identifier' in ref) return ref.identifier.value;
    if ('surface' in ref) return ref.surface;
    return '';
  }
}

// ============================================================================
// Working Memory Plugin
// ============================================================================

export interface WorkingMemoryEntry {
  key: string;
  value: unknown;
  priority: 'raw' | 'summary' | 'findings';
  createdAt: number;
  expiresAt?: number;
  tags: string[];
}

export class WorkingMemoryPluginNextGen {
  private storage: Map<string, WorkingMemoryEntry> = new Map();
  private readonly maxSize: number = 100;
  
  async store(key: string, value: unknown, priority: 'raw' | 'summary' | 'findings' = 'raw'): Promise<WorkingMemoryEntry> {
    const entry: WorkingMemoryEntry = {
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
      if (oldest) this.storage.delete(oldest[0]);
    }
    
    this.storage.set(key, entry);
    return entry;
  }
  
  async retrieve(key: string): Promise<unknown> {
    const entry = this.storage.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.storage.delete(key);
      return null;
    }
    return entry.value;
  }
  
  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }
  
  async list(): Promise<WorkingMemoryEntry[]> {
    return Array.from(this.storage.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  
  getTools(): ToolFunction[] {
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
          const args_ = args as any;
          const plugin = this._getPluginForStore(args_.store);
          const value = await plugin?.retrieve(args_.key);
          return { key: args_.key, value };
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
          const args_ = args as any;
          const plugin = this._getPluginForStore(args_.store);
          await plugin?.store(args_.key, args_.value, args_.priority);
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
          const args_ = args as any;
          const plugin = this._getPluginForStore(args_.store);
          return { success: await plugin?.delete(args_.key) };
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
          const args_ = args as any;
          const plugin = this._getPluginForStore(args_.store);
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
          const args_ = args as any;
          // Handle store-specific actions
          if (args_.action === 'clear' && args_.store === 'instructions') {
            // Would clear persistent instructions
          }
          return { success: true, action: args_.action };
        },
      },
    ];
  }
  
  private _getPluginForStore(_store: string): WorkingMemoryPluginNextGen | undefined {
    // In a real implementation, this would route to different storage backends
    // For now, all stores use this same plugin
    return this;
  }
}

// ============================================================================
// In-Context Memory Plugin
// ============================================================================

export interface InContextMemoryEntry {
  key: string;
  description: string;
  value: unknown;
  priority: 'high' | 'normal' | 'low';
  showInUI: boolean;
  createdAt: number;
}

export class InContextMemoryPluginNextGen {
  private storage: Map<string, InContextMemoryEntry> = new Map();
  private readonly maxEntries: number = 100;
  
  set(key: string, description: string, value: unknown, priority: 'high' | 'normal' | 'low' = 'normal', showInUI = false): InContextMemoryEntry {
    const entry: InContextMemoryEntry = {
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
  
  get(key: string): InContextMemoryEntry | undefined {
    return this.storage.get(key);
  }
  
  delete(key: string): boolean {
    return this.storage.delete(key);
  }
  
  list(): InContextMemoryEntry[] {
    return Array.from(this.storage.values())
      .sort((a, b) => this._priorityScore(b) - this._priorityScore(a));
  }
  
  /**
   * Get entries as context string for LLM
   */
  getAsContext(): string {
    const entries = this.list();
    return entries
      .map(e => `<context key="${e.key}">${e.description}: ${JSON.stringify(e.value)}</context>`)
      .join('\n\n');
  }
  
  private _priorityScore(entry: InContextMemoryEntry): number {
    const scores = { high: 3, normal: 2, low: 1 };
    return scores[entry.priority] + (entry.createdAt / 1e9);
  }
}

// ============================================================================
// Persistent Instructions Plugin
// ============================================================================

export class PersistentInstructionsPluginNextGen {
  private instructions: Map<string, { content: string; createdAt: number; updatedAt: number }> = new Map();
  
  set(key: string, content: string): void {
    const now = Date.now();
    const existing = this.instructions.get(key);
    this.instructions.set(key, {
      content,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });
  }
  
  delete(key: string): boolean {
    return this.instructions.delete(key);
  }
  
  clear(): void {
    this.instructions.clear();
  }
  
  list(): Array<{ key: string; content: string }> {
    return Array.from(this.instructions.entries()).map(([key, entry]) => ({ key, content: entry.content }));
  }
  
  getAsContext(): string {
    const entries = this.list();
    if (entries.length === 0) return '';
    return '## Persistent Instructions\n\n' + entries.map(e => `- ${e.key}: ${e.content}`).join('\n');
  }
}

// ============================================================================
// User Info Plugin
// ============================================================================

export interface UserInfoEntry {
  key: string;
  value: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  people?: string[];
  dueDate?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export class UserInfoPluginNextGen {
  private userInfo: Map<string, UserInfoEntry> = new Map();
  private todos: Map<string, Todo> = new Map();
  
  // User Info
  setInfo(key: string, value: string, description?: string): UserInfoEntry {
    const now = Date.now();
    const existing = this.userInfo.get(key);
    const entry: UserInfoEntry = { key, value, description, createdAt: existing?.createdAt || now, updatedAt: now };
    this.userInfo.set(key, entry);
    return entry;
  }
  
  getInfo(key?: string): UserInfoEntry | UserInfoEntry[] {
    if (!key) return Array.from(this.userInfo.values());
    return this.userInfo.get(key)!;
  }
  
  deleteInfo(key: string): boolean {
    return this.userInfo.delete(key);
  }
  
  clearInfo(): void {
    this.userInfo.clear();
  }
  
  getAsContext(): string {
    const entries = Array.from(this.userInfo.values());
    if (entries.length === 0) return '';
    return '## About the User\n\n' + entries.map(e => `- ${e.key}: ${e.value}${e.description ? ` (${e.description})` : ''}`).join('\n');
  }
  
  // TODOs
  addTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Todo {
    const now = Date.now();
    const id = `todo_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const full: Todo = { ...todo, id, status: 'pending', createdAt: now, updatedAt: now, tags: todo.tags || [], people: todo.people || [] };
    this.todos.set(id, full);
    return full;
  }
  
  updateTodo(id: string, updates: Partial<Todo>): Todo | null {
    const existing = this.todos.get(id);
    if (!existing) return null;
    const updated: Todo = { ...existing, ...updates, id, createdAt: existing.createdAt, updatedAt: Date.now() };
    this.todos.set(id, updated);
    return updated;
  }
  
  removeTodo(id: string): boolean {
    return this.todos.delete(id);
  }
  
  listTodos(options?: { status?: string; tags?: string[] }): Todo[] {
    let todos = Array.from(this.todos.values());
    if (options?.status) todos = todos.filter(t => t.status === options.status);
    if (options?.tags) todos = todos.filter(t => options.tags!.some(tag => t.tags?.includes(tag)));
    return todos.sort((a, b) => b.createdAt - a.createdAt);
  }
  
  getTodosContext(): string {
    // Clean up completed TODOs after 48 hours
    const now = Date.now();
    const cutoff = 48 * 3600 * 1000;
    for (const [id, todo] of this.todos) {
      if (todo.status === 'done' && now - todo.updatedAt > cutoff) {
        this.todos.delete(id);
      }
    }
    
    const todos = this.listTodos({ status: 'pending' });
    if (todos.length === 0) return '';
    
    return '## Current TODOs\n\n' + todos.map(t => `- [ ] ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ''}`).join('\n');
  }
  
  getTools(): ToolFunction[] {
    return [
      {
        definition: {
          type: 'function',
          function: { name: 'todo_add', description: 'Create a TODO item', parameters: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, people: { type: 'array', items: { type: 'string' } }, dueDate: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['title'] } },
        },
        permission: { scope: 'always', riskLevel: 'low' },
        execute: async (args) => {
          const args_ = args as any;
          const todo = this.addTodo({
            title: args_.title,
            description: args_.description,
            people: args_.people,
            dueDate: args_.dueDate,
            tags: args_.tags,
            status: 'pending',
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
          const args_ = args as any;
          const result = this.updateTodo(args_.id, { status: args_.status });
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
          return { success: this.removeTodo(args.id as string) };
        },
      },
    ];
  }
}

// ============================================================================
// Tool Catalog Plugin
// ============================================================================

export class ToolCatalogPluginNextGen {
  private pinnedCategories: Set<string> = new Set();
  private autoLoadCategories: string[] = [];
  private availableCategories: Map<string, string[]> = new Map();
  
  setPinned(categories: string[]): void {
    this.pinnedCategories = new Set(categories);
  }
  
  setAutoLoad(categories: string[]): void {
    this.autoLoadCategories = categories;
  }
  
  registerCategory(name: string, toolNames: string[]): void {
    this.availableCategories.set(name, toolNames);
  }
  
  getAvailableCategories(): string[] {
    return Array.from(this.availableCategories.keys());
  }
  
  getPinnedCategories(): string[] {
    return Array.from(this.pinnedCategories);
  }
  
  getAutoLoadCategories(): string[] {
    return this.autoLoadCategories;
  }
  
  isPinned(category: string): boolean {
    return this.pinnedCategories.has(category);
  }
  
  isLoaded(category: string): boolean {
    return this.isPinned(category) || this.autoLoadCategories.includes(category);
  }
  
  getToolsForCategory(category: string): string[] {
    return this.availableCategories.get(category) || [];
  }
  
  getInstructions(): string {
    const all = this.getAvailableCategories();
    const pinned = this.getPinnedCategories();
    const autoLoaded = this.getAutoLoadCategories().filter(c => !pinned.includes(c));
    
    let result = '## Available Tool Categories\n\n';
    if (all.length > 0) {
      result += all.map(cat => {
        const marker = pinned.includes(cat) ? ' [PINNED]' : '';
        return `- ${cat}${marker}`;
      }).join('\n');
    } else {
      result += '(No tool categories available)';
    }
    
    if (autoLoaded.length > 0) {
      result += `\n\nAuto-loaded: ${autoLoaded.join(', ')}`;
    }
    
    return result;
  }
  
  getTools(): ToolFunction[] {
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
          const args_ = args as any;
          const query = (args_.query).toLowerCase();
          const matches = this.getAvailableCategories().filter(cat => 
            cat.toLowerCase().includes(query) ||
            this.getToolsForCategory(cat).some(t => t.toLowerCase().includes(query))
          );
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
          const args_ = args as any;
          const category = args_.category;
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
          const args_ = args as any;
          const category = args_.category;
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

export type { SubjectRef };
