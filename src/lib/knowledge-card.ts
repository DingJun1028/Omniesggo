// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * src/lib/knowledge-card.ts — Why/What/How 知識小卡服務
 */

import { createHash } from 'crypto';
import { FiveTHashLock } from './five-t-protocol';

// ── Types ─────────────────────────────────────────────────────

export interface KnowledgeCard {
  id: string;
  chapter: string;
  evidenceId: string;
  why: string;
  what: string;
  how: string;
  tags: string[];
  hashLock: string;
  createdAt: number;
  verified: boolean;
}

export interface CardTemplate {
  chapter: string;
  whyPrefix: string;
  whatPrefix: string;
  howPrefix: string;
  defaultTags: string[];
}

// ── Templates ─────────────────────────────────────────────────

const CARD_TEMPLATES: Record<string, CardTemplate> = {
  'C1': {
    chapter: 'C1',
    whyPrefix: '揭露公司治理架構，',
    whatPrefix: '包含董事會組成、',
    howPrefix: '透過公司年報及治理報告',
    defaultTags: ['治理', '董事會', 'GRI 205'],
  },
  'C2': {
    chapter: 'C2',
    whyPrefix: '識別利害關係人關注議題，',
    whatPrefix: '涵蓋環境、社會、',
    howPrefix: '依據 GRI 準則及永續報告',
    defaultTags: ['利害關係人', 'GRI 201'],
  },
  'C5': {
    chapter: 'C5',
    whyPrefix: '回應氣候變遷風險，強化能源韌性，',
    whatPrefix: '包含能源使用、',
    howPrefix: '依據 TCFD 建議框架',
    defaultTags: ['能源', '碳排放', 'TCFD', 'GRI 302'],
  },
  'C8': {
    chapter: 'C8',
    whyPrefix: '強化供應鏈管理，',
    whatPrefix: '涵蓋供應商評估、',
    howPrefix: '建立供應商行為準則',
    defaultTags: ['供應鏈', 'GRI 308'],
  },
};

// ── Knowledge Card Service ────────────────────────────────────

export class KnowledgeCardService {
  private static _cards: Map<string, KnowledgeCard> = new Map();

  /**
   * 生成知識小卡 ID
   */
  static generateCardId(chapter: string, evidenceId: string): string {
    const ts = Date.now();
    const data = `${chapter}:${evidenceId}:${ts}`;
    const hash = createHash('sha256').update(data).digest('hex').substring(0, 8);
    return `KCard-${chapter}-${hash}`;
  }

  /**
   * 生成 Why/What/How 內容
   */
  static generateContent(
    chapter: string,
    evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    [key: string]: unknown;
      type?: string;
      fields?: Record<string, string>;
      tags?: string[];
     }
  ): { why: string; what: string; how: string } {
    const template = CARD_TEMPLATES[chapter] || {
      whyPrefix: '揭露永續資訊，',
      whatPrefix: '包含環境、社會、',
      howPrefix: '依據 GRI 準則',
      defaultTags: [],
    };

    const vendor = evidence.fields?.vendor || '';
    const category = evidence.fields?.category || '';
    const amount = evidence.fields?.amount || '';

    const why = `${template.whyPrefix}以提升資訊透明度${vendor ? '，' + vendor + '提供相關單據佐證' : ''}。`;
    const what = `${template.whatPrefix}${category ? category + '等數據' : '各項指標'}${amount ? '（金額：' + amount + '元）' : ''}。`;
    const how = `${template.howPrefix}，結合內部數據收集與外部認證機制。`;

    return { why, what, how };
  }

  /**
   * 建立知識小卡
   */
  static createCard(
    chapter: string,
    evidenceId: string,
    evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    [key: string]: unknown;
      type?: string;
      fields?: Record<string, string>;
      tags?: string[];
     }
  ): KnowledgeCard {
    const cardId = this.generateCardId(chapter, evidenceId);
    const { why, what, how } = this.generateContent(chapter, evidence);
    const template = CARD_TEMPLATES[chapter] || { defaultTags: [] };
    
    const tags = [
      ...template.defaultTags,
      ...(evidence.tags || []),
    ];

    const hashLock = FiveTHashLock.generate(chapter, evidenceId, Date.now());

    const card: KnowledgeCard = {
      id: cardId,
      chapter,
      evidenceId,
      why,
      what,
      how,
      tags,
      hashLock,
      createdAt: Date.now(),
      verified: false,
    };

    this._cards.set(cardId, card);
    return card;
  }

  /**
   * 驗證知識小卡
   */
  static verifyCard(cardId: string, hashLock: string): boolean {
    const card = this._cards.get(cardId);
    if (!card) return false;

    if (card.hashLock === hashLock) {
      card.verified = true;
      this._cards.set(cardId, card);
      return true;
    }

    return false;
  }

  /**
   * 取得知識小卡
   */
  static getCard(cardId: string): KnowledgeCard | undefined {
    return this._cards.get(cardId);
  }

  /**
   * 取得章節的所有知識小卡
   */
  static getCardsByChapter(chapter: string): KnowledgeCard[] {
    return Array.from(this._cards.values()).filter(
      c => c.chapter === chapter
    );
  }

  /**
   * 取得所有已驗證的小卡
   */
  static getVerifiedCards(): KnowledgeCard[] {
    return Array.from(this._cards.values()).filter(c => c.verified);
  }
}

// ── Convenience Functions ─────────────────────────────────────

/**
 * 快速建立知識小卡
 */
export function createKnowledgeCard(
  chapter: string,
  evidenceId: string,
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    [key: string]: unknown;
    type?: string;
    fields?: Record<string, string>;
    tags?: string[];
   }
): KnowledgeCard {
  return KnowledgeCardService.createCard(chapter, evidenceId, evidence);
}

/**
 * 快速驗證知識小卡
 */
export function verifyKnowledgeCard(cardId: string, hashLock: string): boolean {
  return KnowledgeCardService.verifyCard(cardId, hashLock);
}
