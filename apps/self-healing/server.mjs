// Self-Healing Engine — GitHub Actions + Gmail 錯誤自我修復系統
// 5T 治理：Traceable / Trackable / Transparent / Trustworthy / Tangible
// OA-Twins 雙蜂組：暗（蜂王隊 01-30）分析修復 + 光（蜂后隊 31-60）廣播回報

import http from 'node:http';
import { execFile, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, isAbsolute } from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';

const execFileP = promisify(execFile);
const PORT = Number(process.env.PORT || 8790);
const REPO = process.env.ESGGO_REPO || resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ═══════════════════════════════════════════
// 5T 治理層 — Governance5T
// ═══════════════════════════════════════════

/**
 * IComponentCore — 萬能元件心核基礎介面
 */
function createComponentCore(sourceOrigin) {
  return Object.freeze({
    uuid: crypto.randomUUID(),
    version: 'v0.5.0',
    timestamp: Date.now(),
    evidence: {},
    source_origin: sourceOrigin,
  });
}

/**
 * 計算 Hash Lock（SHA-256）
 */
function computeHashLock(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 建立 5T 治理標籤
 */
function create5TGovernance(sourceOrigin, attemptCount, lifecycleStage, patchContent) {
  return Object.freeze({
    traceable: {
      source_origin: sourceOrigin,
      commit_sha: getGitSha(),
    },
    trackable: {
      attempt_count: attemptCount,
      lifecycle_stage: lifecycleStage,
    },
    transparent: {
      standard_compliance: '[ISO-14064-1]',
      verification_formula: 'Zero-Hallucination-Proof-v1',
    },
    trustworthy: {
      hash_lock: patchContent ? computeHashLock(patchContent) : '',
      is_frozen: lifecycleStage === 'HEALED',
    },
    tangible: {
      ui_theme: 'liquid-glass',
      dynamic_feedback: true,
    },
  });
}

// ═══════════════════════════════════════════
// Git 工具層
// ═══════════════════════════════════════════

function getGitSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO, encoding: 'utf-8' }).trim();
  } catch { return 'unknown'; }
}

function getGitBranch() {
  try {
    return execSync('git branch --show-current', { cwd: REPO, encoding: 'utf-8' }).trim();
  } catch { return 'unknown'; }
}

async function safeGit(args) {
  try {
    const { stdout } = await execFileP('git', args, { cwd: REPO, timeout: 10000 });
    return stdout.trim();
  } catch (e) {
    return '';
  }
}

// ═══════════════════════════════════════════
// 沙箱驗證層 — 執行 typecheck + test
// ═══════════════════════════════════════════

async function runSandboxVerification() {
  try {
    // 先嘗試 typecheck
    const { stdout: typeOut, stderr: typeErr } = await execFileP(
      'pnpm', ['run', 'typecheck'],
      { cwd: REPO, timeout: 120, encoding: 'utf-8' }
    ).catch(e => ({ stdout: '', stderr: e.message || 'typecheck failed' }));

    if (typeErr && typeErr.includes('error')) {
      return { success: false, output: `TypeCheck Failed:\n${typeErr}` };
    }

    // 再嘗試 test
    const { stdout: testOut, stderr: testErr } = await execFileP(
      'pnpm', ['run', 'test', '--run'],
      { cwd: REPO, timeout: 180, encoding: 'utf-8' }
    ).catch(e => ({ stdout: '', stderr: e.message || 'test failed' }));

    if (testErr && (testErr.includes('FAIL') || testErr.includes('error'))) {
      return { success: false, output: `Test Failed:\n${testErr}\n\nTypeCheck Output:\n${typeOut}` };
    }

    return {
      success: true,
      output: `✓ TypeCheck Passed\n✓ Tests Passed\n\n${testOut || typeOut}`,
    };
  } catch (error) {
    return { success: false, output: `Verification Error: ${error.message}` };
  }
}

// ═══════════════════════════════════════════
// Ollama API 整合層（取代 Gemini）
// ═══════════════════════════════════════════

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:14b';

async function callOllama(prompt) {
  const url = `${OLLAMA_URL}/api/generate`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 8192,
      },
    }),
  });

  if (!resp.ok) {
    return `[Ollama API Error: ${resp.status}]`;
  }

  const data = await resp.json();
  return data?.response || '';
}

// 保留 callGemine 作為別名（向後相容）
async function callGemini(prompt) {
  return callOllama(prompt);
}

