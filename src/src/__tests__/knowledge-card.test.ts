/**
 * src/__tests__/knowledge-card.test.ts — Knowledge Card Service 單元測試
 */

import { KnowledgeCardService, createKnowledgeCard, verifyKnowledgeCard } from '@/lib/knowledge-card';

describe('KnowledgeCardService', () => {
  beforeEach(() => {
    // Clear any existing cards
    (KnowledgeCardService as unknown as { _cards: Map<string, unknown> })._cards.clear();
  });

  describe('createCard', () => {
    it('should create a knowledge card', () => {
      const card = KnowledgeCardService.createCard('C1', 'EVD-001', {
        type: 'receipt',
        fields: { vendor: '臺灣電力公司', category: '電費' },
      });

      expect(card.id).toBeDefined();
      expect(card.chapter).toBe('C1');
      expect(card.evidenceId).toBe('EVD-001');
      expect(card.why).toBeDefined();
      expect(card.what).toBeDefined();
      expect(card.how).toBeDefined();
      expect(card.hashLock).toBeDefined();
    });

    it('should generate unique card IDs', () => {
      const card1 = KnowledgeCardService.createCard('C1', 'EVD-001', {});
      const card2 = KnowledgeCardService.createCard('C1', 'EVD-002', {});

      expect(card1.id).not.toBe(card2.id);
    });
  });

  describe('verifyCard', () => {
    it('should verify a card with correct hash lock', () => {
      const card = KnowledgeCardService.createCard('C1', 'EVD-001', {});
      const verified = KnowledgeCardService.verifyCard(card.id, card.hashLock);

      expect(verified).toBe(true);
    });

    it('should fail verification with wrong hash lock', () => {
      const card = KnowledgeCardService.createCard('C1', 'EVD-001', {});
      const verified = KnowledgeCardService.verifyCard(card.id, 'wrong-hash');

      expect(verified).toBe(false);
    });
  });

  describe('getCardsByChapter', () => {
    it('should return cards for a specific chapter', () => {
      KnowledgeCardService.createCard('C1', 'EVD-001', {});
      KnowledgeCardService.createCard('C1', 'EVD-002', {});
      KnowledgeCardService.createCard('C2', 'EVD-003', {});

      const c1Cards = KnowledgeCardService.getCardsByChapter('C1');
      expect(c1Cards.length).toBe(2);
    });
  });

  describe('generateContent', () => {
    it('should generate Why/What/How content', () => {
      const content = KnowledgeCardService.generateContent('C5', {
        type: 'receipt',
        fields: { vendor: '臺灣電力公司', category: '電費', amount: '125,000' },
      });

      expect(content.why).toContain('能源');
      expect(content.what).toContain('電費');
      expect(content.how).toBeDefined();
    });
  });

  describe('convenience functions', () => {
    it('createKnowledgeCard should work', () => {
      const card = createKnowledgeCard('C1', 'EVD-001', {});
      expect(card.id).toBeDefined();
    });

    it('verifyKnowledgeCard should work', () => {
      const card = createKnowledgeCard('C1', 'EVD-001', {});
      const verified = verifyKnowledgeCard(card.id, card.hashLock);
      expect(verified).toBe(true);
    });
  });
});
