// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
export interface SeedRecord {
  id: string;
  type: 'company' | 'indicator' | 'chapter' | 'question' | 'answer';
  payload: Record<string, unknown>;
  tags: string[];
  createdAt: number;
}

export interface SeedResult {
  records: SeedRecord[];
  summary: { total: number; byType: Record<string, number> };
}

export class OmniSeed {
  private records: SeedRecord[] = [];
  private counter = 0;

  generateCompanies(count = 5): SeedRecord[] {
    const industries = ['科技', '金融', '製造', '能源', '醫療'];
    const records: SeedRecord[] = [];
    for (let i = 0; i < count; i++) {
      this.counter++;
      const id = `seed-company-${this.counter}`;
      const payload = {
        name: `Demo 公司 ${this.counter}`,
        industry: industries[i % industries.length],
        employees: Math.floor(Math.random() * 5000) + 200,
        revenue: Math.floor(Math.random() * 50_000_000_000) + 1_000_000_000,
        year: 2025,
      };
      records.push(Object.freeze({ id, type: 'company', payload, tags: ['demo', payload.industry], createdAt: Date.now() }));
    }
    this.records.push(...records);
    return records;
  }

  generateIndicators(count = 20): SeedRecord[] {
    const topics = ['碳排', '水資源', '能源管理', '廢棄物', '供應鏈'];
    const records: SeedRecord[] = [];
    for (let i = 0; i < count; i++) {
      this.counter++;
      const id = `seed-indicator-${this.counter}`;
      const topic = topics[i % topics.length];
      records.push(Object.freeze({
        id,
        type: 'indicator',
        payload: { code: `GRI-${this.counter}`, topic, value: Math.round(Math.random() * 1000), unit: 'tCO2e' },
        tags: [topic, 'GRI'],
        createdAt: Date.now(),
      }));
    }
    this.records.push(...records);
    return records;
  }

  generateQuestions(count = 10): SeedRecord[] {
    const records: SeedRecord[] = [];
    for (let i = 0; i < count; i++) {
      this.counter++;
      const id = `seed-question-${this.counter}`;
      records.push(Object.freeze({
        id,
        type: 'question',
        payload: { chapter: `ch${String(i + 1).padStart(2, '0')}`, text: `請問貴公司 ${i + 1} 號永續指標之作業現況？` },
        tags: ['問卷', `ch${String(i + 1).padStart(2, '0')}`],
        createdAt: Date.now(),
      }));
    }
    this.records.push(...records);
    return records;
  }

  generateFakeAnswers(questionIds: string[]): SeedRecord[] {
    const records: SeedRecord[] = [];
    for (const qid of questionIds) {
      this.counter++;
      const id = `seed-answer-${this.counter}`;
      records.push(Object.freeze({
        id,
        type: 'answer',
        payload: { questionId: qid, value: Math.round(Math.random() * 100), unit: '%', year: 2025 },
        tags: ['answer'],
        createdAt: Date.now(),
      }));
    }
    this.records.push(...records);
    return records;
  }

  seedAll(): SeedResult {
    const companies = this.generateCompanies(5);
    const indicators = this.generateIndicators(20);
    const questions = this.generateQuestions(10);
    const answers = this.generateFakeAnswers(questions.map(q => q.payload.questionId as string));
    return {
      records: [...companies, ...indicators, ...questions, ...answers],
      summary: { total: this.records.length, byType: {} },
    };
  }

  list(): SeedRecord[] {
    return [...this.records];
  }

  clear(): void {
    this.records = [];
  }
}

export const omniSeed = new OmniSeed();
