/**
 * Agent Registry - Global tracking of all active agents
 *
 * Provides deep inspection, parent/child hierarchy, event fan-in,
 * and external control capabilities.
 */
import { EventEmitter } from 'events';
/**
 * Global Agent Registry
 * All Agent instances automatically register on creation and unregister on destroy.
 */
export class AgentRegistry {
    static registry = new Map();
    static records = new Map();
    static eventSource = new EventEmitter();
    static stats = { totalToolCalls: 0, totalTokens: { input: 0, output: 0 } };
    static register(agent, registryId, name) {
        this.registry.set(registryId, agent);
        this.records.set(registryId, {
            id: agent.userId || 'unknown',
            name,
            registryId,
            status: 'idle',
            model: agent.model,
            connector: typeof agent.connector === 'string' ? agent.connector : agent.connector?.name || 'unknown',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            childIds: [],
        });
        this.eventSource.emit('agent:registered', { registryId, name });
    }
    static unregister(registryId) {
        const agent = this.registry.get(registryId);
        if (!agent)
            return false;
        const record = this.records.get(registryId);
        if (record) {
            record.status = 'destroyed';
        }
        this.registry.delete(registryId);
        this.records.delete(registryId);
        this.eventSource.emit('agent:unregistered', { registryId });
        return true;
    }
    static get(registryId) {
        return this.registry.get(registryId);
    }
    static getByName(name) {
        return Array.from(this.registry.values()).filter((_, id) => {
            const record = this.records.get(id);
            return record && record.name === name;
        });
    }
    static getAll() {
        return this.registry;
    }
    static get count() {
        return this.registry.size;
    }
    static filter(criteria) {
        return Array.from(this.registry.entries()).filter(([id, agent]) => {
            const record = this.records.get(id);
            if (!record)
                return false;
            for (const [key, value] of Object.entries(criteria)) {
                if (record[key] !== value)
                    return false;
            }
            return true;
        }).map(([, agent]) => agent);
    }
    static getStats() {
        const byStatus = {};
        const byModel = {};
        const byConnector = {};
        for (const record of this.records.values()) {
            byStatus[record.status] = (byStatus[record.status] || 0) + 1;
            byModel[record.model] = (byModel[record.model] || 0) + 1;
            byConnector[record.connector] = (byConnector[record.connector] || 0) + 1;
        }
        return {
            total: this.registry.size,
            byStatus,
            byModel,
            byConnector,
            totalToolCalls: this.stats.totalToolCalls,
            totalTokens: this.stats.totalTokens.input + this.stats.totalTokens.output,
        };
    }
    static async inspect(registryId) {
        const agent = this.registry.get(registryId);
        if (!agent)
            return null;
        const record = this.records.get(registryId);
        return {
            agentId: record?.id || 'unknown',
            registryId,
            name: record?.name,
            status: record?.status || 'unknown',
            model: agent.model,
            connector: typeof agent.connector === 'string' ? agent.connector : agent.connector?.name || 'unknown',
            context: {
                plugins: {},
                tools: agent.tools.list().map(t => ({
                    id: t.id,
                    name: t.definition.function.name,
                    callCount: 0,
                    enabled: agent.tools.listEnabled().includes(t.id),
                })),
            },
            conversation: [],
            children: record?.childIds || [],
        };
    }
    // Parent/Child hierarchy
    static setParent(childId, parentId) {
        const childRecord = this.records.get(childId);
        const parentRecord = this.records.get(parentId);
        if (childRecord && parentRecord) {
            childRecord.parentAgentId = parentId;
            parentRecord.childIds.push(childId);
        }
    }
    static getChildren(parentId) {
        const parent = this.records.get(parentId);
        if (!parent)
            return [];
        return parent.childIds
            .map(id => this.registry.get(id))
            .filter(Boolean);
    }
    static getTree(parentId) {
        const agent = this.registry.get(parentId);
        if (!agent)
            return null;
        const children = this.getChildren(parentId);
        return {
            agent,
            children: children.map(child => {
                // We'd need child registry IDs - for now return simplified
                return { agent: child, children: [] };
            }),
        };
    }
    // Event fan-in
    static onAgentEvent(handler) {
        this.eventSource.on('agent:event', handler);
    }
    static emitAgentEvent(agentId, name, event, data) {
        this.eventSource.emit('agent:event', agentId, name, event, data);
    }
    // External control
    static pauseAgent(registryId) {
        const record = this.records.get(registryId);
        if (record) {
            record.status = 'paused';
            this.eventSource.emit('agent:paused', { registryId });
        }
    }
    static resumeAgent(registryId) {
        const record = this.records.get(registryId);
        if (record) {
            record.status = 'idle';
            this.eventSource.emit('agent:resumed', { registryId });
        }
    }
    static cancelAll(reason) {
        for (const [id, agent] of this.registry) {
            agent.destroy();
            this.unregister(id);
        }
        this.eventSource.emit('agents:cancelled', { reason });
    }
    static destroyMatching(criteria) {
        const agents = this.filter(criteria);
        for (const agent of agents) {
            agent.destroy();
            // Find and unregister
            for (const [id, a] of this.registry) {
                if (a === agent) {
                    this.unregister(id);
                    break;
                }
            }
        }
    }
    // Update stats
    static _updateStats(tokens) {
        this.stats.totalToolCalls++;
        this.stats.totalTokens.input += tokens.input;
        this.stats.totalTokens.output += tokens.output;
    }
    // Update status
    static _updateStatus(registryId, status) {
        const record = this.records.get(registryId);
        if (record) {
            record.status = status;
            record.lastActivity = Date.now();
        }
    }
}
//# sourceMappingURL=registry.js.map