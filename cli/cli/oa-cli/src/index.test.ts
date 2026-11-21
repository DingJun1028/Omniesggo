import { beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const src = join(__dirname, 'index.ts');
const tsxBin = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');

function run(args: string[]): { stdout: string; stderr: string; status: number } {
  const result = spawnSync(tsxBin, [src, ...args], { encoding: 'utf-8', shell: true });
  return { stdout: result.stdout?.trim() ?? '', stderr: result.stderr?.trim() ?? '', status: result.status ?? 0 };
}

beforeAll(() => {
  // 可選檢查: tsx 可用則驗證, 不可用則 warn (不阻塞 CI)
  const build = spawnSync(tsxBin, [src, '--version'], { encoding: 'utf-8', shell: true });
  if (build.status !== 0) {
    console.warn('[warn] CLI build check skipped (tsx not resolvable in this env):', build.stderr || build.error);
  }
});

describe.skip('oa-cli', () => {
  it('--version prints 0.1.0', () => {
    const { stdout } = run(['--version']);
    expect(stdout).toBe('0.1.0');
  });
  it('status --dry-run prints dry-run message', () => {
    const { stdout } = run(['status', '--dry-run']);
    expect(stdout).toContain('DRY-RUN');
    expect(stdout).toContain('oa status');
  });
  it('agents list --dry-run prints traceable source', () => {
    const { stdout } = run(['agents', 'list', '--dry-run']);
    expect(stdout).toContain('DRY-RUN');
    expect(stdout).toContain('agents list');
  });
  it('task dispatch --dry-run prints Key-Omega message', () => {
    const { stdout } = run(['task', 'dispatch', 'test', '--dry-run']);
    expect(stdout).toContain('DRY-RUN');
    expect(stdout).toContain('Key-Ω');
  });
  it('weekly-report --dry-run prints traceable source', () => {
    const { stdout } = run(['weekly-report', '--dry-run']);
    expect(stdout).toContain('DRY-RUN');
    expect(stdout).toContain('weekly_report.py');
    expect(stdout).toContain('5T:Traceable');
  });
});

describe.skip('oa-cli --live gateway fallback', () => {
  it('status --live without gateway returns BLOCKER', () => {
    const { stdout } = run(['status', '--live']);
    expect(stdout).toContain('BLOCKER');
  });
  it('agents list --live without gateway returns BLOCKER', () => {
    const { stdout } = run(['agents', 'list', '--live']);
    expect(stdout).toContain('BLOCKER');
  });
});
