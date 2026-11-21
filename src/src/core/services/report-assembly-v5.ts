import { getAnswersByCompany } from '../repositories/sustain-write-answer-database';
import { COMPANIES } from '../repositories/company-profiles';
export { COMPANIES } from "../repositories/company-profiles";

export const V5_CHAPTERS = [
  { id:'v5-ch01', num:1, title:'組織溯源與報告邊界', gri:['GRI 2-1','GRI 2-2','GRI 2-3','GRI 2-4','GRI 2-5','GRI 2-6','GRI 2-7','GRI 2-8','GRI 1'], fiveTGate:'traceable' },
  { id:'v5-ch02', num:2, title:'永續治理架構', gri:['GRI 2-9','GRI 2-10','GRI 2-11','GRI 2-12','GRI 2-13','GRI 2-14','GRI 2-15','GRI 2-16','GRI 2-17','GRI 2-18','GRI 2-19','GRI 2-20','GRI 2-21'], fiveTGate:'transparent' },
  { id:'v5-ch03', num:3, title:'重大性分析與利害關係人', gri:['GRI 2-29','GRI 2-30','GRI 3-1','GRI 3-2','GRI 3-3'], fiveTGate:'transparent' },
  { id:'v5-ch04', num:4, title:'經濟績效與誠信經營', gri:['GRI 201-1','GRI 201-2','GRI 201-3','GRI 201-4','GRI 205-1','GRI 205-2','GRI 205-3','GRI 206-1'], fiveTGate:'tangible' },
  { id:'v5-ch05', num:5, title:'氣候策略與淨零轉型', gri:['GRI 201-2','TCFD-G','TCFD-S','TCFD-R','SBTi','GRI 102-1','GRI 102-2','GRI 102-3','GRI 102-4'], fiveTGate:'tangible' },
  { id:'v5-ch06', num:6, title:'能源管理與碳排放', gri:['GRI 302-1','GRI 302-2','GRI 302-3','GRI 302-4','GRI 305-1','GRI 305-2','GRI 305-3','GRI 305-4','GRI 305-5'], fiveTGate:'tangible' },
  { id:'v5-ch07', num:7, title:'水資源與廢棄物管理', gri:['GRI 303-1','GRI 303-2','GRI 303-3','GRI 303-4','GRI 303-5','GRI 306-1','GRI 306-2','GRI 306-3'], fiveTGate:'tangible' },
  { id:'v5-ch08', num:8, title:'生物多樣性與自然資本', gri:['GRI 304-1','GRI 304-2','GRI 304-3','GRI 304-4','TNFD','GRI 101-1','GRI 101-2','GRI 101-3','GRI 101-4','GRI 101-5'], fiveTGate:'tangible' },
  { id:'v5-ch09', num:9, title:'循環經濟與產品生命週期', gri:['GRI 301-1','GRI 301-2','GRI 301-3','GRI 306-4','GRI 306-5'], fiveTGate:'tangible' },
  { id:'v5-ch10', num:10, title:'員工結構與人才發展', gri:['GRI 401-1','GRI 401-2','GRI 401-3','GRI 404-1','GRI 404-2','GRI 404-3'], fiveTGate:'tangible' },
  { id:'v5-ch11', num:11, title:'職業安全與人權', gri:['GRI 403-1','GRI 403-2','GRI 403-3','GRI 403-4','GRI 403-5','GRI 403-6','GRI 403-7','GRI 403-8','GRI 403-9','GRI 403-10','GRI 406','GRI 407','GRI 408','GRI 409','GRI 410','GRI 411'], fiveTGate:'trustworthy' },
  { id:'v5-ch12', num:12, title:'供應鏈永續管理', gri:['GRI 308-1','GRI 308-2','GRI 414-1','GRI 414-2','GRI 204-1'], fiveTGate:'trackable' },
  { id:'v5-ch13', num:13, title:'產品責任與客戶關係', gri:['GRI 416-1','GRI 416-2','GRI 417-1','GRI 417-2','GRI 417-3','GRI 418'], fiveTGate:'trustworthy' },
  { id:'v5-ch14', num:14, title:'資訊安全與隱私保護', gri:['GRI 418-1','ISO 27001','PDPA','GDPR'], fiveTGate:'trustworthy' },
  { id:'v5-ch15', num:15, title:'董事會治理與薪酬', gri:['GRI 2-9','GRI 2-10','GRI 2-18','GRI 2-19','GRI 2-20','GRI 2-21'], fiveTGate:'transparent' },
  { id:'v5-ch16', num:16, title:'風險管理與TCFD', gri:['GRI 201-2','TCFD-G','TCFD-R','TCFD-S','TCFD-M','GRI 102-1'], fiveTGate:'trustworthy' },
  { id:'v5-ch17', num:17, title:'氣候情境分析與機會', gri:['GRI 201-2','TCFD-S','TCFD-O','GRI 102-2','GRI 102-5'], fiveTGate:'transparent' },
  { id:'v5-ch18', num:18, title:'內部碳定價與碳市場', gri:['GRI 305','ICP','Article 6','GRI 102-10','GRI 102-9'], fiveTGate:'tangible' },
  { id:'v5-ch19', num:19, title:'綠色金融與ESG投資', gri:['GRI 201-1','EU Taxonomy','GRI 201-3'], fiveTGate:'transparent' },
  { id:'v5-ch20', num:20, title:'數位轉型與AI創新', gri:['GRI 404','GRI 201','ISO 27001','GRI 404-2'], fiveTGate:'tangible' },
  { id:'v5-ch21', num:21, title:'智財權與研發創新', gri:['GRI 201-1','GRI 404-1','GRI 201-3'], fiveTGate:'tangible' },
  { id:'v5-ch22', num:22, title:'客戶關係與數據隱私', gri:['GRI 417','GRI 418','PDPA','GDPR','GRI 416'], fiveTGate:'trustworthy' },
  { id:'v5-ch23', num:23, title:'社區參與與社會影響', gri:['GRI 413-1','GRI 413-2','SROI','GRI 203-1','GRI 203-2'], fiveTGate:'tangible' },
  { id:'v5-ch24', num:24, title:'勞動權益與多元平等', gri:['GRI 405-1','GRI 405-2','GRI 406-1','GRI 202-1','GRI 202-2'], fiveTGate:'trustworthy' },
  { id:'v5-ch25', num:25, title:'反貪腐與法規遵循', gri:['GRI 205-1','GRI 205-2','GRI 205-3','GRI 206-1','GRI 207-1','GRI 207-2','GRI 207-3','GRI 207-4','GRI 2-26'], fiveTGate:'transparent' },
  { id:'v5-ch26', num:26, title:'GRI內容索引與確信', gri:['GRI 1','ISAE 3000','AA1000','GRI 3-3'], fiveTGate:'traceable' },
  { id:'v5-ch27', num:27, title:'SDGs對應與永續路徑', gri:['SDG 1','SDG 4','SDG 5','SDG 7','SDG 8','SDG 9','SDG 12','SDG 13','SDG 16','SDG 17','SBTi'], fiveTGate:'trackable' },
  { id:'v5-ch28', num:28, title:'未來展望與承諾', gri:['SBTi','TCFD-R','GRI 2-22','路線圖'], fiveTGate:'trackable' },
] as const;

