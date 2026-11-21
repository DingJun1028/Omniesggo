import { describe, it, expect } from 'vitest';
import {
  validateESGData,
  EnvironmentalDataSchema,
  DeiDataSchema,
  GovBoardDataSchema,
} from '../jules-validator';
import { generateHashLock, ncbClient } from '../ncb-client';
import { ReportSchemaRegistry, getSchemaByUUID } from '../registry';
import { AgenticTwin } from '../agentic-twin';
import { TIER_LIMITS } from '../tier-config';

const baseEnv = {
  uuid: 'mod-env-carbon-0001',
  version: '1.1.0-Universe',
  timestamp: Date.now(),
  source_origin: 'test',
  evidence: ['https://s3.example.com/ev.pdf'],
  reportType: 'ISO-14064' as const,
  previousYearUsage: 5000,
  currentYearUsage: 4500,
  gridEmissionFactor: 0.495,
};

describe('Omni 9式果因引擎 — 零幻覺驗算', () => {
  it('正常數據通過 EnvironmentalDataSchema', () => {
    const r = EnvironmentalDataSchema.safeParse(baseEnv);
    expect(r.success).toBe(true);
  });

  it('currentYearUsage 暴增 >500% 被攔截', () => {
    const r = EnvironmentalDataSchema.safeParse({
      ...baseEnv,
      previousYearUsage: 1000,
      currentYearUsage: 10000,
    });
    expect(r.success).toBe(false);
  });

  it('缺少 evidence 被攔截', () => {
    const r = EnvironmentalDataSchema.safeParse({ ...baseEnv, evidence: [] });
    expect(r.success).toBe(false);
  });

  it('DEI 薪酬差距 >30% 觸發阻攔', () => {
    const r = DeiDataSchema.safeParse({
      uuid: 'mod-soc-dei-0001',
      version: '1.0.0-Universe',
      timestamp: Date.now(),
      source_origin: 'test',
      evidence: ['https://s3.example.com/e.pdf'],
      reportYear: 2026,
      totalEmployees: 200,
      femaleManagementRatio: 30,
      genderPayGap: 45,
      vulnerableGroupRatio: 2,
    });
    expect(r.success).toBe(false);
  });

  it('GOV 董事會出席率 <85% 觸發阻攔', () => {
    const r = GovBoardDataSchema.safeParse({
      uuid: 'mod-gov-board-0001',
      version: '1.0.0-Universe',
      timestamp: Date.now(),
      source_origin: 'test',
      evidence: ['https://s3.example.com/g.pdf'],
      reportYear: 2026,
      boardMeetingCount: 4,
      averageAttendanceRate: 70,
      independentDirectorRatio: 40,
      femaleDirectorRatio: 30,
      hasRiskCommittee: 1,
    });
    expect(r.success).toBe(false);
  });

  it('validateESGData 依 UUID 分派正確契約', () => {
    const ok = validateESGData(baseEnv);
    expect(ok.success).toBe(true);
    const bad = validateESGData({ ...baseEnv, currentYearUsage: 99999, previousYearUsage: 100 });
    expect(bad.success).toBe(false);
  });
});

describe('NCBDB Hash Lock 不可篡改封印', () => {
  it('generateHashLock 產生穩定 SHA-256', () => {
    const a = generateHashLock({ x: 1 });
    const b = generateHashLock({ x: 1 });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('insertDocument 本地路徑回傳已封印物件', async () => {
    const res = await ncbClient.insertDocument('omni_reports_content', baseEnv as Record<string, unknown>);
    expect((res as Record<string, unknown>)._hash_signature).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('聖典註冊中心', () => {
  it('註冊表含 3 份基準報告', () => {
    expect(Object.keys(ReportSchemaRegistry).length).toBe(3);
  });
  it('getSchemaByUUID 命中', async () => {
    const s = await getSchemaByUUID('mod-env-carbon-0001');
    expect(s?.uuid).toBe('mod-env-carbon-0001');
  });
});

describe('Agentic Twin 雙棲決策', () => {
  it('正常數據產出 OPTIMIZED 洞察', async () => {
    const twin = new AgenticTwin({ enterpriseName: 'Test', industry: 'tech', currentEntropy: 0.1 });
    const insight = await twin.autonomousAnalyze(baseEnv);
    expect(insight.status).toBe('OPTIMIZED');
  });
  it('異常數據產出 CRITICAL_INTERVENTION', async () => {
    const twin = new AgenticTwin({ enterpriseName: 'Test', industry: 'tech', currentEntropy: 0.1 });
    const insight = await twin.autonomousAnalyze({ ...baseEnv, currentYearUsage: 99999, previousYearUsage: 100 });
    expect(insight.status).toBe('CRITICAL_INTERVENTION');
  });
});

describe('SaaS 訂閱分級', () => {
  it('UNIVERSE 解鎖 Dr. Thoth 與 Magic Link', () => {
    expect(TIER_LIMITS.UNIVERSE.canSummonDrThoth).toBe(true);
    expect(TIER_LIMITS.UNIVERSE.canUseMagicLink).toBe(true);
  });
  it('CORE 不具備 AI 與 Magic Link', () => {
    expect(TIER_LIMITS.CORE.canSummonDrThoth).toBe(false);
    expect(TIER_LIMITS.CORE.canUseMagicLink).toBe(false);
  });
});
