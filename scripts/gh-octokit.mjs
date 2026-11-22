import { Octokit } from '@octokit/rest';

const USAGE = `gh-octokit — Omniesggo 倉庫維運 CLI（GitHub REST API via Octokit.js）

環境變數:
  GITHUB_TOKEN / GH_TOKEN   必填（repo scope）
  GITHUB_OWNER, GITHUB_REPO 可覆寫，預設 DingJun1028/Omniesggo
  GITHUB_API_URL 可指向 GitHub Enterprise / 測試 mock（預設 api.github.com）

指令（預設唯讀；刪除/貼標/留言為寫入操作）:
  report                          概覽：open PR（含 CI 結論）、open issues、近期 merged PR
  list-prs [--state open|closed|all]
  pr <number>                     PR 詳情 + head commit 的 check-runs
  list-issues [--state open|closed|all]
  list-branches                   列出分支，標記對應 PR 是否已 merged/closed
  clean-branches [--apply]        刪除已 merged/closed PR 的 head branch（預設 dry-run；--apply 才刪，永不刪預設分支）
  label <number> <label...>       為 issue/PR 加標籤
  comment <number> <text>         在 issue/PR 留言

範例:
  GITHUB_TOKEN=... node scripts/gh-octokit.mjs report
  node scripts/gh-octokit.mjs pr 208
  node scripts/gh-octokit.mjs clean-branches --apply
`;

function parseArgs(argv) {
  const args = { _: [], flags: new Set() };
  for (const a of argv) {
    if (a.startsWith('--')) args.flags.add(a.slice(2));
    else args._.push(a);
  }
  return args;
}

function getClient() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error('需要 GITHUB_TOKEN 或 GH_TOKEN 環境變數');
    process.exit(2);
  }
  return new Octokit({ auth: token, ...(process.env.GITHUB_API_URL ? { baseUrl: process.env.GITHUB_API_URL } : {}) });
}

function ownerRepo(args) {
  const [maybePair] = args._.filter((x) => x.includes('/'));
  const [owner, repo] = (process.env.GITHUB_REPOSITORY || maybePair || 'DingJun1028/Omniesggo').split('/');
  return {
    owner: process.env.GITHUB_OWNER || owner,
    repo: process.env.GITHUB_REPO || repo,
  };
}

async function prChecksSummary(octokit, owner, repo, sha) {
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/check-runs', {
      owner,
      repo,
      ref: sha,
      per_page: 100,
    });
    const runs = data.check_runs || [];
    const counts = {};
    for (const r of runs) counts[r.conclusion || r.status] = (counts[r.conclusion || r.status] || 0) + 1;
    const failing = runs.filter((r) => r.conclusion === 'failure' || r.conclusion === 'action_required');
    return { total: runs.length, counts, failing: failing.map((f) => f.name) };
  } catch {
    return { total: 0, counts: {}, failing: [] };
  }
}

async function cmdReport(octokit, owner, repo) {
  const prs = await octokit.paginate('GET /repos/{owner}/{repo}/pulls', { owner, repo, state: 'open', per_page: 50 });
  console.log(`== Open PRs: ${prs.length} ==`);
  for (const pr of prs) {
    const chk = await prChecksSummary(octokit, owner, repo, pr.head.sha);
    const bad = chk.failing.length ? ` ⚠ ${chk.failing.join(', ')}` : '';
    console.log(`#${pr.number} ${pr.title} [${pr.head.ref}] checks:${JSON.stringify(chk.counts)}${bad}`);
  }
  const issues = await octokit.paginate('GET /repos/{owner}/{repo}/issues', { owner, repo, state: 'open', per_page: 100 });
  const realIssues = issues.filter((i) => !i.pull_request);
  console.log(`== Open issues: ${realIssues.length} ==`);
  for (const i of realIssues.slice(0, 20)) console.log(`#${i.number} ${i.title}`);
  const merged = await octokit.paginate('GET /repos/{owner}/{repo}/pulls', { owner, repo, state: 'closed', per_page: 10, sort: 'updated', direction: 'desc' });
  console.log(`== Recently closed/merged PRs: ${merged.filter((p) => p.merged_at).length} merged of ${merged.length} ==`);
  for (const p of merged.slice(0, 10)) console.log(`#${p.number} ${p.merged_at ? 'merged' : 'closed'} ${p.title}`);
}

async function cmdListPrs(octokit, owner, repo, state) {
  const prs = await octokit.paginate('GET /repos/{owner}/{repo}/pulls', { owner, repo, state, per_page: 100 });
  for (const pr of prs) {
    console.log(`#${pr.number}\t${pr.state}${pr.merged_at ? '(merged)' : ''}\t${pr.head.ref}\t${pr.title}`);
  }
}

