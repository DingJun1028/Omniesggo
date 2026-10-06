// ═══════════════════════════════════════════════════════════════
// ESG API Logic Integration Tests
// Tests the business logic used by API routes
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { getAllSkills, getSkill } from '../index';
import '../registry';
import {
  getAllPractices,
  getPracticesByPillar,
  validateMECECompleteness,
  validateMECEExclusivity,
  calculateOverallScore,
  type PracticeAssessment,
} from '../best-practices';
import { routeModel } from '@/core/ai/model-router';

describe('ESG API Business Logic', () => {
  describe('Skills List Logic', () => {
    it('should return 11 skills with correct structure', () => {
      const skills = getAllSkills().map(s => s.getInfo());
      expect(skills.length).toBe(11);

      for (const skill of skills) {
        expect(skill.id).toBeDefined();
        expect(skill.name).toBeDefined();
        expect(skill.nameEn).toBeDefined();
        expect(skill.description).toBeDefined();
        expect(skill.taskType).toBeDefined();
      }
    });

    it('should categorize skills by pillar correctly', () => {
      const skills = getAllSkills().map(s => s.getInfo());

      const eSkills = skills.filter(s =>
        s.taskType.includes('carbon') || s.taskType.includes('tcfd') || s.taskType.includes('sdg')
      );
      const sSkills = skills.filter(s =>
        s.taskType.includes('stakeholder') || s.taskType.includes('compliance')
      );
      const gSkills = skills.filter(s =>
        s.taskType.includes('gri') || s.taskType.includes('materiality')
      );

      expect(eSkills.length).toBeGreaterThan(0);
      expect(sSkills.length).toBeGreaterThan(0);
      expect(gSkills.length).toBeGreaterThan(0);
    });
  });

  describe('Skill Execution Logic', () => {
    it('should generate prompts for carbon_calculation', () => {
      const skill = getSkill('carbon_calculation');
      expect(skill).toBeDefined();

      const ctx = { company: '臺積電', year: '2024', language: 'zh-TW' as const };
      expect(skill!.validate(ctx)).toBe(true);

      const systemPrompt = skill!.systemPrompt(ctx);
      const userPrompt = skill!.userPrompt(ctx);

      expect(systemPrompt.length).toBeGreaterThan(0);
      expect(userPrompt).toContain('臺積電');
      expect(userPrompt).toContain('2024');
    });

    it('should generate prompts for all task types', () => {
      const taskTypes = [
        'carbon_calculation', 'tcfd_analysis', 'sdg_mapping',
        'compliance_review', 'gri_report_draft', 'materiality_matrix',
        'stakeholder_analysis', 'email_archival', 'evidence_ocr', 'report_assembly',
      ];

      for (const taskType of taskTypes) {
        const skill = getSkill(taskType);
        expect(skill).toBeDefined();

        const ctx = { company: '臺積電', year: '2024', language: 'zh-TW' as const };
        const systemPrompt = skill!.systemPrompt(ctx);
        const userPrompt = skill!.userPrompt(ctx);

        expect(systemPrompt.length).toBeGreaterThan(0);
        expect(userPrompt.length).toBeGreaterThan(0);
      }
    });

    it('should route model for each task type', () => {
      const taskTypes = [
        'carbon_calculation', 'tcfd_analysis', 'sdg_mapping',
        'compliance_review', 'gri_report_draft', 'materiality_matrix',
      ];

      for (const taskType of taskTypes) {
        const routing = routeModel(taskType);
        expect(routing.primary).toBeDefined();
        expect(routing.primary.provider).toBeDefined();
        expect(routing.primary.model).toBeDefined();
        expect(routing.fallback1).toBeDefined();
        expect(routing.fallback2).toBeDefined();
      }
    });
  });

  describe('Best Practices Query Logic', () => {
    it('should return all 30 practices', () => {
      const practices = getAllPractices();
      expect(practices.length).toBe(30);
    });

    it('should filter by pillar', () => {
      const ePractices = getPracticesByPillar('E');
      for (const p of ePractices) {
        expect(p.pillar).toBe('E');
      }
    });

    it('should compute stats correctly', () => {
      const practices = getAllPractices();
      const stats = {
        total: practices.length,
        byPillar: {
          E: practices.filter(p => p.pillar === 'E').length,
          S: practices.filter(p => p.pillar === 'S').length,
          G: practices.filter(p => p.pillar === 'G').length,
        },
        byLevel: {
          basic: practices.filter(p => p.level === 'basic').length,
          intermediate: practices.filter(p => p.level === 'intermediate').length,
          advanced: practices.filter(p => p.level === 'advanced').length,
        },
      };

      expect(stats.total).toBe(30);
      expect(stats.byPillar.E + stats.byPillar.S + stats.byPillar.G).toBe(30);
      expect(stats.byLevel.basic + stats.byLevel.intermediate + stats.byLevel.advanced).toBe(30);
    });
  });

  describe('MECE Validation Logic', () => {
    it('should validate completeness', () => {
      const result = validateMECECompleteness();
      expect(result.isComplete).toBeDefined();
    });

    it('should validate exclusivity', () => {
      const result = validateMECEExclusivity();
      expect(result.isExclusive).toBe(true);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should combine validations for full check', () => {
      const completeness = validateMECECompleteness();
      const exclusivity = validateMECEExclusivity();
      const isValid = completeness.isComplete && exclusivity.isExclusive;
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Assessment Logic', () => {
    it('should create default assessment template', () => {
      const allPractices = getAllPractices();
      const assessmentList: PracticeAssessment[] = allPractices.map(p => ({
        practiceId: p.id,
        status: 'not_started' as const,
        score: 0,
        evidence: [],
        gaps: [`${p.name} 尚未實施`],
        recommendations: [`開始實施 ${p.name}`],
      }));

      expect(assessmentList.length).toBe(30);
      for (const a of assessmentList) {
        expect(a.score).toBe(0);
        expect(a.status).toBe('not_started');
      }
    });

    it('should calculate overall score', () => {
      const allPractices = getAllPractices();
      const assessments: PracticeAssessment[] = allPractices.map(p => ({
        practiceId: p.id,
        status: 'basic',
        score: 50,
        evidence: ['test'],
        gaps: [],
        recommendations: [],
      }));

      const result = calculateOverallScore(assessments);
      expect(result.totalScore).toBe(50);
    });

    it('should generate action plan for low-scoring practices', () => {
      const allPractices = getAllPractices();
      const assessmentList: PracticeAssessment[] = allPractices.map(p => ({
        practiceId: p.id,
        status: 'not_started' as const,
        score: 0,
        evidence: [],
        gaps: [],
        recommendations: [],
      }));

      const actionPlan = allPractices
        .filter(practice => {
          const assessment = assessmentList.find(a => a.practiceId === practice.id);
          return !assessment || assessment.score < 80;
        })
        .slice(0, 10)
        .map(practice => ({
          practiceId: practice.id,
          name: practice.name,
          pillar: practice.pillar,
          level: practice.level,
          priority: practice.level === 'basic' ? 'high' : practice.level === 'intermediate' ? 'medium' : 'low',
        }));

      expect(actionPlan.length).toBe(10);
      for (const item of actionPlan) {
        expect(item.practiceId).toBeDefined();
        expect(item.priority).toMatch(/^(high|medium|low)$/);
      }
    });
  });
});
