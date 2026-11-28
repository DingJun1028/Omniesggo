/**
 * OESG-Audit ISO-14064-3 式外部查證證據包 — 外部保證介面
 *
 * 定位: OESG 五路線圖第三站之對外輸出埠。OesgAuditEngine 已完成內部自證
 * (漂綠稽核判定 clean/flagged); 本模組將判定結晶升級為可提交第三方查證
 * 機構 (ISO 14064-3 verification) 之結構化證據包:
 * - 證據鏈: report.attestationHash ↔ verdict.attestationHash ↔ packageHash 三段鎖定
 * - 方法論: 載明稽核規則代碼 (audit rule codes), 供查證機構重演
 * - fail-closed: flagged 判定 / 上游未驗證 / sink 失敗任一存在 → 僅供內部 (internal-only)
 * - 確定性: 同輸入同 options 必得同 packageHash (canonical hash, 不含亂數)
 */
import { computeHash } from '@esggo/omni-core';
import {
  AuditError,
  type AuditVerdict,
  type AuditVerdictValue,
  type ReportInput,
} from './types';

/** 證據包狀態: assurance-ready = 可提交外部查證; internal-only = 僅供內部檢討 */
export type AssuranceStatus = 'assurance-ready' | 'internal-only';

/** 漂綠稽核規則代碼 (方法論揭示, 供查證機構重演) */
export const AUDIT_RULES = [
  'E_SCOPE_SUM_MISMATCH',
  'E_SHARE_NOT_CLOSED',
  'E_UPSTREAM_UNVERIFIED',
  'E_EMPTY_PERIOD',
] as const;

/** 證據鏈: 三段 hash 鎖定 + 方法論 */
export interface EvidenceChain {
  readonly standard: 'ISO-14064-1';
  readonly verificationStandard: 'ISO-14064-3';
  readonly reportAttestationHash: string;
  readonly verdictAttestationHash: string;
  readonly auditRules: readonly string[];
}

/** 外部查證證據包結晶 */
export interface VerificationPackage {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  readonly source_origin: string;
  readonly orgId: string;
  readonly reportUuid: string;
  readonly verdictUuid: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly verdict: AuditVerdictValue;
  readonly totalKgCo2e: number;
  readonly tickCount: number;
  readonly scopeCount: number;
  readonly findingCodes: readonly string[];
  readonly evidenceChain: EvidenceChain;
  readonly status: AssuranceStatus;
  readonly notes: readonly string[];
  readonly packageHash: string;
}

export interface BuildPackageOptions {
  /** 確定性測試用: 固定時間戳 */
  readonly now?: number;
  /** 確定性測試用: 固定 uuid */
  readonly uuid?: string;
  readonly sourceOrigin?: string;
}

const PKG_VERSION = '1.0.0';

/**
 * 由稽核判定 + 期報告結晶建構外部查證證據包。
 *
 * fail-closed 規則 (任一命中 → status = internal-only):
 * - verdict 非 clean (漂綠稽核未通過)
 * - report.verified = false (上游零幻覺攔截已標記)
 * - verdict.failures 非空 (稽核寫出埠存在失敗, 證據完整性存疑)
 *
 * fail-fast 規則 (直接拋 AuditError):
 * - E_PKG_REPORT_MISMATCH: verdict.reportUuid ≠ report.uuid
 * - E_PKG_ORG_MISMATCH: verdict.orgId ≠ report.orgId
 */
export function buildVerificationPackage(
  verdict: Readonly<AuditVerdict>,
  report: ReportInput,
  options: BuildPackageOptions = {},
): Readonly<VerificationPackage> {
  if (verdict.reportUuid !== report.uuid) {
    throw new AuditError(
      'E_PKG_REPORT_MISMATCH',
      `verdict.reportUuid = ${verdict.reportUuid} ≠ report.uuid = ${report.uuid}: 證據鏈斷裂不成立`,
    );
  }
  if (verdict.orgId !== report.orgId) {
    throw new AuditError(
      'E_PKG_ORG_MISMATCH',
      `verdict.orgId = ${verdict.orgId} ≠ report.orgId = ${report.orgId}: 跨組織封裝不成立`,
    );
  }

  const notes: string[] = [];
  if (verdict.verdict !== 'clean') {
    notes.push(`verdict = ${verdict.verdict}: 漂綠稽核未通過, 不得提交外部查證`);
  }
  if (!report.verified) {
    notes.push('report.verified = false: 上游逐 tick 驗算已攔截不一致申報');
  }
  if (verdict.failures.length > 0) {
    notes.push(`稽核寫出埠存在 ${verdict.failures.length} 項失敗結晶, 證據完整性存疑`);
  }
  const status: AssuranceStatus = notes.length === 0 ? 'assurance-ready' : 'internal-only';

  const evidenceChain: EvidenceChain = {
    standard: 'ISO-14064-1',
    verificationStandard: 'ISO-14064-3',
    reportAttestationHash: report.attestationHash,
    verdictAttestationHash: verdict.attestationHash,
    auditRules: Object.freeze([...AUDIT_RULES]),
  };

  const findingCodes = verdict.findings.map((f) => f.code);

  // 確定性封裝: packageHash 僅由實質欄位構成, 不含 uuid/timestamp 亂數源
  const packageHash = computeHash({
    standard: evidenceChain.verificationStandard,
    orgId: verdict.orgId,
    reportUuid: report.uuid,
    verdictUuid: verdict.uuid,
    verdict: verdict.verdict,
    totalKgCo2e: report.totalKgCo2e,
    tickCount: report.tickCount,
    scopeCount: report.scopeShares.length,
    findingCodes,
    reportAttestationHash: report.attestationHash,
    verdictAttestationHash: verdict.attestationHash,
    status,
  });

  const pkg: VerificationPackage = {
    uuid: options.uuid ?? `oesg-audit-package.${verdict.verdictUuid}`,
    version: PKG_VERSION,
    timestamp: options.now ?? Date.now(),
    source_origin: options.sourceOrigin ?? 'oesg://audit/package',
    orgId: verdict.orgId,
    reportUuid: report.uuid,
    verdictUuid: verdict.uuid,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    verdict: verdict.verdict,
    totalKgCo2e: report.totalKgCo2e,
    tickCount: report.tickCount,
    scopeCount: report.scopeShares.length,
    findingCodes: Object.freeze([...findingCodes]),
    evidenceChain,
    status,
    notes: Object.freeze([...notes]),
    packageHash,
  };
  return Object.freeze(pkg);
}

/** 證據包是否可提交外部查證 (fail-closed 便捷判讀) */
export function isAssuranceReady(pkg: Readonly<VerificationPackage>): boolean {
  return pkg.status === 'assurance-ready' && pkg.packageHash.length === 64 && pkg.notes.length === 0;
}
