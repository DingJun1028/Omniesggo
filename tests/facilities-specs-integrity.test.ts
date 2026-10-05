import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('A01 ~ A07 Facilities 5T Specifications Integrity', () => {
  const specsDir = path.resolve(process.cwd(), 'docs/specifications');

  const requiredSpecs = [
    'A01_OMNI_CENTER_SPECIFICATION.md',
    'A02_ESG_REPORTS_SPECIFICATION.md',
    'A03_PARSER_VERIFIER_SPECIFICATION.md',
    'A04_MATERIALITY_SPECIFICATION.md',
    'A05_SUPPLY_CHAIN_SPECIFICATION.md',
    'A06_CARBON_ROADMAP_SPECIFICATION.md',
    'A07_TRUST_DATABRIDGE_SPECIFICATION.md',
  ];

  it('should have all 7 facility specifications present in docs/specifications/', () => {
    requiredSpecs.forEach((specFile) => {
      const fullPath = path.join(specsDir, specFile);
      expect(fs.existsSync(fullPath), `Specification file ${specFile} must exist`).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    });
  });

  it('each specification should contain the 5T End-Beginning Matrix (起承轉合終)', () => {
    requiredSpecs.forEach((specFile) => {
      const fullPath = path.join(specsDir, specFile);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toContain('終始矩陣');
      expect(content).toMatch(/Origin|起/);
      expect(content).toMatch(/Process|承/);
      expect(content).toMatch(/Synthesize|轉/);
      expect(content).toMatch(/Hash Lock|合/);
      expect(content).toMatch(/Effect|終/);
    });
  });

  it('each specification should enforce zero text gradients', () => {
    requiredSpecs.forEach((specFile) => {
      const fullPath = path.join(specsDir, specFile);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toMatch(/零文字漸層|Zero Text Gradient/i);
    });
  });

  it('core facility pages should not have text gradient classes (bg-clip-text)', () => {
    const pageFiles = [
      'app/page.tsx',
      'app/materiality/page.tsx',
      'app/supply-chain/page.tsx',
      'app/carbon/page.tsx',
      'app/roadmap/page.tsx',
      'app/parser/page.tsx',
      'app/verifier/page.tsx',
    ];

    pageFiles.forEach((relPath) => {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const code = fs.readFileSync(fullPath, 'utf-8');
        expect(code).not.toContain('bg-clip-text text-transparent');
      }
    });
  });
});