async function cmdPr(octokit, owner, repo, n) {
  const { data: pr } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', { owner, repo, pull_number: n });
  console.log(`#${pr.number} ${pr.title}`);
  console.log(`state=${pr.state} merged=${pr.merged_at} base=${pr.base.ref} head=${pr.head.ref}@${pr.head.sha.slice(0, 7)}`);
  console.log(`body: ${(pr.body || '').slice(0, 300)}`);
  const chk = await prChecksSummary(octokit, owner, repo, pr.head.sha);
  console.log(`checks: total=${chk.total} ${JSON.stringify(chk.counts)}`);
  if (chk.failing.length) console.log(`non-green: ${chk.failing.join(', ')}`);
  const { data: reviews } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews', { owner, repo, pull_number: n });
  for (const r of reviews) console.log(`review: ${r.state} by ${r.user?.login}`);
}

async function cmdListIssues(octokit, owner, repo, state) {
  const issues = await octokit.paginate('GET /repos/{owner}/{repo}/issues', { owner, repo, state, per_page: 100 });
  for (const i of issues.filter((x) => !x.pull_request)) {
    console.log(`#${i.number}\t${i.state}\t${(i.labels || []).map((l) => l.name).join(',')}\t${i.title}`);
  }
}

async function cmdListBranches(octokit, owner, repo) {
  const branches = await octokit.paginate('GET /repos/{owner}/{repo}/branches', { owner, repo, per_page: 100 });
  for (const b of branches) {
    let note = '';
    try {
      const { data: prs } = await octokit.request('GET /repos/{owner}/{repo}/commits/{branch}/pulls', {
        owner,
        repo,
        branch: b.name,
        state: 'all',
      });
      if (prs.length) note = prs.map((p) => `#${p.number}:${p.merged_at ? 'merged' : p.state}`).join(' ');
    } catch {}
    console.log(`${b.name}\t${b.commit.sha.slice(0, 7)}\t${note}`);
  }
}

async function cmdCleanBranches(octokit, owner, repo, apply) {
  const { data: repoData } = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo });
  const def = repoData.default_branch;
  const branches = await octokit.paginate('GET /repos/{owner}/{repo}/branches', { owner, repo, per_page: 100 });
  const victims = [];
  for (const b of branches) {
    if (b.name === def) continue;
    try {
      const { data: prs } = await octokit.request('GET /repos/{owner}/{repo}/commits/{branch}/pulls', {
        owner,
        repo,
        branch: b.name,
        state: 'all',
      });
      if (prs.some((p) => p.merged_at || p.state === 'closed')) victims.push(b.name);
    } catch {}
  }
  console.log(`default branch: ${def}`);
  console.log(`candidates (PR merged/closed): ${victims.length}`);
  for (const v of victims) console.log(`  ${v}`);
  if (!apply) {
    console.log('dry-run only; re-run with --apply to delete');
    return;
  }
  for (const v of victims) {
    try {
      await octokit.request('DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}', { owner, repo, branch: v });
      console.log(`deleted ${v}`);
    } catch (e) {
      console.log(`FAILED ${v}: ${e.message}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || args.flags.has('help')) {
    console.log(USAGE);
    process.exit(cmd ? 0 : 2);
  }
  const octokit = getClient();
  const { owner, repo } = ownerRepo(args);

  switch (cmd) {
    case 'report':
      await cmdReport(octokit, owner, repo);
      break;
    case 'list-prs':
      await cmdListPrs(octokit, owner, repo, args._[1] || 'open');
      break;
    case 'pr': {
      const n = Number(args._[1]);
      if (!n) throw new Error('pr <number> required');
      await cmdPr(octokit, owner, repo, n);
      break;
    }
    case 'list-issues':
      await cmdListIssues(octokit, owner, repo, args._[1] || 'open');
      break;
    case 'list-branches':
      await cmdListBranches(octokit, owner, repo);
      break;
    case 'clean-branches':
      await cmdCleanBranches(octokit, owner, repo, args.flags.has('apply'));
      break;
    case 'label': {
      const n = Number(args._[1]);
      const labels = args._.slice(2);
      if (!n || labels.length === 0) throw new Error('label <number> <label...> required');
      await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', { owner, repo, issue_number: n, labels });
      console.log(`labeled #${n}: ${labels.join(', ')}`);
      break;
    }
    case 'comment': {
      const n = Number(args._[1]);
      const text = args._.slice(2).join(' ');
      if (!n || !text) throw new Error('comment <number> <text> required');
      await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', { owner, repo, issue_number: n, body: text });
      console.log(`commented on #${n}`);
      break;
    }
    default:
      console.error(`未知指令: ${cmd}\n`);
      console.log(USAGE);
      process.exit(2);
  }
}

main().catch((e) => {
  console.error(`錯誤: ${e.message}`);
  process.exit(1);
});
