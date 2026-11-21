/**
 * @esggo/omni-tag v1.0.0
 *
 * OmniTag 標籤合約 — 6 維度 (team / 5t / priority / stage / agent / task)
 * + Routing rules (按 tag 路由到 30 蜂群代理)
 * + 互斥規則 (同 namespace 不同 value 不可同時)
 *
 * 5T 對應:
 * - Traceable: source_origin 標記 (Truth)
 * - Trackable: tag chain 可追蹤
 * - Transparent: parseOmniTag / formatOmniTag 公開
 * - Trustworthy: validateOmniTagRules 互斥檢查
 */

export type OmniTagNamespace =
  | 'team'
  | '5t'
  | 'priority'
  | 'stage'
  | 'agent'
  | 'task';

export interface OmniTag {
  namespace: OmniTagNamespace;
  key: string;
  value: string;
}

/**
 * 6 維度 values registry
 */
export const TEAM_VALUES = ['strategy', 'tech', 'creative', 'marketing', 'guard'] as const;
export const FIVET_VALUES = ['traceable', 'trackable', 'tangible', 'transparent', 'trustworthy'] as const;
export const PRIORITY_VALUES = ['critical', 'high', 'medium', 'low'] as const;
export const STAGE_VALUES = [
  '1-brainstorm',
  '2-worktree',
  '3-plan',
  '4-subagent',
  '5-tdd',
  '6-review',
  '7-5t-gate',
] as const;
export const TASK_VALUES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore'] as const;

/**
 * 解析 "namespace:key:value" 字串為 OmniTag
 */
export function parseOmniTag(raw: string): OmniTag | null {
  const parts = raw.split(':');
  if (parts.length !== 3) return null;
  const [namespace, key, value] = parts;
  const validNamespaces: OmniTagNamespace[] = ['team', '5t', 'priority', 'stage', 'agent', 'task'];
  if (!validNamespaces.includes(namespace as OmniTagNamespace)) return null;
  return { namespace: namespace as OmniTagNamespace, key, value };
}

/**
 * 格式化 OmniTag 為 "namespace:key:value"
 */
export function formatOmniTag(tag: OmniTag): string {
  return `${tag.namespace}:${tag.key}:${tag.value}`;
}

/**
 * 路由規則: OmniTag → 對應 30 蜂群代理範圍
 */
const ROUTING_MAP: Record<string, string> = {
  'team:strategy': 'agents-1-to-6',
  'team:tech': 'agents-7-to-12',
  'team:creative': 'agents-13-to-18',
  'team:marketing': 'agents-19-to-24',
  'team:guard': 'agents-25-to-30',
  'stage:5-tdd': 'agent-test-bee+agent-quality-control-bee',
  'stage:6-review': 'agent-quality-control-bee',
  'stage:7-5t-gate': 'agent-quality-control-bee',
};

export function routeOmniTag(tag: OmniTag): string {
  return ROUTING_MAP[`${tag.namespace}:${tag.key}`] || 'broadcast';
}

/**
 * 互斥規則: 同 namespace 不同 value 不可同時出現
 * 回傳衝突對 [tag1, tag2]
 */
export function validateOmniTagRules(tags: OmniTag[]): Array<[OmniTag, OmniTag]> {
  const conflicts: Array<[OmniTag, OmniTag]> = [];
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const a = tags[i];
      const b = tags[j];
      if (a.namespace === b.namespace && a.value !== b.value) {
        conflicts.push([a, b]);
      }
    }
  }
  return conflicts;
}

/**
 * 必填檢查: 至少 1 個 team tag + 1 個 5t tag
 */
export function validateRequired(tags: OmniTag[]): { hasTeam: boolean; hasFiveT: boolean } {
  return {
    hasTeam: tags.some((t) => t.namespace === 'team'),
    hasFiveT: tags.some((t) => t.namespace === '5t'),
  };
}
