import { describe, it, expect } from 'vitest';
import translations from '../i18n/translations';
import surveySchema from '../schemas/survey';
import mockCases from '../data/mockCases';

const EXTRA_LOCALE_KEYS = new Set([
  'knowledge',
  'knowledgeSearchPlaceholder',
  'knowledgeEmpty',
  'taPanel',
  'authPanel',
]);

describe('i18n translations', () => {
  it('should have tw/cn locales only', () => {
    expect(Object.keys(translations)).toEqual(['zh-TW', 'zh-CN', 'en']);
  });

  it('should have consistent keys across locales', () => {
    const baseKeys = Object.keys(translations['zh-TW']);
    const normalized = (keys) =>
      keys.filter((k) => !['cases_legacy_order', ...EXTRA_LOCALE_KEYS].includes(k)).sort();
    expect(normalized(Object.keys(translations['zh-CN']))).toEqual(normalized(baseKeys));
  });

  it('should have known keys in zh-TW', () => {
    const t = translations['zh-TW'];
    expect(t.heroTitleLine1).toBe('2026 Berkeley');
    expect(t.heroTitleLine2).toBe('柏克萊國際永續策略人才培育課程學習中心');
    expect(t.footer).toBe('2026 Berkeley柏克萊國際永續策略人才培育課程學習中心 | 柏克萊國際策略與創新 ESG 人才培育課程');
    expect(t.brandName).toBe('Berkeley柏克萊國際永續策略人才培育課程學習中心');
  });
});

describe('survey schema', () => {
  it('should have 4 sections', () => {
    expect(surveySchema).toHaveLength(4);
  });

  it('should have unique question ids', () => {
    const ids = surveySchema.flatMap((section) => section.questions.map((item) => item.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every question should have text', () => {
    for (const section of surveySchema) {
      for (const question of section.questions) {
        expect(question.text.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('mock cases', () => {
  it('should have 4 cases', () => {
    expect(mockCases).toHaveLength(4);
  });

  it('every case should have required fields', () => {
    for (const item of mockCases) {
      expect(item).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        desc: expect.any(String),
        content: expect.any(String),
      });
      expect(item.content.length).toBeGreaterThan(0);
    }
  });
});