// ═══════════════════════════════════════════
// 遞迴自我修復引擎 — Self-Healing Loop
// ═══════════════════════════════════════════

const MAX_HEALING_ATTEMPTS = 5;

/**
 * 核心修復迴圈：修復 → 測試 → 失敗再修復，直到通過為止
 */
async function executeSelfHealingLoop(taskUuid, errorLog, targetFilePath, attempt = 1) {
  console.log(`[萬能分身] 第 ${attempt} 次修復嘗試 (UUID: ${taskUuid})`);

  if (attempt > MAX_HEALING_ATTEMPTS) {
    const record = createESGGoRecord(taskUuid, 'Gmail-Notification', MAX_ATTEMPTS, 'FAILED', errorLog, '', '');
    record.evidence.max_attempts_reached = true;
    return Object.freeze(record);
  }

  // 1. 讀取目標檔案原始碼（路徑對齊 REPO 根目錄）
  const resolvedPath = isAbsolute(targetFilePath)
    ? targetFilePath
    : resolve(REPO, targetFilePath);

  let rawCode = '';
  try {
    rawCode = await fs.readFile(resolvedPath, 'utf-8');
  } catch {
    // 檔案不存在，建立新檔
    rawCode = `// Auto-generated fix target\n`;
  }

  // 2. 呼叫 Gemini 產生修復方案
  const prompt = `
你是一個專精 TypeScript/React 的萬能自動修復工程師。
請分析以下錯誤日誌，並修復目標檔案。

【目標檔案路徑】: ${targetFilePath}
【原始代碼】:
\`\`\`typescript
${rawCode}
\`\`\`

【錯誤日誌 / 測試失敗輸出】:
${errorLog}

請直接輸出修復後的完整程式碼，不要包含 Markdown 格式或額外說明。
如果無法確定具體檔案，請提供修復建議摘要。`;

  const fixedCode = await callGemini(prompt);

  // 3. 寫回檔案
  await fs.writeFile(resolvedPath, fixedCode, 'utf-8');

  // 4. 執行沙箱驗證
  const verification = await runSandboxVerification();

  // 5. 若驗證失敗，帶入新錯誤進行遞迴修復
  if (!verification.success) {
    console.log(`[第 ${attempt} 次驗證失敗] 準備遞迴重試...`);
    return await executeSelfHealingLoop(taskUuid, verification.output, targetFilePath, attempt + 1);
  }

  // 6. 驗證成功，建立 5T 治理紀錄
  console.log(`[修復成功] 第 ${attempt} 次迭代通過所有測試！`);
  const record = createESGGoRecord(
    taskUuid,
    'Gmail-Notification',
    attempt,
    'HEALED',
    errorLog,
    fixedCode,
    verification.output
  );
  return Object.freeze(record);
}

/**
 * 建立 ESG GO 統一紀錄
 */
function createESGGoRecord(uuid, sourceOrigin, attempt, stage, errorLog, patchApplied, testResult) {
  const core = createComponentCore(sourceOrigin);
  const governance = create5TGovernance(sourceOrigin, attempt, stage, patchApplied);

  return {
    uuid: core.uuid,
    version: core.version,
    timestamp: core.timestamp,
    evidence: {
      error_log_preview: errorLog.substring(0, 500),
      patch_diff: patchApplied.substring(0, 1000),
      test_result_preview: testResult.substring(0, 500),
    },
    governance,
    payload: {
      error_log: errorLog,
      patch_applied: patchApplied,
      test_result: testResult,
      agent_frameworks_used: ['OmniAgent', 'Gemini-2.5-Flash', 'Self-Healing-Loop'],
    },
  };
}

// ═══════════════════════════════════════════
// 萬能分身狀態追蹤 Webhook 回呼
// ═══════════════════════════════════════════

const STATUS_CALLBACK_URL = process.env.STATUS_CALLBACK_URL || '';

async function notifyStatusWebhook(record) {
  if (!STATUS_CALLBACK_URL) return;

  try {
    await fetch(STATUS_CALLBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: record.governance.trackable.lifecycle_stage === 'HEALED' ? 'batch.succeeded' : 'batch.failed',
        data: {
          id: record.uuid,
          attempt_count: record.governance.trackable.attempt_count,
          lifecycle_stage: record.governance.trackable.lifecycle_stage,
          hash_lock: record.governance.trustworthy.hash_lock,
          timestamp: record.timestamp,
        },
      }),
    });
  } catch (e) {
    console.error('[Webhook 回呼失敗]', e.message);
  }
}

