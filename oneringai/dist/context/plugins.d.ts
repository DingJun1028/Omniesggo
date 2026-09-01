/**
 * Memory Plugin NextGen - Integrates MemorySystem into Agent Context
 *
 * 6 read tools: memory_recall, memory_graph, memory_search,
 * memory_search_documents, memory_find_entity, memory_list_facts
 */
import type { MemorySystem, SubjectRef } from '../memory/system.js';
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
        identifiers: {
            kind: string;
            value: string;
        }[];
    };
}
export declare class MemoryPluginNextGen {
    private config;
    constructor(config: MemoryPluginConfig);
    /**
     * Inject user profile into system message
     */
    injectProfile(userId: string, principal: string): Promise<string>;
    /**
     * Get all read tools
     */
    getReadTools(): ToolFunction[];
    /**
     * Get all write tools
     */
    getWriteTools(): ToolFunction[];
    private memory_recall;
    private memory_graph;
    private memory_search;
    private memory_search_documents;
    private memory_find_entity;
    private memory_list_facts;
    private memory_remember;
    private memory_link;
    private memory_upsert_entity;
    private memory_forget;
    private memory_restore;
    private memory_set_agent_rule;
    private _resolveSubject;
}
export interface WorkingMemoryEntry {
    key: string;
    value: unknown;
    priority: 'raw' | 'summary' | 'findings';
    createdAt: number;
    expiresAt?: number;
    tags: string[];
}
export declare class WorkingMemoryPluginNextGen {
    private storage;
    private readonly maxSize;
    store(key: string, value: unknown, priority?: 'raw' | 'summary' | 'findings'): Promise<WorkingMemoryEntry>;
    retrieve(key: string): Promise<unknown>;
    delete(key: string): Promise<boolean>;
    list(): Promise<WorkingMemoryEntry[]>;
    getTools(): ToolFunction[];
    private _getPluginForStore;
}
export interface InContextMemoryEntry {
    key: string;
    description: string;
    value: unknown;
    priority: 'high' | 'normal' | 'low';
    showInUI: boolean;
    createdAt: number;
}
export declare class InContextMemoryPluginNextGen {
    private storage;
    private readonly maxEntries;
    set(key: string, description: string, value: unknown, priority?: 'high' | 'normal' | 'low', showInUI?: boolean): InContextMemoryEntry;
    get(key: string): InContextMemoryEntry | undefined;
    delete(key: string): boolean;
    list(): InContextMemoryEntry[];
    /**
     * Get entries as context string for LLM
     */
    getAsContext(): string;
    private _priorityScore;
}
export declare class PersistentInstructionsPluginNextGen {
    private instructions;
    set(key: string, content: string): void;
    delete(key: string): boolean;
    clear(): void;
    list(): Array<{
        key: string;
        content: string;
    }>;
    getAsContext(): string;
}
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
export declare class UserInfoPluginNextGen {
    private userInfo;
    private todos;
    setInfo(key: string, value: string, description?: string): UserInfoEntry;
    getInfo(key?: string): UserInfoEntry | UserInfoEntry[];
    deleteInfo(key: string): boolean;
    clearInfo(): void;
    getAsContext(): string;
    addTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Todo;
    updateTodo(id: string, updates: Partial<Todo>): Todo | null;
    removeTodo(id: string): boolean;
    listTodos(options?: {
        status?: string;
        tags?: string[];
    }): Todo[];
    getTodosContext(): string;
    getTools(): ToolFunction[];
}
export declare class ToolCatalogPluginNextGen {
    private pinnedCategories;
    private autoLoadCategories;
    private availableCategories;
    setPinned(categories: string[]): void;
    setAutoLoad(categories: string[]): void;
    registerCategory(name: string, toolNames: string[]): void;
    getAvailableCategories(): string[];
    getPinnedCategories(): string[];
    getAutoLoadCategories(): string[];
    isPinned(category: string): boolean;
    isLoaded(category: string): boolean;
    getToolsForCategory(category: string): string[];
    getInstructions(): string;
    getTools(): ToolFunction[];
}
export { SubjectRef };
//# sourceMappingURL=plugins.d.ts.map