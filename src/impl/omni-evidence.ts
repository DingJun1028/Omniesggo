import { createHash, randomUUID } from 'crypto';

export type ImplEvidenceRecord = {
  readonly uuid: string;
  readonly sourceOrigin: string;
  readonly timestamp: number;
  readonly standard: string;
  readonly payloadHash: string;
  readonly status: 'verified' | 'pending' | 'failed';
};

// [ts-matrix] 對外相容別名：保留原匯出名稱，既有呼叫端不受影響。
export type { ImplEvidenceRecord as EvidenceRecord };

export type VerificationInput = {
  readonly sourceOrigin: string;
  readonly standard?: string;
  readonly payload: unknown;
};

export class OmniEvidence {
  private records: ImplEvidenceRecord[] = [];
  private readonly standard: string;

  constructor(standard = '[ISO-14064-1]') {
    this.standard = standard;
  }

  static hashPayload(payload: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(payload ?? {}))
      .digest('hex');
  }

  capture(input: VerificationInput): ImplEvidenceRecord {
    const record = Object.freeze({
      uuid: randomUUID(),
      sourceOrigin: input.sourceOrigin,
      timestamp: Date.now(),
      standard: input.standard ?? this.standard,
      payloadHash: OmniEvidence.hashPayload(input.payload),
      status: 'pending',
    } as ImplEvidenceRecord);

    this.records.push(record);
    return record;
  }

  verify(record: ImplEvidenceRecord, payload: unknown): boolean {
    const expected = OmniEvidence.hashPayload(payload);
    const ok = record.payloadHash === expected;

    const idx = this.records.findIndex(r => r.uuid === record.uuid);
    if (idx >= 0) {
      this.records[idx] = Object.freeze({
        ...record,
        status: ok ? 'verified' : 'failed',
      }) as ImplEvidenceRecord;
    }

    return ok;
  }

  getRecords(sourceOrigin?: string): readonly ImplEvidenceRecord[] {
    if (!sourceOrigin) return Object.freeze([...this.records]);
    return Object.freeze(this.records.filter(r => r.sourceOrigin === sourceOrigin));
  }
}