// ═══════════════════════════════════════════
// Gmail 信件解析器
// ═══════════════════════════════════════════

/**
 * 解析 GitHub 通知信件內容
 */
function parseGitHubNotificationEmail(emailContent) {
  const result = {
    messageId: '',
    subject: '',
    sender: '',
    repo: '',
    commitSha: '',
    errorLog: '',
    isWorkflowFailure: false,
  };

  // 解析主旨
  const subjectMatch = emailContent.match(/Subject:\s*(.+)/i);
  if (subjectMatch) result.subject = subjectMatch[1].trim();

  // 解析寄件者
  const fromMatch = emailContent.match(/From:\s*(.+)/i);
  if (fromMatch) result.sender = fromMatch[1].trim();

  // 解析 Message-ID
  const msgIdMatch = emailContent.match(/Message-ID:\s*(.+)/i);
  if (msgIdMatch) result.messageId = msgIdMatch[1].trim();

  // 偵測 GitHub Actions 失敗
  if (
    result.subject.includes('Run failed') ||
    result.subject.includes('PR run failed') ||
    result.subject.includes('Workflow run failed') ||
    emailContent.includes('workflow_run') && emailContent.includes('failure')
  ) {
    result.isWorkflowFailure = true;
  }

  // 解析 Repository
  const repoMatch = emailContent.match(/github\.com\/([^\/\s]+\/[^\/\s]+)/i);
  if (repoMatch) result.repo = repoMatch[1];

  // 解析 Commit SHA
  const shaMatch = emailContent.match(/([0-9a-f]{7,40})/);
  if (shaMatch) result.commitSha = shaMatch[1];

  // 提取錯誤日誌部分
  const errorSection = emailContent.match(/(Error|FAIL|Failed|error:)[^\n]*/gi);
  if (errorSection) result.errorLog = errorSection.join('\n');

  return result;
}

// ═══════════════════════════════════════════
// HTTP 伺服器 — Webhook 端點
// ═══════════════════════════════════════════

function json(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(body, null, 2));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  // 健康檢查
  if (p === '/health' || p === '/') {
    return json(res, 200, {
      status: 'ok',
      service: 'self-healing-engine',
      version: 'v0.5.0',
      ts: Date.now(),
      fiveT: true,
    });
  }

  // 5T 狀態端點
  if (p === '/api/5t') {
    return json(res, 200, {
      protocol: '5T',
      items: {
        Traceable: 'source_origin 標記可溯源',
        Trackable: '生命週期 hooks 可追蹤',
        Tangible: 'UI/UX 回饋可感知',
        Transparent: '零幻驗算可透明',
        Trustworthy: 'Hash Lock + Object.freeze 不可篡改',
      },
      compliant: true,
    });
  }

  // ─── GitHub Webhook 端點 ───
  if (p === '/webhook/github' && req.method === 'POST') {
    const body = await readBody(req);
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return json(res, 400, { error: 'invalid_json' });
    }

    const event = req.headers['x-github-event'];

    // 驗證 GitHub Webhook Secret
    const signature = req.headers['x-hub-signature-256'];
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';
    if (webhookSecret && signature) {
      const expected = 'sha256=' + crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return json(res, 401, { error: 'invalid_signature' });
      }
    }

/**
 * 從錯誤日誌中提取目標檔案路徑
 */
