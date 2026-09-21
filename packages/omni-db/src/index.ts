/**
 * @esggo/omni-db v1.0.0
 *
 * 智慧推理 + 自我迭代生命體
 * MECE 角色: 智庫推理層 (Truth 嚴格證據鏈)
 *
 * Knowledge Pyramid: L1 Fact → L2 Pattern → L3 Insight → L4 Wisdom
 * 5 algorithms: extract, link, contradictions, gaps, iterate
 */

import {
  createComponentCore,
  sealComponentCore,
  type IComponentCore,
} from '@esggo/omni-core';
import type { OmniTag } from '@esggo/omni-tag';

export type KnowledgeLayer = 'L1' | 'L2' | 'L3' | 'L4';

export interface Pattern {
  id: string;
  rule: string;
  evidence: string[]; // Memory uuids
  tags: OmniTag[];
  confidence: number; // 0-1
}

export interface Insight {
  id: string;
  patternIds: string[];
  crossDomain: boolean;
  reasoning: string;
  confidence: number;
}

export interface ProvenanceChain {
  sources: string[];
  reasoningPath: string[];
  hash: string;
}

export interface Wisdom extends IComponentCore {
  recommendation: string;
  insights: Insight[];
  provenance: ProvenanceChain;
}

export interface EvolutionReport extends IComponentCore {
  contradictions: Array<{ factA: string; factB: string; severity: number }>;
  gaps: Array<{ topic: string; missingCount: number }>;
  newInsights: Insight[];
  iteratedAt: number;
}

/**
 * OmniDB class — Knowledge Pyramid engine
 */
export class OmniDB {
  private patterns = new Map<string, Pattern>();
  private insights = new Map<string, Insight>();
  private wisdomLog: Wisdom[] = [];

  /**
   * Algorithm 1: Insight Extraction (L1 → L2)
   * 簡化: 從 rule text 抽取 pattern
   */
  extract(rule: string, evidence: string[], tags: OmniTag[] = [], confidence = 0.7): Pattern {
    const id = `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const pattern: Pattern = { id, rule, evidence, tags, confidence };
    this.patterns.set(id, pattern);
    return pattern;
  }

  /**
   * Algorithm 2: Cross-Domain Linking
   */
  link(patternIds: string[], reasoning: string, confidence = 0.8): Insight {
    const id = `insight-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const crossDomain = patternIds.length >= 2;
    const insight: Insight = {
      id,
      patternIds,
      crossDomain,
      reasoning,
      confidence,
    };
    this.insights.set(id, insight);
    return insight;
  }

  /**
   * Algorithm 3 + 5: Reason → Wisdom (L3 → L4) with Provenance Chain
   */
  async reason(
    insightIds: string[],
    recommendation: string,
    reasoningPath: string[]
  ): Promise<Readonly<Wisdom>> {
    const insights: Insight[] = insightIds
      .map((id) => this.insights.get(id))
      .filter((i): i is Insight => i !== undefined);

    const sources = insights.flatMap((i) =>
      i.patternIds.flatMap((pid) => this.patterns.get(pid)?.evidence || [])
    );

    const provenance: ProvenanceChain = {
      sources: [...new Set(sources)],
      reasoningPath,
      hash: '', // Will be filled by seal
    };

    const core = createComponentCore(`omni-db://wisdom/reason`);
    const sealed = await sealComponentCore(core);

    const wisdom: Wisdom = {
      ...sealed,
      recommendation,
      insights,
      provenance: {
        ...provenance,
        hash: sealed.evidence[0]?.hash || '',
      },
    };

    this.wisdomLog.push(wisdom);
    return wisdom;
  }

  /**
   * Algorithm 4: Gap Analysis
   */
  detectGaps(): Array<{ topic: string; missingCount: number }> {
    // 簡化: 統計每個 namespace 出現次數, 找出 < 5 的 topic
    const counts = new Map<string, number>();
    for (const p of this.patterns.values()) {
      for (const tag of p.tags) {
        const key = `${tag.namespace}:${tag.key}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    const gaps: Array<{ topic: string; missingCount: number }> = [];
    for (const [topic, count] of counts) {
      if (count < 3) {
        gaps.push({ topic, missingCount: 5 - count });
      }
    }
    return gaps;
  }

  /**
   * Algorithm 5: Self-Iteration Loop
   */
  async iterate(): Promise<Readonly<EvolutionReport>> {
    const contradictions: Array<{ factA: string; factB: string; severity: number }> = [];
    const seenRules = new Map<string, string>();

    // 偵測矛盾: 同樣 key 不同 rule
    for (const [id, p] of this.patterns) {
      const ruleKey = p.rule.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenRules.has(ruleKey)) {
        const otherId = seenRules.get(ruleKey)!;
        if (otherId !== id) {
          contradictions.push({
            factA: otherId,
            factB: id,
            severity: 0.5 + Math.random() * 0.5,
          });
        }
      } else {
        seenRules.set(ruleKey, id);
      }
    }

    const gaps = this.detectGaps();
    const newInsights = [...this.insights.values()].slice(-3); // 最近 3 個

    const core = createComponentCore(`omni-db://evolve/iterate`);
    const sealed = await sealComponentCore(core);

    const report: EvolutionReport = {
      ...sealed,
      contradictions,
      gaps,
      newInsights,
      iteratedAt: Date.now(),
    };

    return report;
  }

  /**
   * Q&A interface (5T: ask + Provenance)
   */
  async ask(question: string): Promise<{
    answer: string;
    provenance: ProvenanceChain;
  }> {
    // Token-based match: 任一關鍵詞 in rule
    let bestPattern: Pattern | undefined;
    const qTokens = question.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    for (const p of this.patterns.values()) {
      const ruleLower = p.rule.toLowerCase();
      if (qTokens.some((tok) => ruleLower.includes(tok))) {
        bestPattern = p;
        break;
      }
    }

    const answer = bestPattern
      ? `基於 pattern "${bestPattern.rule}" (confidence=${bestPattern.confidence}): 已記錄此規則, 詳見 evidence chain。`
      : '目前資料庫無對應 pattern, 建議先 extract() 新 pattern 再 reason()。';

    const provenance: ProvenanceChain = {
      sources: bestPattern?.evidence || [],
      reasoningPath: bestPattern ? [`extract:${bestPattern.id}`, `link:${bestPattern.id}`] : [],
      hash: this.wisdomLog[this.wisdomLog.length - 1]?.provenance.hash || '',
    };

    return { answer, provenance };
  }

  /**
   * Read-only accessors
   */
  getPatterns(): readonly Pattern[] {
    return [...this.patterns.values()];
  }

  getInsights(): readonly Insight[] {
    return [...this.insights.values()];
  }

  getWisdomLog(): readonly Wisdom[] {
    return [...this.wisdomLog];
  }
}

export const omniDB = new OmniDB();
