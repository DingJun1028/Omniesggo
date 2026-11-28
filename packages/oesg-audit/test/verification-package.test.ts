import { describe, expect, it } from 'vitest';
import { OmniArch } from '@esggo/omni-arch';
import { OesgPulseEngine, type PulseTick } from '@esggo/oesg-pulse';
import { OesgReportEngine, type OesgReport } from '@esggo/oesg-report';
import {
  AuditError,
  buildVerificationPackage,
  isAssuranceReady,
  OesgAuditEngine,
  type AuditVerdict,
  type VerificationPackage,
} from '../src';

const PERIOD = { start: 1_780_000_000_000, end: 1_780_003_600_000 };
const FIXED_NOW = 1_780_100_000_000;

function staticSource(id: string, readings: any[]) {
  return { id, label: id, read: async () => readings };
}

async function makeTick(kwh: number): Promise<Readonly<PulseTick>> {
  const arch = OmniArch.germinate();
  const engine = new OesgPulseEngine(arch.wire, {
    orgId: 'org-a',
    sources: [staticSource('electricity', [
      { scope: 'S2', sourceId: 'electricity', activity: kwh, unit: 'kWh', factor: 0.494, takenAt: PERIOD.start },
    ])],
    sinks: [],
  });
  return engine.sweep(PERIOD);
}

/** 以真實 Pulse→Report→Audit 管線產生一份 clean 判定 + 其報告結晶 */
async function makeCleanVerdict(): Promise<{ verdict: Readonly<AuditVerdict>; report: Readonly<OesgReport> }> {
  const arch = OmniArch.germinate();
  const report = new OesgReportEngine(arch.wire, { orgId: 'org-a', sinks: [] });
  report.ingest(await makeTick(1200)); // S2: 592.8
  const draft = await report.compile();
  const audit = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
  audit.ingest(draft);
  const [verdict] = await audit.audit();
  return { verdict, report: draft };
}

describe('buildVerificationPackage (ISO-14064-3 外部查證證據包)', () => {
  it('clean 判定 → assurance-ready, 證據鏈三段 hash 齊備, packageHash 64', async () => {
    const { verdict, report } = await makeCleanVerdict();

    const pkg = buildVerificationPackage(verdict, report, { now: FIXED_NOW });

    expect(pkg.status).toBe('assurance-ready');
    expect(pkg.verdict).toBe('clean');
    expect(pkg.packageHash).toHaveLength(64);
    expect(pkg.evidenceChain.reportAttestationHash).toBe(report.attestationHash);
    expect(pkg.evidenceChain.verdictAttestationHash).toBe(verdict.attestationHash);
    expect(pkg.evidenceChain.verificationStandard).toBe('ISO-14064-3');
    expect(pkg.evidenceChain.auditRules).toHaveLength(4);
    expect(pkg.findingCodes).toHaveLength(0);
    expect(pkg.notes).toHaveLength(0);
    expect(isAssuranceReady(pkg)).toBe(true);
  });

  it('確定性: 同輸入同 options → 同 packageHash 與全欄位相等', async () => {
    const { verdict, report } = await makeCleanVerdict();

    const a = buildVerificationPackage(verdict, report, { now: FIXED_NOW });
    const b = buildVerificationPackage(verdict, report, { now: FIXED_NOW });

    expect(a.packageHash).toBe(b.packageHash);
    expect(a).toEqual(b);
  });

  it('fail-closed 一: flagged 判定 → internal-only 且載明原因', async () => {
    const arch = OmniArch.germinate();
    const report = new OesgReportEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    report.ingest(await makeTick(1200));
    const draft = await report.compile();
    const tampered = { ...draft, scopeShares: draft.scopeShares.map((s) => ({ ...s, kgCo2e: s.kgCo2e / 2 })) } as OesgReport;
    const audit = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    audit.ingest(tampered);
    const [verdict] = await audit.audit();

    const pkg = buildVerificationPackage(verdict, tampered, { now: FIXED_NOW });

    expect(verdict.verdict).toBe('flagged');
    expect(pkg.status).toBe('internal-only');
    expect(pkg.findingCodes).toContain('E_SCOPE_SUM_MISMATCH');
    expect(pkg.notes.some((n) => n.includes('漂綠稽核未通過'))).toBe(true);
    expect(isAssuranceReady(pkg)).toBe(false);
  });

  it('fail-closed 二: report.verified = false → internal-only', async () => {
    const { verdict, report } = await makeCleanVerdict();
    const unverified = { ...report, verified: false } as OesgReport;

    const pkg = buildVerificationPackage(verdict, unverified, { now: FIXED_NOW });

    expect(pkg.status).toBe('internal-only');
    expect(pkg.notes.some((n) => n.includes('verified = false'))).toBe(true);
    expect(isAssuranceReady(pkg)).toBe(false);
  });

  it('fail-fast 一: verdict.reportUuid ≠ report.uuid → E_PKG_REPORT_MISMATCH', async () => {
    const { verdict, report } = await makeCleanVerdict();
    const other = { ...report, uuid: report.uuid + '-other' } as OesgReport;

    expect(() => buildVerificationPackage(verdict, other)).toThrowError(AuditError);
    expect(() => buildVerificationPackage(verdict, other)).toThrowError(/E_PKG_REPORT_MISMATCH/);
  });

  it('fail-fast 二: 跨組織封裝 → E_PKG_ORG_MISMATCH', async () => {
    const { verdict, report } = await makeCleanVerdict();
    const foreign = { ...report, orgId: 'org-b' } as OesgReport;

    expect(() => buildVerificationPackage(verdict, foreign)).toThrowError(/E_PKG_ORG_MISMATCH/);
  });

  it('證據包為深凍結結晶: mutation 應於型別層被排除 (凍結語意驗證)', async () => {
    const { verdict, report } = await makeCleanVerdict();
    const pkg: Readonly<VerificationPackage> = buildVerificationPackage(verdict, report, { now: FIXED_NOW });

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(Object.isFrozen(pkg.evidenceChain)).toBe(true);
    expect(Object.isFrozen(pkg.notes)).toBe(true);
  });
});
