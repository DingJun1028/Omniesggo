// ═══════════════════════════════════════════════════════════════
// ESG Skills Registry Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { getSkill, getAllSkills, SkillContext } from '../index';

// Import registry to trigger auto-registration
import '../registry';

describe('ESG Skills Registry', () => {
  it('should have 11 registered skills', () => {
    const skills = getAllSkills();
    expect(skills.length).toBe(11);
  });

  it('should register carbon-calculation skill (lookup by taskType)', () => {
    const skill = getSkill('carbon_calculation');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('carbon-calculation');
    expect(skill?.name).toContain('碳排');
    expect(skill?.taskType).toBe('carbon_calculation');
  });

  it('should register tcfd-analysis skill', () => {
    const skill = getSkill('tcfd_analysis');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('tcfd-analysis');
    expect(skill?.name).toContain('TCFD');
  });

  it('should register sdg-mapping skill', () => {
    const skill = getSkill('sdg_mapping');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('sdg-mapping');
    expect(skill?.name).toContain('SDG');
  });

  it('should register compliance-review skill', () => {
    const skill = getSkill('compliance_review');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('compliance-review');
    expect(skill?.name).toContain('合規');
  });

  it('should register gri-report-draft skill', () => {
    const skill = getSkill('gri_report_draft');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('gri-report-draft');
    expect(skill?.name).toContain('GRI');
  });

  it('should register materiality-matrix skill', () => {
    const skill = getSkill('materiality_matrix');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('materiality-matrix');
    expect(skill?.name).toContain('重大性');
  });

  it('should register stakeholder-analysis skill', () => {
    const skill = getSkill('stakeholder_analysis');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('stakeholder-analysis');
    expect(skill?.name).toContain('利害關係人');
  });

  it('should register email-archival skill', () => {
    const skill = getSkill('email_archival');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('email-archival');
    expect(skill?.name).toContain('郵件');
  });

  it('should register evidence-ocr skill', () => {
    const skill = getSkill('evidence_ocr');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('evidence-ocr');
    expect(skill?.name).toContain('OCR');
  });

  it('should register report-assembly skill', () => {
    const skill = getSkill('report_assembly');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('report-assembly');
    expect(skill?.name).toContain('報告組裝');
  });

  it('should register junaikey-sovereign skill', () => {
    const skill = getSkill('junaikey_sovereign');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('junaikey-sovereign');
    expect(skill?.name).toContain('萬能元鑰');
  });

  it('should return undefined for non-existent taskType', () => {
    const skill = getSkill('non_existent');
    expect(skill).toBeUndefined();
  });

  it('each skill should have systemPrompt method', () => {
    const skills = getAllSkills();
    for (const skill of skills) {
      expect(typeof skill.systemPrompt).toBe('function');
      const prompt = skill.systemPrompt({ language: 'zh-TW' });
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    }
  });

  it('each skill should have userPrompt method', () => {
    const skills = getAllSkills();
    for (const skill of skills) {
      expect(typeof skill.userPrompt).toBe('function');
      const prompt = skill.userPrompt({ company: '臺積電', year: '2024' });
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    }
  });

  it('each skill should have validate method returning boolean', () => {
    const skills = getAllSkills();
    const ctx: SkillContext = { company: '臺積電', year: '2024', language: 'zh-TW' };
    for (const skill of skills) {
      expect(typeof skill.validate).toBe('function');
      const result = skill.validate(ctx);
      expect(typeof result).toBe('boolean');
    }
  });

  it('each skill should have getInfo method', () => {
    const skills = getAllSkills();
    for (const skill of skills) {
      const info = skill.getInfo();
      expect(info.id).toBeDefined();
      expect(info.name).toBeDefined();
      expect(info.nameEn).toBeDefined();
      expect(info.description).toBeDefined();
      expect(info.taskType).toBeDefined();
    }
  });
});
