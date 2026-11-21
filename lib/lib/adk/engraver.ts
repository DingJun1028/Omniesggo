import { IComponentCore, ITraceableLog, IEvidenceHash } from '@lib/types/esg-core';
import crypto from "crypto";

/**
 * [01] 契約鑄造者 (The Covenanter) & [04] 溯源審核員 (The Tracer)
 * 聯手執行的數據刻印邏輯。
 */
export const engraveHashLock = <T>(
  payload: T,
  source: string,
  actor: string = "ADK_STORM_01_04"
): IComponentCore & { payload: T; source_origin: string; traceability_chain: ITraceableLog[]; initialEvidence: IEvidenceHash } => {
  const timestamp = Date.now();
  const uuid = `OMNI-CORE-${crypto.randomUUID().toUpperCase()}`;

  // [04] 溯源審核員：建立初始溯源點
  const genesisLog: ITraceableLog = {
    action: 'GENESIS',
    timestamp,
    actor,
    source_origin: source,
  };

  // 生成初始證據 Hash
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload) + timestamp + uuid)
    .digest("hex");

  const initialEvidence: IEvidenceHash = {
    hashId: hash,
    provider: actor,
    timestamp,
  };

  // [01] 契約鑄造者：封裝組件核心並執行不可篡改鎖定
  const core: IComponentCore & { payload: T; source_origin: string; traceability_chain: ITraceableLog[]; initialEvidence: IEvidenceHash } = {
    uuid,
    version: 'v1.0.0-immutable',
    timestamp,
    source_origin: source,
    payload,
    evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
    initialEvidence,
    traceability_chain: [genesisLog],
  };

  // 深度凍結組件，確保不可篡改
  return deepFreeze(core);
};

/**
 * 執行 Deep Freeze 以達成不可篡改性
 */
function deepFreeze(obj: any) {
  Object.getOwnPropertyNames(obj).forEach((name) => {
    const prop = obj[name];
    if (prop !== null && typeof prop === "object") {
      deepFreeze(prop);
    }
  });
  return Object.freeze(obj);
}
