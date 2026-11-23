import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { processDocumentWithOcr } from '../src/core/services/document-processor';

describe('company document processing', () => {
  it('preserves CSV source text and hashes the original bytes', async () => {
    const source = Buffer.from('\uFEFF期間,用電量(kWh)\n2025,1200\n', 'utf8');
    const result = await processDocumentWithOcr(source, 'energy.csv', 'demo-01');
    expect(result.ocrResult.text).toBe('期間,用電量(kWh)\n2025,1200');
    expect(result.ocrResult.confidence).toBe(1);
    expect(result.hashLock).toBe(createHash('sha256').update(source).digest('hex'));
    expect(result.knowledgePoint.tags).toContain('human-review-required');
  });

  it('rejects empty and invalid UTF-8 text rather than inventing contents', async () => {
    await expect(processDocumentWithOcr(Buffer.alloc(0), 'empty.txt', 'demo-01')).rejects.toThrow(/empty/i);
    await expect(processDocumentWithOcr(Buffer.from([0xc3, 0x28]), 'invalid.txt', 'demo-01')).rejects.toThrow();
  });
});
