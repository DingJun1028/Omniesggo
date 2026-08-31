/**
 * §12.1.3 數據管道 (Data Pipeline / ETL)
 * 5T: Trustworthy (數據寫入即凍結, 不可篡改)
 */
import { freeze, hashLock, uuidV4, OA_VERSION } from './types';

export interface ETLResult {
  readonly id: string;
  readonly traceId: string;
  readonly rows: number;
  readonly hashLock: string;
  readonly frozen: true;
}

export class ETLPipeline {
  /** Trustworthy: 轉換後數據凍結 + Hash Lock */
  async process<T>(source: T[], transform: (row: T) => T): Promise<ETLResult> {
    const traceId = uuidV4();
    const transformed = source.map((r) => freeze(transform(r) as object) as T);
    const payload = JSON.stringify(transformed);
    return freeze({
      id: uuidV4(),
      traceId,
      rows: transformed.length,
      hashLock: hashLock(payload),
      frozen: true as const,
    });
  }
}
