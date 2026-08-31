 
/**
 * ==========================================
 * 🌌 OmniUserRegistry — 用戶成長資料庫
 * ==========================================
 * 
 * 同心圓設計：以用戶需求為中心，系統滿足成果。
 * 
 * 用戶互動 → 知識沉澱 → 系統成長 → 更好地滿足用戶
 * 
 * 功能：
 * 1. 用戶偏好學習：從互動中提取偏好模式
 * 2. 知識圖譜構建：自動建立概念關聯
 * 3. RAG 增強檢索：基於用戶歷史的語義搜索
 * 4. 成長指標追蹤：量化系統的學習進度
 * 5. 記憶鞏固：定期將短期記憶轉化為長期知識
 */

import { randomUUID } from 'crypto';
import { IOmniMemory, MemoryEntry } from '../types/twelve-omni';
import { getOmniMemory } from './twelve-omni/omni-memory';

// ==========================================
// 用戶模型類型
// ==========================================

/** 用戶偏好 */
export interface UserPreference {
  /** 偏好類別 */
  category: 'language' | 'style' | 'topic' | 'time' | 'interaction';
  /** 偏好鍵 */
  key: string;
  /** 偏好值 */
  value: string;
  /** 信心度 (0-1) */
  confidence: number;
  /** 觀察次數 */
  observations: number;
  /** 最後觀察時間 */
  lastObserved: number;
}

/** 用戶互動記錄 */
export interface UserInteraction {
  /** 互動 ID */
  id: string;
  /** 用戶 ID */
  userId: string;
  /** 互動類型 */
  type: 'query' | 'command' | 'feedback' | 'implicit';
  /** 內容 */
  content: string;
  /** 時間戳 */
  timestamp: number;
  /** 情感傾向 (可選) */
  sentiment?: number;
  /** 提取的偏好 */
  extractedPreferences: UserPreference[];
}

/** 知識節點 */
export interface KnowledgeNode {
  /** 節點 ID */
  id: string;
  /** 概念名稱 */
  concept: string;
  /** 節點類型 */
  type: 'entity' | 'action' | 'attribute' | 'relation';
  /** 關聯邊 */
  edges: KnowledgeEdge[];
  /** 重要度 (0-1) */
  importance: number;
  /** 創建時間 */
  createdAt: number;
  /** 最後訪問 */
  lastAccessed: number;
}

/** 知識邊 */
export interface KnowledgeEdge {
  /** 目標節點 ID */
  targetId: string;
  /** 關係類型 */
  relation: 'is_a' | 'has' | 'does' | 'related_to' | 'part_of';
  /** 權重 (0-1) */
  weight: number;
}

/** 成長指標 */
export interface GrowthMetrics {
  /** 總互動次數 */
  totalInteractions: number;
  /** 獨特用戶數 */
  uniqueUsers: number;
  /** 知識節點數 */
  knowledgeNodes: number;
  /** 用戶偏好數 */
  preferencesLearned: number;
  /** 平均信心度 */
  averageConfidence: number;
  /** 成長率 (每小時) */
  growthRate: number;
  /** 上次更新 */
  lastUpdated: number;
}

// ==========================================
// OmniUserRegistry 實現
// ==========================================

export class OmniUserRegistry {
  readonly uuid: string;
  readonly version: string = '1.0.0';
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  /** 用戶偏好表 (userId → preferences) */
  private _preferences: Map<string, UserPreference[]> = new Map();

  /** 互動歷史 */
  private _interactions: UserInteraction[] = [];

  /** 知識圖譜 */
  private _knowledgeGraph: Map<string, KnowledgeNode> = new Map();

  /** 記憶體引用 */
  private _memory: IOmniMemory;

  /** 成長指標 */
  private _metrics: GrowthMetrics;

  constructor() {
    this.uuid = randomUUID();
    this.timestamp = Date.now();
    this._memory = getOmniMemory();
    this._metrics = {
      totalInteractions: 0,
      uniqueUsers: 0,
      knowledgeNodes: 0,
      preferencesLearned: 0,
      averageConfidence: 0,
      growthRate: 0,
      lastUpdated: Date.now(),
    };
  }

  // ==========================================
  // 用戶互動處理
  // ==========================================

