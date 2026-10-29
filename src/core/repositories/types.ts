// Types for the C-version Professional Sustainability Report System

export interface ReportOptions {
  language?: 'zh' | 'en';
  includeGriIndex?: boolean;
  includeWordCount?: boolean;
  reportYear?: number;
  companyName?: string;
}

export interface RepositoryReportChapter {
  id: string;
  number: number;
  title: string;
  titleEn: string;
  content: string;
  wordCount: number;
  griIndicators: string[];
  dataQuality: 'high' | 'medium' | 'low';
}
// ts-matrix: 對外相容別名 (API 不變)
export type { RepositoryReportChapter as ReportChapter };

export interface GRIIndex {
  standard: string;
  indicator: string;
  title: string;
  pageReference: string;
  status: 'reported' | 'partially_reported' | 'not_reported';
}

export interface GeneratedReport {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  generatedAt: string;
  reportYear: number;
  language: 'zh' | 'en';
  chapters: RepositoryReportChapter[];
  griIndex: GRIIndex[];
  totalWordCount: number;
  metadata: {
    version: string;
    templateUsed: string;
    dataCompleteness: number;
  };
}

export interface CompanyProfile {
  id: string;
  name: string;
  nameEn: string;
  industry: string;
  industryEn: string;
  capital: number;
  employees: number;
  foundedYear: number;
  headquarters: string;
  headquartersEn: string;
  website?: string;
  description: string;
  descriptionEn: string;
}

export interface QuestionBank {
  id: string;
  chapter: number;
  category: string;
  question: string;
  questionEn: string;
  answerType: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  griMapping?: string;
  required: boolean;
  order: number;
}

export interface AnswerRecord {
  id: string;
  companyId: string;
  questionId: string;
  answer: string | number | boolean;
  answeredAt: string;
  answeredBy?: string;
  verified: boolean;
}

export interface ChapterDefinition {
  number: number;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  griStandards: string[];
  requiredAnswers: string[];
}
