/**
 * OesgAuditEngine — OESG-Audit 漂綠稽核引擎
 *
 * OESG 五路線圖第三站: Pulse → Report → **Audit** → Exchange → DAO。
 * 復用 12大萬能模組管線 (@esggo/omni-arch), 與前兩站對稱:
 * - OmniBus: 訂閱 oesg.report.draft (listenTo) / 廣播 oesg.audit.verdict
 * - OmniEvidence: ISO-14064-1 零幻覺複核 (範疇加總一致性 + 佔比封閉性重算)
 * - OmniMemory: 稽核判定結晶留痕 (tags: oesg/audit/carbon)
 * - OmniHealing: 戒嚴期間拒絕稽核寫入 (治理鐵律)
 *
 * 漂綠偵測 (獨立複核規則, 不信任上游旗標):
 * - E_SCOPE_SUM_MISMATCH: Σ scope_shares.kg_co2e ≠ report.total_kgco2e
 * - E_SHARE_NOT_CLOSED: Σ scope_shares.share ≠ 1
 * - E_UPSTREAM_UNVERIFIED: report.verified = false (上游零幻覺攔截已標記)
 * - E_EMPTY_PERIOD: tick_count < 1
 */
import { randomUUID } from 'node:crypto';
import { computeHash } from '@esggo/omni-core';
import { mintEvent, OmniArchError, type ArchWire } from '@esggo/omni-arch';
import type { OesgReportEngine } from '@esggo/oesg-report';
import {
  AuditError,
  type AuditFinding,
  type AuditSink,
  type AuditSinkFailure,
  type AuditVerdict,
  type ReportInput,
} from './types';

export interface OesgAuditConfig {
  readonly orgId: string;
  readonly sinks: readonly AuditSink[];
  readonly sourceOrigin?: string;
}

const EMISSION_STANDARD = 'ISO-14064-1';
const TOPIC_VERDICT = 'oesg.audit.verdict';
const TOPIC_DRAFT = 'oesg.report.draft';
const INTENT_AUDIT = 'oesg.audit.run';

export class OesgAuditEngine {
  readonly orgId: string;
  private readonly wire: ArchWire;
  private readonly sinks: readonly AuditSink[];
  private readonly sourceOrigin: string;
  private readonly inbox: ReportInput[] = [];

  constructor(wire: ArchWire, config: OesgAuditConfig) {
    if (!config.orgId) {
      throw new AuditError('E_AUDIT_ORG', 'orgId 為必填, 稽核無主不成立');
    }
    this.wire = wire;
    this.orgId = config.orgId;
    this.sinks = [...config.sinks];
    this.sourceOrigin = config.sourceOrigin ?? 'oesg://audit';
  }

  /** 接線次站: 訂閱 oesg.report.draft, 期報告自動納入待稽清單 */
  listenTo(report: OesgReportEngine): void {
    report.subscribe((draft) => {
      this.inbox.push(draft);
    });
  }

  /** 手動納入期報告 (離線批次/複核歷史結晶場景) */
  ingest(report: ReportInput): void {
    this.inbox.push(report);
  }

  /** 註冊代理意圖: agent.understand('oesg.audit.run') 即執行稽核 */
  registerIntent(): void {
    this.wire.agent.onIntent(INTENT_AUDIT, async () => this.audit());
  }

  /** 執行稽核: 獨立複核每份期報告 → 判定 → 結晶 → 留痕 → 廣播 → 寫出 */
  async audit(): Promise<Readonly<AuditVerdict>[]> {
    if (this.wire.healing.isLocked()) {
      throw new OmniArchError('E_MARTIAL_LAW', '戒嚴期間拒絕稽核寫入');
    }
    if (this.inbox.length === 0) {
      throw new AuditError('E_AUDIT_EMPTY', '待稽清單為空, 空稽核不成立');
    }

    const verdicts: AuditVerdict[] = [];
    for (const report of this.inbox) {
      verdicts.push(await this.auditor(report));
    }
    return verdicts.map((v) => Object.freeze(v));
  }

