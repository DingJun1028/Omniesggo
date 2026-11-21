// ═══════════════════════════════════════════════════════════════
// MECE Best Practices Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  getAllPractices,
  getPracticesByPillar,
  getPracticesByLevel,
  validateMECEExclusivity,
  calculateOverallScore,
  type PracticeAssessment,
} from '../best-practices';

describe('MECE Best Practices Framework', () => {
  describe('getAllPractices', () => {
    it('should have 30 total practices', () => {
      const practices = getAllPractices();
      expect(practices.length).toBe(30);
    });

    it('should have Environmental practices', () => {
      const ePractices = getPracticesByPillar('E');
      expect(ePractices.length).toBeGreaterThan(0);
      for (const p of ePractices) {
        expect(p.pillar).toBe('E');
      }
    });

    it('should have Social practices', () => {
      const sPractices = getPracticesByPillar('S');
      expect(sPractices.length).toBeGreaterThan(0);
      for (const p of sPractices) {
        expect(p.pillar).toBe('S');
      }
    });

    it('should have Governance practices', () => {
      const gPractices = getPracticesByPillar('G');
      expect(gPractices.length).toBeGreaterThan(0);
      for (const p of gPractices) {
        expect(p.pillar).toBe('G');
      }
    });

    it('pillar counts should sum to total', () => {
      const all = getAllPractices();
      const e = getPracticesByPillar('E');
      const s = getPracticesByPillar('S');
      const g = getPracticesByPillar('G');
      expect(e.length + s.length + g.length).toBe(all.length);
    });

    it('each practice should have required fields', () => {
      const practices = getAllPractices();
      for (const practice of practices) {
        expect(practice.id).toBeDefined();
        expect(practice.name).toBeDefined();
        expect(practice.nameEn).toBeDefined();
        expect(practice.pillar).toMatch(/^[ESG]$/);
        expect(practice.level).toMatch(/^(basic|intermediate|advanced)$/);
        expect(practice.description).toBeDefined();
        expect(practice.kpis.length).toBeGreaterThan(0);
        expect(practice.references.length).toBeGreaterThan(0);
      }
    });

    it('should have unique IDs', () => {
      const practices = getAllPractices();
      const ids = practices.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('validateMECEExclusivity', () => {
    it('should have no duplicate practices across pillars', () => {
      const result = validateMECEExclusivity();
      expect(result.isExclusive).toBe(true);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should report correct totals', () => {
      const result = validateMECEExclusivity();
      expect(result.totalPractices).toBe(30);
      expect(result.uniqueIds).toBe(30);
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate score for all practices assessed', () => {
      const practices = getAllPractices();
      const assessments: PracticeAssessment[] = practices.map(p => ({
        practiceId: p.id,
        status: p.level,
        score: 100,
        evidence: ['test'],
        gaps: [],
        recommendations: [],
      }));
      const result = calculateOverallScore(assessments);
      expect(result.totalScore).toBe(100);
    });

    it('should calculate score for no practices assessed', () => {
      const result = calculateOverallScore([]);
      expect(result.totalScore).toBe(0);
      expect(result.pillarScores.E).toBe(0);
      expect(result.pillarScores.S).toBe(0);
      expect(result.pillarScores.G).toBe(0);
    });

    it('should calculate partial score', () => {
      const ePractices = getPracticesByPillar('E');
      const assessments: PracticeAssessment[] = ePractices.map(p => ({
        practiceId: p.id,
        status: 'basic',
        score: 100,
        evidence: ['test'],
        gaps: [],
        recommendations: [],
      }));
      const result = calculateOverallScore(assessments);
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.totalScore).toBeLessThan(100);
      expect(result.pillarScores.E).toBe(100);
    });

    it('should generate recommendations for low scores', () => {
      const result = calculateOverallScore([]);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('getPracticesByLevel', () => {
    it('should return only basic practices', () => {
      const basic = getPracticesByLevel('basic');
      for (const p of basic) {
        expect(p.level).toBe('basic');
      }
    });

    it('should return only intermediate practices', () => {
      const intermediate = getPracticesByLevel('intermediate');
      for (const p of intermediate) {
        expect(p.level).toBe('intermediate');
      }
    });

    it('should return only advanced practices', () => {
      const advanced = getPracticesByLevel('advanced');
      for (const p of advanced) {
        expect(p.level).toBe('advanced');
      }
    });
  });
});
