 
/**
 * ==========================================
 * 🌌 OmniTag — 萬能標籤實現
 * ==========================================
 * Semantic tagging, classification, and knowledge graph edges.
 */

import { randomUUID } from 'crypto';
import {
  IOmniTag,
  TagId,
  TagDefinition,
  TagFilter,
  TagGraph,
  TagStatistics,
} from '../../types/twelve-omni';

/**
 * OmniTag 實現
 * 語義化標記和知識圖譜邊
 */
export class OmniTag implements IOmniTag {
  readonly uuid: string;
  readonly version: string = '1.0.0';
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  /** 標籤存儲 */
  private tags: Map<TagId, TagDefinition> = new Map();

  /** 標籤關聯圖 */
  private associations: Map<string, Array<{ targetId: string; relation: string }>> = new Map();

  constructor() {
    this.uuid = randomUUID();
    this.timestamp = Date.now();
  }

  /**
   * 創建標籤
   */
  async create(tag: Omit<TagDefinition, 'id' | 'createdAt'>): Promise<TagId> {
    const id = `TAG-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    const fullTag: TagDefinition = {
      ...tag,
      id,
      createdAt: Date.now(),
    };

    this.tags.set(id, fullTag);
    return id;
  }

  /**
   * 查詢標籤
   */
  async query(filter: TagFilter): Promise<TagDefinition[]> {
    let results = Array.from(this.tags.values());

    if (filter.namespace) {
      results = results.filter((t) => t.namespace === filter.namespace);
    }

    if (filter.namePattern) {
      const pattern = new RegExp(filter.namePattern, 'i');
      results = results.filter(
        (t) => pattern.test(t.name) || (filter.aliases && t.aliases.some((a) => pattern.test(a)))
      );
    }

    return results.slice(0, filter.limit || 100);
  }

  /**
   * 標籤關聯
   */
  async associate(
    tagId: TagId,
    targetId: string,
    targetType: string,
    relation: string
  ): Promise<void> {
    const key = `${tagId}:${targetType}`;
    const existing = this.associations.get(key) || [];
    existing.push({ targetId, relation });
    this.associations.set(key, existing);
  }

  /**
   * 標籤圖譜
   */
  async graph(tagId: TagId, depth: number = 2): Promise<TagGraph> {
    const visited = new Set<string>();
    const nodes: TagGraph['nodes'] = [];
    const edges: TagGraph['edges'] = [];

    const traverse = (currentId: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(currentId)) return;
      visited.add(currentId);

      const tag = this.tags.get(currentId);
      if (tag) {
        nodes.push({
          id: tag.id,
          name: tag.name,
          namespace: tag.namespace,
        });

        // 查找關聯
        for (const [key, targets] of Array.from(this.associations.entries())) {
          if (key.startsWith(currentId)) {
            for (const target of targets) {
              if (!visited.has(target.targetId)) {
                edges.push({
                  from: currentId,
                  to: target.targetId,
                  relation: target.relation,
                  weight: 1,
                });
                traverse(target.targetId, currentDepth + 1);
              }
            }
          }
        }
      }
    };

    traverse(tagId, 0);
    return { nodes, edges };
  }

  /**
   * 反向查詢
   */
  async reverseLookup(targetId: string, _targetType: string): Promise<TagDefinition[]> {
    const results: TagDefinition[] = [];

    for (const [key, targets] of Array.from(this.associations.entries())) {
      if (targets.some((t) => t.targetId === targetId)) {
        const tagId = key.split(':')[0];
        const tag = this.tags.get(tagId);
        if (tag) {
          results.push(tag);
        }
      }
    }

    return results;
  }

  /**
   * 標籤統計
   */
  async statistics(): Promise<TagStatistics> {
    const namespaces: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    for (const tag of Array.from(this.tags.values())) {
      namespaces[tag.namespace] = (namespaces[tag.namespace] || 0) + 1;
      tagCounts[tag.id] = (tagCounts[tag.id] || 0) + 1;
    }

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => ({
        tagId: id,
        name: this.tags.get(id)?.name || '',
        count,
      }));

    return {
      totalTags: this.tags.size,
      namespaces,
      topTags,
    };
  }
}

/**
 * OmniTag 單例工廠
 */
let _instance: OmniTag | null = null;

export function getOmniTag(): OmniTag {
  if (!_instance) {
    _instance = new OmniTag();
  }
  return _instance;
}