  /** 單份報告之獨立複核 */
  private async auditor(report: ReportInput): Promise<AuditVerdict> {
    const findings: AuditFinding[] = [];

    // 規則一: 範疇加總一致性 (零幻覺重算)
    const scopeSum = report.scopeShares.reduce((sum, s) => sum + s.kgCo2e, 0);
    const scopeVerification = await this.wire.evidence.verify({
      standard: EMISSION_STANDARD,
      formula: (inputs) => inputs.scopeSum,
      formulaName: 'Σ scope_shares.kg_co2e = report.total_kgco2e',
      inputs: { scopeSum, reportedTotal: report.totalKgCo2e },
      expected: report.totalKgCo2e,
    });
    if (!scopeVerification.passed) {
      findings.push({
        code: 'E_SCOPE_SUM_MISMATCH',
        detail: `Σ scope_shares.kg_co2e = ${scopeSum} ≠ report.total_kgco2e = ${report.totalKgCo2e}`,
      });
    }

    // 規則二: 佔比封閉性
    const shareSum = report.scopeShares.reduce((sum, s) => sum + s.share, 0);
    const shareVerification = await this.wire.evidence.verify({
      standard: EMISSION_STANDARD,
      formula: (inputs) => inputs.shareSum,
      formulaName: 'Σ scope_shares.share = 100%',
      inputs: { shareSum, total: 1 },
      expected: 1,
      tolerance: 1e-9,
    });
    if (!shareVerification.passed) {
      findings.push({
        code: 'E_SHARE_NOT_CLOSED',
        detail: `Σ scope_shares.share = ${shareSum} ≠ 1`,
      });
    }

    // 規則三: 上游零幻覺旗標 (不信任、必覆核)
    if (!report.verified) {
      findings.push({
        code: 'E_UPSTREAM_UNVERIFIED',
        detail: 'report.verified = false: 上游逐 tick 驗算已攔截不一致申報',
      });
    }

    // 規則四: 期間非空
    if (report.tickCount < 1) {
      findings.push({
        code: 'E_EMPTY_PERIOD',
        detail: `tick_count = ${report.tickCount} < 1`,
      });
    }

    // [合] 判定結晶 (稽核軌跡 Hash Lock, 供 Exchange/DAO 及 SLL 第三方追溯)
    const verdict: AuditVerdict = {
      uuid: `oesg-audit.${randomUUID()}`,
      version: '1.0.0',
      timestamp: Date.now(),
      source_origin: this.sourceOrigin,
      orgId: this.orgId,
      reportUuid: report.uuid,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      verdict: findings.length === 0 ? 'clean' : 'flagged',
      findings: Object.freeze([...findings]),
      attestationHash: computeHash({
        reportUuid: report.uuid,
        totalKgCo2e: report.totalKgCo2e,
        findings: findings.map((f) => f.code),
        orgId: this.orgId,
      }),
      failures: Object.freeze([]),
    };

    // [終] 留痕 + 廣播 (sink 失敗不毀判定)
    await this.wire.memory.remember(`oesg://audit/${verdict.uuid}`, verdict, [
      'oesg',
      'audit',
      'carbon',
    ]);
    await this.wire.bus.publish(mintEvent(this.sourceOrigin, TOPIC_VERDICT, verdict));

    const failures: AuditSinkFailure[] = [];
    for (const sink of this.sinks) {
      try {
        await sink.write(verdict);
      } catch (error) {
        failures.push({ sinkId: sink.id, error: String(error) });
      }
    }
    return failures.length > 0 ? { ...verdict, failures: Object.freeze(failures) } : verdict;
  }

  /** 供第四站 Exchange 訂閱稽核判定 */
  subscribe(listener: (verdict: Readonly<AuditVerdict>) => void): void {
    this.wire.bus.subscribe(TOPIC_VERDICT, (event) => listener(event.payload as AuditVerdict));
  }
}
