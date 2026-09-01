/**
 * Shared Workspace Plugin for Agent Context
 */
import type { ToolFunction } from '../types/index.js';
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
export declare class SharedWorkspacePluginNextGen {
    private entries;
    private eventLog;
    private events;
    private readonly maxEntries;
    private archives;
    /**
     * Post a new entry to the workspace
     */
    post(entry: Omit<WorkspaceEntry, 'id' | 'createdAt' | 'updatedAt'>): WorkspaceEntry;
    /**
     * Get entry by key
     */
    get(key: string): WorkspaceEntry | undefined;
    /**
     * Get entry by ID
     */
    getById(id: string): WorkspaceEntry | undefined;
    /**
     * Update an existing entry
     */
    update(id: string, content: string): boolean;
    /**
     * Archive an entry
     */
    archive(id: string): boolean;
    /**
     * Delete an entry
     */
    delete(id: string): boolean;
    /**
     * List all entries
     */
    list(options?: {
        owner?: string;
        type?: string;
        tags?: string[];
    }): WorkspaceEntry[];
    /**
     * History for a specific key
     */
    history(key: string): WorkspaceEntry[];
    /**
     * Get event log
     */
    getEventLog(): WorkspaceLogEntry[];
    /**
     * Get tools for agent use
     */
    getTools(): ToolFunction[];
    on(event: string, listener: (...args: any[]) => void): void;
    off(event: string, listener: (...args: any[]) => void): void;
    private _logEntry;
    private _archive;
}
//# sourceMappingURL=workspace.d.ts.map