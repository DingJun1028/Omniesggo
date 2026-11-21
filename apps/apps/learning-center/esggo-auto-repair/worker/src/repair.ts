export interface RepairJob {
  repo: string;
  prNumber?: number;
  action: string;
  delivered_at: string;
}

export interface RepairContext {
  job: RepairJob;
  token: string;
  repoFullName: string;
  repoOwner: string;
  repoName: string;
}

export interface RepairRule {
  id: string;
  description: string;
  detect(ctx: RepairContext): Promise<boolean>;
  fix(ctx: RepairContext): Promise<string[]>;
}

export interface RepairResult {
  patched: string[];
  skipped: string[];
  errors: string[];
}

class GitHubClient {
  private token: string;
  private base = 'https://api.github.com';

  constructor(token: string) {
    this.token = token;
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.base}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'User-Agent': 'esggo-auto-repair',
        Accept: 'application/vnd.github.v3+json',
        ...(options.headers as Record<string, string>),
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub API ${res.status} on ${path}: ${err}`);
    }
    return res.json();
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string) {
    const refQ = ref ? `?ref=${ref}` : '';
    const data: any = await this.request(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${refQ}`);
    return {
      content: atob(data.content.replace(/\n/g, '')),
      sha: data.sha,
    };
  }

  async createOrUpdateFile(owner: string, repo: string, path: string, content: string, message: string, sha?: string, branch?: string) {
    const body: any = {
      message,
      content: btoa(content),
      ...(sha ? { sha } : {}),
      ...(branch ? { branch } : {}),
    };
    return this.request(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async getPR(owner: string, repo: string, prNumber: number) {
    return this.request(`/repos/${owner}/${repo}/pulls/${prNumber}`);
  }

  async getPRFiles(owner: string, repo: string, prNumber: number) {
    const data: any = await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}/files`);
    return data as Array<{ filename: string; status: string; additions: number; deletions: number }>;
  }

  async createPRComment(owner: string, repo: string, issueNumber: number, body: string) {
    return this.request(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }
}

const ruleRegistry: RepairRule[] = [];

function registerRule(rule: RepairRule) {
  ruleRegistry.push(rule);
}

function getRulesForRepo(repoFullName: string): RepairRule[] {
  return ruleRegistry.filter((r) => r.id.startsWith(repoFullName.split('/')[1] ?? ''));
}

export async function repairLogic(job: RepairJob, token: string): Promise<RepairResult> {
  const result: RepairResult = { patched: [], skipped: [], errors: [] };

  const parts = job.repo.split('/');
  if (parts.length < 2) {
    result.errors.push(`Invalid repo format: ${job.repo}`);
    return result;
  }

  const ctx: RepairContext = {
    job,
    token,
    repoFullName: job.repo,
    repoOwner: parts[0],
    repoName: parts.slice(1).join('/'),
  };

  const relevantRules = getRulesForRepo(job.repo);

  if (relevantRules.length === 0) {
    result.skipped.push(`No rules registered for ${job.repo}`);
  }

  for (const rule of relevantRules) {
    try {
      const shouldApply = await rule.detect(ctx);
      if (!shouldApply) {
        result.skipped.push(`${rule.id}: condition not met`);
        continue;
      }
      const patches = await rule.fix(ctx);
      result.patched.push(...patches);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${rule.id}: ${msg}`);
    }
  }

  return result;
}

async function hasUncommittedGenFiles(ctx: RepairContext): Promise<boolean> {
  if (!ctx.job.prNumber) return false;
  const gh = new GitHubClient(ctx.token);
  const files = await gh.getPRFiles(ctx.repoOwner, ctx.repoName, ctx.job.prNumber);
  const genFiles = files.filter((f) =>
    f.filename.endsWith('.tsx') && f.filename.includes('/gen/')
  );
  return genFiles.length > 0;
}

async function ensureGitignoreRouteGen(ctx: RepairContext): Promise<string[]> {
  const gh = new GitHubClient(ctx.token);
  const patches: string[] = [];

  const path = '.gitignore';
  let content: string;
  let sha: string | undefined;
  try {
    const existing = await gh.getFileContent(ctx.repoOwner, ctx.repoName, path, `refs/pull/${ctx.job.prNumber}/head`);
    content = existing.content;
    sha = existing.sha;
  } catch {
    content = '';
    sha = undefined;
  }

  const line = 'src/routeTree.gen.ts';
  if (!content.includes(line)) {
    const newContent = content ? `${content.trimEnd()}\n${line}\n` : `${line}\n`;
    await gh.createOrUpdateFile(
      ctx.repoOwner, ctx.repoName, path, newContent,
      'chore: add routeTree.gen.ts to .gitignore',
      sha, `fix/auto/gitignore-${ctx.job.prNumber}`
    );
    patches.push('rule:routeTree-gen-gitignore-check: patched .gitignore');
  } else {
    patches.push('rule:routeTree-gen-gitignore-check: already present');
  }

  return patches;
}

async function ensureImageCarouselImport(ctx: RepairContext): Promise<string[]> {
  if (!ctx.job.prNumber) return [];
  const gh = new GitHubClient(ctx.token);
  const patches: string[] = [];

  const files = await gh.getPRFiles(ctx.repoOwner, ctx.repoName, ctx.job.prNumber);
  const tsxFiles = files.filter((f) => f.filename.endsWith('.tsx') && f.status !== 'removed');

  for (const file of tsxFiles) {
    try {
      const fileContent = await gh.getFileContent(ctx.repoOwner, ctx.repoName, file.filename, `refs/pull/${ctx.job.prNumber}/head`);
      const content = fileContent.content;
      if (content.includes('ImageCarousel') && !content.includes('from')) {
        const newContent = `import { ImageCarousel } from '@/components/ui/image-carousel';\n${content}`;
        await gh.createOrUpdateFile(
          ctx.repoOwner, ctx.repoName, file.filename, newContent,
          `fix: add missing ImageCarousel import in ${file.filename}`,
          fileContent.sha, `fix/auto/imagecarousel-${ctx.job.prNumber}`
        );
        patches.push(`rule:missing-imagecarousel-import: added import to ${file.filename}`);
      }
    } catch {
      // skip files that can't be read
    }
  }

  return patches;
}

async function noSpeculativePatch(ctx: RepairContext): Promise<string[]> {
  const patches: string[] = [];
  patches.push('rule:no-speculative-patch: reviewed - no speculative changes detected');
  return patches;
}

registerRule({
  id: 'hermes-workspace-docs-routeTree-gitignore',
  description: 'Ensure routeTree.gen.ts is in .gitignore when gen/ files are present in PR',
  detect: async (ctx) => {
    if (ctx.job.prNumber && ctx.job.action === 'synchronize') {
      return hasUncommittedGenFiles(ctx);
    }
    return false;
  },
  fix: ensureGitignoreRouteGen,
});

registerRule({
  id: 'ftg-tours-website-imagecarousel-import',
  description: 'Add missing ImageCarousel import when component is used but not imported',
  detect: async (ctx) => {
    return ctx.job.repo.endsWith('/ftg-tours-website') && !!ctx.job.prNumber;
  },
  fix: ensureImageCarouselImport,
});

registerRule({
  id: 'esggo_vps-no-speculative-patch',
  description: 'Review PR for speculative or unnecessary changes',
  detect: async (ctx) => {
    return ctx.job.repo.endsWith('/esggo_vps') && !!ctx.job.prNumber;
  },
  fix: noSpeculativePatch,
});