export interface V5ReportChapter {
  id: string;
  num: number;
  title: string;
  griCodes: readonly string[];
  fiveTGate: string;
  content: string;
  wordCount: number;
  zkpHash: string;
  omniTagUuid: string;
  evidenceCount: number;
}

export interface V5GeneratedReport {
  companyId: string;
  companyName: string;
  industry: string;
  chapters: V5ReportChapter[];
  totalWords: number;
  totalParagraphs: number;
  totalOmniTags: number;
  totalEvidence: number;
  fiveTStatus: { traceable: boolean; transparent: boolean; tangible: boolean; trustworthy: boolean; trackable: boolean };
  trinityHash: string;
  generatedAt: string;
  reportVersion: '5.0';
}

export function getV5Companies() {
  return COMPANIES.map((c: { instanceId: string; companyName: string; shortName: string; industryType: string }) => ({
    id: c.instanceId, name: c.companyName, shortName: c.shortName, industry: c.industryType,
  }));
}

export function assembleV5Report(companyId: string): V5GeneratedReport | null {
  const profile = COMPANIES.find((c: { instanceId: string; companyName: string; industryType: string }) => c.instanceId === companyId);
  if (!profile) return null;
  const answers = getAnswersByCompany(companyId);
  if (!answers.length) return null;
  return {
    companyId,
    companyName: profile.companyName,
    industry: profile.industryType,
    chapters: [],
    totalWords: 0,
    totalParagraphs: 0,
    totalOmniTags: 0,
    totalEvidence: 0,
    fiveTStatus: { traceable: true, transparent: true, tangible: true, trustworthy: true, trackable: true },
    trinityHash: '',
    generatedAt: new Date().toISOString(),
    reportVersion: '5.0',
  };
}
