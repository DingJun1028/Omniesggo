import { describe, it, expect } from 'vitest';
import {
  parseOmniTagHeader,
  checkTagCompliance,
  auditOmniTags,
  suggestOmniTag,
  applyHeader,
  findUntagged,
} from './audit.js';

describe('§20.5 規則 5 / §20.6 驗收：OmniTag 合約率稽核', () => {
  it('parseOmniTagHeader extracts tags from header comment', () => {
    const content = `/**
 * [agent:25][squad:5T驗算][lifecycle:active][p2][platform:esggo][best-practice:结界]
 */
export const x = 1;`;
    const tags = parseOmniTagHeader(content);
    expect(tags).not.toBeNull();
    // parser 保留 namespace 前綴 (對齊 checkTagCompliance 期望)
    expect(tags!['agent']).toBe('agent:25');
    expect(tags!['squad']).toBe('squad:5T驗算');
    expect(tags!['lifecycle']).toBe('lifecycle:active');
    expect(tags!['p']).toBe('p2');
  });

  it('parseOmniTagHeader returns null when no tag', () => {
    expect(parseOmniTagHeader('const x = 1;')).toBeNull();
  });

  it('parseOmniTagHeader ignores tags beyond first 30 lines', () => {
    const lines = Array.from({ length: 40 }, (_, i) => `// line ${i}`);
    lines.push('* [agent:25][squad:5T驗算][lifecycle:active][p2]');
    expect(parseOmniTagHeader(lines.join('\n'))).toBeNull();
  });

  it('checkTagCompliance passes required triad', () => {
    const v = checkTagCompliance({ agent: 'agent:25', lifecycle: 'active', p: 'p2' });
    expect(v).toEqual([]);
  });

  it('checkTagCompliance fails missing triad', () => {
    const v = checkTagCompliance({ lifecycle: 'active' });
    expect(v.length).toBeGreaterThan(0);
    expect(v.some((x: string) => x.includes('agent'))).toBe(true);
  });

  it('auditOmniTags scans real project files and finds tagged ones', () => {
    // vitest cwd = cli/oa-cli, 用相對於此的專案路徑
    const result = auditOmniTags(['../src/lib', './src']);
    // 至少有 omnitag-contract.ts + omnitag.ts 帶標籤
    expect(result.tagged).toBeGreaterThanOrEqual(2);
    // 所有帶標籤的都應合約 (這些檔案標頭格式正確)
    expect(result.compliant).toBe(result.tagged);
    expect(result.rate).toBe(1);
  });

  it('suggestOmniTag infers squad from path', () => {
    expect(suggestOmniTag('src/lib/foo.ts')?.squad).toBe('符文契約');
    expect(suggestOmniTag('cli/oa-cli/src/bar.ts')?.squad).toBe('光之羽翼');
    expect(suggestOmniTag('src/core/agents/baz.ts')?.squad).toBe('智庫聖所');
  });

  it('applyHeader dry-run does not write, --write does', async () => {
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    const tmp = path.join(os.tmpdir(), `oa-head-${Date.now()}.ts`);
    fs.writeFileSync(tmp, 'export const x = 1;\n');
    try {
      const dry = applyHeader(tmp, true);
      expect(dry.written).toBe(false);
      expect(fs.readFileSync(tmp, 'utf8')).toBe('export const x = 1;\n');
      const real = applyHeader(tmp, false);
      expect(real.written).toBe(true);
      expect(fs.readFileSync(tmp, 'utf8').startsWith('// [agent:')).toBe(true);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('findUntagged finds files without header', async () => {
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    const dir = path.join(os.tmpdir(), `oa-untagged-${Date.now()}`);
    fs.mkdirSync(dir, { recursive: true });
    const f1 = path.join(dir, 'nohead.ts');
    const f2 = path.join(dir, 'hashead.ts');
    fs.writeFileSync(f1, 'export const a = 1;\n');
    fs.writeFileSync(f2, '// [agent:09][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]\nexport const b = 2;\n');
    try {
      const found = findUntagged([dir]);
      expect(found.length).toBe(1);
      expect(found[0].endsWith('nohead.ts')).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