  /**
   * 記錄用戶互動
   * 
   * 同心圓效果：
   * 用戶互動 → 提取偏好 → 知識沉澱 → 更好地服務用戶
   */
  async recordInteraction(interaction: Omit<UserInteraction, 'id' | 'extractedPreferences'>): Promise<string> {
    const id = `INT-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    // 提取偏好
    const preferences = this._extractPreferences(interaction);

    const fullInteraction: UserInteraction = {
      ...interaction,
      id,
      extractedPreferences: preferences,
    };

    this._interactions.push(fullInteraction);

    // 更新用戶偏好
    this._updateUserPreferences(interaction.userId, preferences);

    // 構建知識圖譜
    this._buildKnowledge(interaction.content);

    // 更新指標
    this._metrics.totalInteractions++;
    this._metrics.preferencesLearned += preferences.length;
    this._updateMetrics();

    // 存入記憶體
    await this._memory.store({
      id: `MEM-USER-${id}`,
      content: `[User ${interaction.userId}] ${interaction.type}: ${interaction.content}`,
      metadata: {
        source: 'user-interaction',
        confidence: 0.8,
        domain: 'user',
        relatedIds: [],
      },
      createdAt: Date.now(),
      accessCount: 0,
      decayFactor: 1,
      tags: ['user', interaction.type, interaction.userId],
      parentIds: [],
      hash: '',
    });

    return id;
  }

  /**
   * 提取用戶偏好
   * 
   * 從互動內容中識別偏好模式
   */
  private _extractPreferences(interaction: Omit<UserInteraction, 'id' | 'extractedPreferences'>): UserPreference[] {
    const preferences: UserPreference[] = [];
    const content = interaction.content.toLowerCase();

    // 語言偏好檢測
    const languagePatterns: Record<string, string[]> = {
      'zh-TW': ['繁體', '中文', '臺灣', '你好'],
      'en': ['hello', 'help', 'please', 'thanks'],
      'ja': ['こんにちは', 'ありがとう', 'すみません'],
    };

    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      if (patterns.some(p => content.includes(p))) {
        preferences.push({
          category: 'language',
          key: 'preferred_language',
          value: lang,
          confidence: 0.7,
          observations: 1,
          lastObserved: Date.now(),
        });
      }
    }

    // 互動風格檢測
    if (content.includes('謝謝') || content.includes('thank')) {
      preferences.push({
        category: 'style',
        key: 'politeness_level',
        value: 'high',
        confidence: 0.6,
        observations: 1,
        lastObserved: Date.now(),
      });
    }

    // 詢問模式檢測
    if (content.includes('?') || content.includes('？') || content.includes('如何') || content.includes('how')) {
      preferences.push({
        category: 'interaction',
        key: 'query_style',
        value: 'detailed',
        confidence: 0.5,
        observations: 1,
        lastObserved: Date.now(),
      });
    }

    return preferences;
  }

  /**
   * 更新用戶偏好
   */
  private _updateUserPreferences(userId: string, newPreferences: UserPreference[]): void {
    const existing = this._preferences.get(userId) || [];

    for (const pref of newPreferences) {
      const found = existing.find(
        e => e.category === pref.category && e.key === pref.key
      );

      if (found) {
        // 已存在，更新信心度
        found.observations++;
        found.confidence = Math.min(1, found.confidence + 0.1);
        found.lastObserved = Date.now();
        if (pref.value !== found.value) {
          // 偏好變化，降低信心度
          found.confidence = Math.max(0.3, found.confidence - 0.2);
        }
      } else {
        existing.push(pref);
      }
    }

    this._preferences.set(userId, existing);
  }

  // ==========================================
  // 知識圖譜構建
  // ==========================================

  /**
   * 從內容構建知識圖譜
   */
  private _buildKnowledge(content: string): void {
    // 簡單的實體提取（生產環境應使用 NLP）
    const words = content.split(/\s+/);

    for (const word of words) {
      if (word.length < 2) continue;

      const concept = word.toLowerCase();

      // 查找或創建節點
      let node = Array.from(this._knowledgeGraph.values()).find(
        n => n.concept === concept
      );

      if (!node) {
        node = {
          id: `KN-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`,
          concept,
          type: 'entity',
          edges: [],
          importance: 0.1,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
        };
        this._knowledgeGraph.set(node.id, node);
      }

      // 更新重要度
      node.importance = Math.min(1, node.importance + 0.01);
      node.lastAccessed = Date.now();
    }

    // 建立詞間關聯
    const uniqueWords = Array.from(new Set(words.filter(w => w.length >= 2)));
    for (let i = 0; i < uniqueWords.length - 1; i++) {
      const sourceConcept = uniqueWords[i].toLowerCase();
      const targetConcept = uniqueWords[i + 1].toLowerCase();

      const sourceNode = Array.from(this._knowledgeGraph.values()).find(
        n => n.concept === sourceConcept
      );
      const targetNode = Array.from(this._knowledgeGraph.values()).find(
        n => n.concept === targetConcept
      );

      if (sourceNode && targetNode) {
        const existingEdge = sourceNode.edges.find(e => e.targetId === targetNode.id);
        if (existingEdge) {
          existingEdge.weight = Math.min(1, existingEdge.weight + 0.1);
        } else {
          sourceNode.edges.push({
            targetId: targetNode.id,
            relation: 'related_to',
            weight: 0.1,
          });
        }
      }
    }
  }

  // ==========================================
  // RAG 增強檢索
  // ==========================================

  /**
   * 基於用戶歷史的增強檢索
   * 
   * 同心圓效果：
   * 用戶歷史 → 偏好加權 → 更精準的結果
   */
  async enhancedSearch(userId: string, query: string, limit: number = 10): Promise<MemoryEntry[]> {
    // 獲取基礎搜索結果
    const baseResults = await this._memory.search(query, limit * 2);

    // 獲取用戶偏好
    const userPrefs = this._preferences.get(userId) || [];

    // 加權排序
    const scored = baseResults.map(entry => {
      let score = 1.0;

      // 偏好匹配加分
      for (const pref of userPrefs) {
        if (entry.tags.includes(pref.value) || entry.content.includes(pref.value)) {
          score *= (1 + pref.confidence * 0.5);
        }
      }

      // 時間衰減
      const age = Date.now() - entry.createdAt;
      const decay = Math.exp(-age / (7 * 24 * 60 * 60 * 1000)); // 7天衰減
      score *= decay;

      // 訪問頻率
      score *= (1 + Math.log(entry.accessCount + 1) * 0.1);

      return { entry, score };
    });

    return scored
      .sort((a, b) => b.score - a.score || b.entry.createdAt - a.entry.createdAt || a.entry.id.localeCompare(b.entry.id))
      .slice(0, limit)
      .map(s => s.entry);
  }

  // ==========================================
  // 成長指標
  // ==========================================

  /**
   * 獲取成長指標
   */
  getMetrics(): GrowthMetrics {
    this._updateMetrics();
    return { ...this._metrics };
  }

  /**
   * 獲取用戶偏好
   */
  getUserPreferences(userId: string): UserPreference[] {
    return this._preferences.get(userId) || [];
  }

  /**
   * 獲取知識圖譜統計
   */
  getKnowledgeStats(): {
    totalNodes: number;
    totalEdges: number;
    topConcepts: Array<{ concept: string; importance: number }>;
  } {
    const nodes = Array.from(this._knowledgeGraph.values());
    const totalEdges = nodes.reduce((sum, n) => sum + n.edges.length, 0);

    const topConcepts = nodes
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20)
      .map(n => ({ concept: n.concept, importance: n.importance }));

    return {
      totalNodes: nodes.length,
      totalEdges,
      topConcepts,
    };
  }

  /**
   * 更新成長指標
   */
  private _updateMetrics(): void {
    this._metrics.uniqueUsers = this._preferences.size;
    this._metrics.knowledgeNodes = this._knowledgeGraph.size;
    this._metrics.lastUpdated = Date.now();

    // 計算平均信心度
    const allPrefs = Array.from(this._preferences.values()).flat();
    if (allPrefs.length > 0) {
      this._metrics.averageConfidence =
        allPrefs.reduce((sum, p) => sum + p.confidence, 0) / allPrefs.length;
    }

    // 計算成長率 (最近1小時 vs 之前)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentInteractions = this._interactions.filter(i => i.timestamp > oneHourAgo);
    this._metrics.growthRate = recentInteractions.length;
  }
}

// ==========================================
// 單例工廠
// ==========================================

let _instance: OmniUserRegistry | null = null;

export function getOmniUserRegistry(): OmniUserRegistry {
  if (!_instance) {
    _instance = new OmniUserRegistry();
  }
  return _instance;
}

export default OmniUserRegistry;
