/**
 * §12.1.6 錯誤處理 (Error Handling)
 * 5T: Trustworthy (錯誤記錄凍結, 不可篡改)
 */
import { freeze, uuidV4, OA_VERSION } from './types';

export interface ErrorRecord {
  readonly id: string;
  readonly ts: number;
  readonly message: string;
  readonly stack?: string;
  readonly context: Readonly<Record<string, unknown>>;
}

export class ErrorHandler {
  private readonly log: ErrorRecord[] = [];

  /** Trustworthy: 錯誤寫入即凍結存證 */
  async handle(error: Error, context: Record<string, unknown> = {}): Promise<ErrorRecord> {
    const record: ErrorRecord = freeze({
      id: uuidV4(),
      ts: Date.now(),
      message: error.message,
      stack: error.stack,
      context: freeze({ ...context }),
    });
    this.log.push(record);
    return record;
  }

  getLog(): ReadonlyArray<ErrorRecord> {
    return freeze([...this.log]);
  }
}
