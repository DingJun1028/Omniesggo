// OmniAPI — esggo 內部統一 API 服務
// 零外部依賴：node 原生 http + child_process
// 對齊 omniagent-gateway 風格（ESM / .mjs / port 可 env 覆寫）
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);
const PORT = Number(process.env.PORT || 8789);
const REPO = process.env.ESGRO_REPO || 'C:/Project/esggo';

// 5T 協定內部結構（對齊 OA-Team soul.md）
const FIVE_T = {
  Traceable: 'source_origin 標記可溯源',
  Trackable: '生命週期 hooks 可追蹤',
  Tangible: 'UI/UX 回饋可感知',
  Transparent: '零幻覺驗算可透明',
  Trustworthy: 'Hash Lock + Object.freeze 不可篡改',
};

function json(res, code, body) {
  const data = JSON.stringify(body, null, 2);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(data);
}

async function safeGit(args) {
  try {
    const { stdout } = await execFileP('git', args, { cwd: REPO, timeout: 8000 });
    return stdout.trim();
  } catch (e) {
    return '';
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  if (p === '/health' || p === '/') {
    return json(res, 200, { status: 'ok', service: 'omni-api', ts: Date.now() });
  }

  if (p === '/api/status') {
    const branch = await safeGit(['branch', '--show-current']);
    return json(res, 200, {
      service: 'omni-api',
      version: '0.1.0',
      repo: REPO,
      branch: branch || 'unknown',
      fiveT: Object.keys(FIVE_T).length,
    });
  }

  if (p === '/api/5t') {
    return json(res, 200, { protocol: '5T', items: FIVE_T, compliant: true });
  }

  if (p === '/api/branches') {
    const out = await safeGit(['branch', '-a']);
    return json(res, 200, { branches: out.split('\n').map((s) => s.trim()).filter(Boolean) });
  }

  return json(res, 404, { error: 'not_found', path: p });
});

server.listen(PORT, () => {
  console.log(`[omni-api] listening on :${PORT} (repo=${REPO})`);
});
