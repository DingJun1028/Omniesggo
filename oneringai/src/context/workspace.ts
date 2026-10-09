/**
 * Shared Workspace Plugin for Agent Context
 */
import type { ToolFunction } from '../types/index.js';
import { EventEmitter } from 'events';

export interface WorkspaceEntry {
  id: string;
  key: string;
  content: string;
  owner: string;
  type: 'artifact' | 'status' | 'note' | 'task';
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface WorkspaceLogEntry {
  id: string;
  key: string;
  type: 'set' | 'update' | 'archive' | 'delete';
  content: string;
  timestamp: number;
  agentId: string;
}

export class SharedWorkspacePluginNextGen {
  private entries: Map<string, WorkspaceEntry> = new Map();
  private eventLog: WorkspaceLogEntry[] = [];
  private events: EventEmitter = new EventEmitter();
  private readonly maxEntries: number = 1000;
  private archives: Map<string, WorkspaceEntry[]> = new Map();
  
  /**
   * Post a new entry to the workspace
   */
  post(entry: Omit<WorkspaceEntry, 'id' | 'createdAt' | 'updatedAt'>): WorkspaceEntry {
    const id = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    
    const workspaceEntry: WorkspaceEntry = {
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
  get(key: string): WorkspaceEntry | undefined {
    return Array.from(this.entries.values()).find(e => e.key === key);
  }
  
  /**
   * Get entry by ID
   */
  getById(id: string): WorkspaceEntry | undefined {
    return this.entries.get(id);
  }
  
  /**
   * Update an existing entry
   */
  update(id: string, content: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    
    entry.content = content;
    entry.updatedAt = Date.now();
    this._logEntry(id, 'update', content, entry.owner);
    this.events.emit('entry:updated', entry);
    return true;
  }
  
  /**
   * Archive an entry
   */
  archive(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    
    const key = entry.key;
    if (!this.archives.has(key)) {
      this.archives.set(key, []);
    }
    this.archives.get(key)!.push(entry);
    
    this.entries.delete(id);
    this._logEntry(id, 'archive', entry.content, entry.owner);
    this.events.emit('entry:archived', entry);
    return true;
  }
  
  /**
   * Delete an entry
   */
  delete(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    
    this.entries.delete(id);
    this._logEntry(id, 'delete', '', entry.owner);
    this.events.emit('entry:deleted', entry);
    return true;
  }
  
  /**
   * List all entries
   */
  list(options?: { owner?: string; type?: string; tags?: string[] }): WorkspaceEntry[] {
    let entries = Array.from(this.entries.values());
    
    if (options?.owner) {
      entries = entries.filter(e => e.owner === options.owner);
    }
    if (options?.type) {
      entries = entries.filter(e => e.type === options.type);
    }
    if (options?.tags && options.tags.length > 0) {
      entries = entries.filter(e => options.tags!.some(tag => e.tags.includes(tag)));
    }
    
    return entries.sort((a, b) => b.createdAt - a.createdAt);
  }
  
  /**
   * History for a specific key
   */
  history(key: string): WorkspaceEntry[] {
    const entries = Array.from(this.entries.values()).filter(e => e.key === key);
    const archived = this.archives.get(key) || [];
    return [...archived, ...entries].sort((a, b) => a.createdAt - b.createdAt);
  }
  
  /**
   * Get event log
   */
  getEventLog(): WorkspaceLogEntry[] {
    return [...this.eventLog];
  }
  
  /**
   * Get tools for agent use
   */
  getTools(): ToolFunction[] {
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
            key: args.key as string,
            content: args.content as string,
            owner: 'current_agent',
            type: (args.type as 'artifact' | 'status' | 'note' | 'task'),
            tags: args.tags as string[] || [],
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
          const entry = self.get(args.key as string);
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
            type: args.type as any,
            tags: args.tags as string[],
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
          const history = self.history(args.key as string);
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
          const entry = self.getById(args.id as string);
          if (!entry) return { success: false, error: 'Entry not found' };
          
          switch (args.action) {
            case 'archive':
              return { success: self.archive(args.id as string) };
            case 'delete':
              return { success: self.delete(args.id as string) };
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
  on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }
  
  off(event: string, listener: (...args: any[]) => void): void {
    this.events.off(event, listener);
  }
  
  // Private helpers
  private _logEntry(id: string, type: WorkspaceLogEntry['type'], content: string, agentId: string): void {
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
  
  private _archive(key: string, entry: WorkspaceEntry): void {
    if (!this.archives.has(key)) {
      this.archives.set(key, []);
    }
    this.archives.get(key)!.push(entry);
  }
}