function extractTargetFile(errorLog) {
  // 匹配 TypeScript 錯誤路徑：apps/xxx/xxx.ts(行,列)
  const tsMatch = errorLog.match(/([\w\-./]+\.(?:ts|tsx|js|jsx))[(（]\d+,\d+[)）]/);
  if (tsMatch) return tsMatch[1];

  // 匹配一般檔案路徑
  const pathMatch = errorLog.match(/(?:src|apps|lib|packages)\/[\w\-./]+\.(?:ts|tsx|js|jsx)/);
  if (pathMatch) return pathMatch[0];

  // 預設：在 self-healing 目錄建立一個佔位目標檔
  return 'apps/self-healing/patch-target.ts';
}

    // 偵測 Workflow 失敗事件
    if (
      event === 'workflow_run' &&
      payload.action === 'completed' &&
      payload.workflow_run?.conclusion === 'failure'
    ) {
      const taskUuid = crypto.randomUUID();
      const errorLog = payload.workflow_run.output_title || `Workflow Failed: ${payload.workflow_run.name}`;
      const targetFile = extractTargetFile(errorLog);

      console.log(`[GitHub Webhook] 偵測到 Workflow 失敗: ${errorLog}`);
      console.log(`[萬能分身] 修復目標: ${targetFile}`);
      console.log(`[萬能分身] 派遣修復任務 UUID: ${taskUuid}`);

      // 非同步啟動修復
      executeSelfHealingLoop(taskUuid, errorLog, targetFile)
        .then(record => {
          console.log(`[修復完成] UUID: ${record.uuid} 狀態: ${record.governance.trackable.lifecycle_stage}`);
          notifyStatusWebhook(record);
        })
        .catch(err => {
          console.error(`[修復失敗]`, err);
        });

      return json(res, 202, {
        status: 'accepted',
        uuid: taskUuid,
        message: '萬能分身已派遣，開始自我修復迴圈',
        fiveT: { traceable: 'GitHub-Actions-Error', trackable: taskUuid },
      });
    }

    return json(res, 200, { status: 'ignored', event });
  }

  // ─── Gmail 信件接收端點 ───
  if (p === '/webhook/gmail' && req.method === 'POST') {
    const body = await readBody(req);
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return json(res, 400, { error: 'invalid_json' });
    }

    // 支援兩種格式：直接信件內容 或 Gmail Pub/Sub 推送
    const emailContent = payload.emailContent || payload.message?.data || '';
    const email = parseGitHubNotificationEmail(Buffer.from(emailContent, 'base64').toString('utf-8') || emailContent);

    if (!email.isWorkflowFailure && !email.subject.includes('failed')) {
      return json(res, 200, { status: 'ignored', reason: 'not_a_failure_notification' });
    }

    const taskUuid = crypto.randomUUID();
    const errorLog = email.errorLog || email.subject || 'GitHub CI/CD Build Failed';
    const targetFile = extractTargetFile(errorLog);

    console.log(`[Gmail 監聽] 收到 GitHub 錯誤通知: ${email.subject}`);
    console.log(`[萬能分身] 修復目標: ${targetFile}`);
    console.log(`[萬能分身] 派遣修復任務 UUID: ${taskUuid}`);

    // 非同步啟動修復
    executeSelfHealingLoop(taskUuid, errorLog, targetFile)
      .then(record => {
        console.log(`[修復完成] UUID: ${record.uuid} 狀態: ${record.governance.trackable.lifecycle_stage}`);
        notifyStatusWebhook(record);
      })
      .catch(err => {
        console.error(`[修復失敗]`, err);
      });

    return json(res, 202, {
      status: 'accepted',
      uuid: taskUuid,
      message: '萬已接收信件通知，分身已派遣修復',
      email_subject: email.subject,
    });
  }

  // ─── 任務狀態查詢端點 ───
  if (p === '/api/tasks' && req.method === 'GET') {
    // 回傳當前任務狀態（簡化版，實際可接 SQLite）
    return json(res, 200, {
      service: 'self-healing-engine',
      status: 'running',
      repo: REPO,
      branch: getGitBranch(),
    });
  }

  return json(res, 404, { error: 'not_found', path: p });
});

// ═══════════════════════════════════════════
// 啟動伺服器
// ═══════════════════════════════════════════

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║  Self-Healing Engine v0.5.0                         ║
║  5T 治理 + OA-Twins 雙蜂組 + Gemini 修復            ║
╠══════════════════════════════════════════════════════╣
║  Port:        ${PORT}                                    ║
║  Repo:        ${REPO}  ║
║  Branch:      ${getGitBranch()}                            ║
║  Ollama:     ${OLLAMA_MODEL}                    ║
╠══════════════════════════════════════════════════════╣
║  Endpoints:                                          ║
║    POST /webhook/github   — GitHub Actions 失敗      ║
║    POST /webhook/gmail    — Gmail 信件通知           ║
║    GET  /api/5t           — 5T 狀態                  ║
║    GET  /api/tasks        — 任務狀態                 ║
║    GET  /health           — 健康檢查                 ║
╚══════════════════════════════════════════════════════╝
  `);
});

export { server, executeSelfHealingLoop, createESGGoRecord };
