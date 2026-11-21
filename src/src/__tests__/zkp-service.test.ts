/**
 * src/__tests__/zkp-service.test.ts — ZKP Service 單元測試
 */

import { ZKPService, sealDocument, verifyDocument } from '@/lib/zkp-service';

describe('ZKPService', () => {
  beforeEach(() => {
    // Clear any existing proofs
    (ZKPService as unknown as { _proofs: Map<string, unknown> })._proofs.clear();
  });

  describe('seal', () => {
    it('should seal a document and return success', () => {
      const result = ZKPService.seal('DOC-001');

      expect(result.success).toBe(true);
      expect(result.documentId).toBe('DOC-001');
      expect(result.hashLock).toBeDefined();
      expect(result.proof).toBeDefined();
      expect(result.status).toBe('verified');
    });

    it('should generate unique hash locks', () => {
      const result1 = ZKPService.seal('DOC-001');
      const result2 = ZKPService.seal('DOC-002');

      expect(result1.hashLock).not.toBe(result2.hashLock);
    });
  });

  describe('verify', () => {
    it('should verify a sealed document', () => {
      const sealResult = ZKPService.seal('DOC-001');
      const verifyResult = ZKPService.verify('DOC-001', sealResult.hashLock);

      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.documentId).toBe('DOC-001');
    });

    it('should fail verification with wrong hash lock', () => {
      ZKPService.seal('DOC-001');
      const verifyResult = ZKPService.verify('DOC-001', 'wrong-hash-lock');

      expect(verifyResult.valid).toBe(false);
    });
  });

  describe('getProofs', () => {
    it('should return all proofs for a document', () => {
      ZKPService.seal('DOC-001');
      ZKPService.seal('DOC-001');
      ZKPService.seal('DOC-002');

      const proofs = ZKPService.getProofs('DOC-001');
      expect(proofs.length).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      ZKPService.seal('DOC-001');
      ZKPService.seal('DOC-002');

      const stats = ZKPService.getStats();
      expect(stats.totalProofs).toBe(2);
      expect(stats.verified).toBe(2);
    });
  });

  describe('convenience functions', () => {
    it('sealDocument should work', () => {
      const result = sealDocument('DOC-001');
      expect(result.success).toBe(true);
    });

    it('verifyDocument should work', () => {
      const sealResult = sealDocument('DOC-001');
      const verifyResult = verifyDocument('DOC-001', sealResult.hashLock);
      expect(verifyResult.valid).toBe(true);
    });
  });
});
