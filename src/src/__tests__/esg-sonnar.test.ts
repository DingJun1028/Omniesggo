/**
 * src/__tests__/esg-sonnar.test.ts — ESGSonnar Service 單元測試
 */

import { ESGSonnarService, queryESGSonnar, getESGSonnarStats } from '@/lib/esg-sonnar';

describe('ESGSonnarService', () => {
  beforeEach(() => {
    // Reset initialization
    (ESGSonnarService as unknown as { _initialized: boolean })._initialized = false;
    (ESGSonnarService as unknown as { _results: Map<string, unknown> })._results.clear();
  });

  describe('query', () => {
    it('should query all results', () => {
      const results = ESGSonnarService.query({});
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by company ID', () => {
      const results = ESGSonnarService.query({ companyId: 'C001' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => expect(r.companyId).toBe('C001'));
    });

    it('should filter by category', () => {
      const results = ESGSonnarService.query({ category: 'environment' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => expect(r.category).toBe('environment'));
    });

    it('should filter by keyword', () => {
      const results = ESGSonnarService.query({ keyword: '碳排放' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect limit', () => {
      const results = ESGSonnarService.query({ limit: 1 });
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const stats = ESGSonnarService.getStats();
      expect(stats.totalResults).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
    });

    it('should filter stats by company', () => {
      const stats = ESGSonnarService.getStats('C001');
      expect(stats.totalResults).toBeGreaterThan(0);
    });
  });

  describe('convenience functions', () => {
    it('queryESGSonnar should work', () => {
      const results = queryESGSonnar({ keyword: '碳排放' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('getESGSonnarStats should work', () => {
      const stats = getESGSonnarStats();
      expect(stats.totalResults).toBeGreaterThan(0);
    });
  });
});
