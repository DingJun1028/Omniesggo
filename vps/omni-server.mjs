import express from 'express';
import cors from 'cors';
import { gatewayKey, audit, summary, isSummoned, summonRitual } from './omni-master-key.mjs';

const app = express();
const port = Number(process.env.PORT ?? 8642);

// Trust first proxy (Cloudflare → VPS), required for express-rate-limit
// to correctly read X-Forwarded-For for client IP identification.
app.set('trust proxy', 1);

// 由 OmniMasterKey 模組統一解析：優先 OMNI_KEY，向後相容 GATEWAY_API_KEY / GATEWAY_KEY
const GATEWAY_KEY = gatewayKey();
if (!GATEWAY_KEY) {
  console.warn(
    '[OmniGateway] WARNING: GATEWAY_KEY (OMNI_KEY / GATEWAY_API_KEY) is not set; gateway requests may be unauthorized or fail.',
  );
}

// OmniMasterKey 金鑰庫稽核：啟動時列出缺少的必要密鑰（僅輸出名稱，不輸出密鑰值本身）
const vaultAudit = audit();
if (!vaultAudit.ok) {
  console.warn(`[OmniMasterKey] Missing required secrets: ${vaultAudit.missing.join(', ')}`);
} else {
  console.log('[OmniMasterKey] All required secrets present; vault audit passed.');
}

app.use(cors());
app.use(express.json());

const genId = (prefix) => `${prefix}_vps_${Date.now()}`;

// ==========================================
// VPS Agent Cooperation Hub
// ==========================================
const agents = new Map();

function registerAgent({ agentId, name, host, channel, capabilities }) {
  const now = Date.now();
  const existing = agents.get(agentId);
  const agent = {
    agentId,
    name: name || agentId,
    host: host || 'unknown',
    channel: channel || 'direct',
    capabilities: capabilities || [],
    status: 'online',
    registeredAt: existing?.registeredAt || now,
    lastHeartbeat: now,
    commands: existing?.commands || [],
  };
  agents.set(agentId, agent);
  return agent;
}

function heartbeatAgent(agentId, payload = {}) {
  const agent = agents.get(agentId);
  if (!agent) return null;
  agent.status = 'online';
  agent.lastHeartbeat = Date.now();
  if (payload.host) agent.host = payload.host;
  if (payload.channel) agent.channel = payload.channel;
  if (Array.isArray(payload.capabilities)) agent.capabilities = payload.capabilities;
  if (payload.system) agent.system = payload.system;
  return agent;
}

function queueAgentCommand(agentId, command) {
  const agent = agents.get(agentId);
  if (!agent) return null;
  const cmd = {
    id: genId('cmd'),
    command: command.command || '',
    description: command.description || '',
    status: 'queued',
    createdAt: new Date().toISOString(),
  };
  agent.commands.push(cmd);
  if (agent.commands.length > 50) agent.commands = agent.commands.slice(-50);
  return cmd;
}

function reportAgentResult(agentId, resultId, result) {
  const agent = agents.get(agentId);
  if (!agent) return null;
  const cmd = agent.commands.find((c) => c.id === resultId);
  if (!cmd) return null;
  cmd.status = 'done';
  cmd.result = result;
  cmd.finishedAt = new Date().toISOString();
  return cmd;
}

app.get('/health', (req, res) => res.status(200).json({ status: 'healthy' }));

app.get('/status', (req, res) => {
  // Base health is public (monitoring). Agent topology is sensitive:
  // only return it when a valid gateway token is presented.
  const token = (req.headers['x-omni-token'] || req.headers['x-api-key'] || '').replace('Bearer ', '');
  const authed = !!GATEWAY_KEY && token === GATEWAY_KEY;
  const body = {
    status: 'online',
    version: '0.14.1',
    platform: 'Ubuntu 24.04 (VPS)',
    system_name: 'OmniAgent + ESG Go',
    uptime: process.uptime(),
    active_workers: 8,
    memory_usage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
  };
  if (authed) {
    body.agents = Array.from(agents.values()).map((a) => ({
      agentId: a.agentId,
      name: a.name,
      status: a.status,
      channel: a.channel,
      lastHeartbeat: a.lastHeartbeat,
    }));
  }
  res.json(body);
});

// ==========================================
// VPS Agent Cooperation API
// ==========================================
app.post('/agent/register', requireAuth, (req, res) => {
  const { agentId } = req.body || {};
  if (!agentId) return res.status(400).json({ error: 'agentId required' });
  const agent = registerAgent(req.body);
  console.log(`[OmniGateway] 🔗 Agent registered: ${agentId} (${agent.channel})`);
  res.json({ status: 'registered', agent });
});

app.post('/agent/heartbeat', requireAuth, (req, res) => {
  const { agentId } = req.body || {};
  if (!agentId) return res.status(400).json({ error: 'agentId required' });
  const agent = heartbeatAgent(agentId, req.body);
  if (!agent) return res.status(404).json({ error: 'agent not registered' });
  const pending = agent.commands.filter((c) => c.status === 'queued');
  res.json({ status: 'ok', pending });
});

app.post('/agent/command', requireAuth, (req, res) => {
  const { agentId, command } = req.body || {};
  if (!agentId) return res.status(400).json({ error: 'agentId required' });
  const cmd = queueAgentCommand(agentId, command || {});
  if (!cmd) return res.status(404).json({ error: 'agent not registered' });
  console.log(`[OmniGateway] 📨 Command queued for ${agentId}: ${cmd.command}`);
  res.json({ status: 'queued', command: cmd });
});

app.post('/agent/result', requireAuth, (req, res) => {
  const { agentId, commandId, result } = req.body || {};
  if (!agentId || !commandId) return res.status(400).json({ error: 'agentId and commandId required' });
  const cmd = reportAgentResult(agentId, commandId, result);
  if (!cmd) return res.status(404).json({ error: 'command not found' });
  res.json({ status: 'ok', command: cmd });
});

app.get('/agents', requireAuth, (req, res) => {
  res.json({ agents: Array.from(agents.values()) });
});

function requireAuth(req, res, next) {
  const token = (req.headers['x-omni-token'] || req.headers['x-api-key'] || '').replace(
    'Bearer ',
    '',
  );
  if (!GATEWAY_KEY || !token || token !== GATEWAY_KEY) {
    return res
      .status(401)
      .json({ error: 'Unauthorized: Invalid API Key', hint: 'Set X-Omni-Token header' });
  }
  next();
}

app.post('/execute', requireAuth, async (req, res) => {
  const { task } = req.body;
  console.log(`[OmniAgent VPS] Executing task: ${task.id} (${task.taskType})`);

  // In a real scenario, this would call Nous OmniAgent models.
  // For this deployment kit, we provide the logic to structure the response
  // correctly for the ESG GO dashboard.

  const execution = {
    id: genId('exec'),
    taskId: task.id,
    sessionId: genId('sess'),
    runtime: 'omniagent',
    runtimeVersion: '0.14.0',
    modelProvider: 'OmniAgent (VPS-Native)',
    modelName: 'omni-mock-template',
    triggerSource: 'user',
    status: 'draft_generated',
    inputRefIds: task.inputRefIds,
    outputRefIds: [],
    createdBy: task.actorId,
    auditLogId: genId('aud'),
    policyDecisionId: task.policyDecisionId,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mock content generation logic (Production-ready template)
  const contentMap = {
    report_drafting: `## ${task.title}\n\n根據 GRI 2021 框架與最新 ESG 趨勢分析，該章節草稿已生成。重點包含：\n- 數據邊界：全集團子公司\n- 盤查基準：2024 年度\n\n> ⚠️ 此內容由 VPS 版 OmniAgent 生成。`,
    compliance_review: `## 合規審查結果\n\n針對您的報告與歐盟 CSRD / ESRS 指標進行比對：\n- 符合度：85%\n- 缺失項：氣候變遷適應策略揭露不足。\n\n> ⚠️ 建議補強上述章節。`,
    evidence_mapping: `## 證據映射清單\n\n- [GRI 302-1] → 映射至 2024 電費總帳單 (Vault_ID: ev_992)\n- [GRI 403-1] → 映射至 工安委員會會議紀錄 (Vault_ID: ev_104)\n\n> ⚠️ 已自動索引至證據金庫。`,
    course_assistant: `## 課程 FAQ 回覆\n\n您提到的「範疇三盤查難點」，主要在於供應鏈數據的獲取頻率與精準度。建議參考 ISO 14064-1 附錄內容...\n\n> ⚠️ 此回覆由 OmniAgent 助教生成。`,
    task_planning: `## 專案執行規劃\n\n1. 啟動盤查 (W1-W2)\n2. 數據初審 (W3-W5)\n3. 報告定稿 (W6-W8)\n\n> ⚠️ 規劃已同步至任務中心。`,
    stakeholder_analysis: `## 利害關係人分析 (VPS 版)\n\n### 統計結果\n- 關注度最高：環境永續 (E)\n- 影響力最高：投資人與客戶\n\n> ⚠️ 此分析由 VPS 實時計算生成。`,
    materiality_generation: `## 重大性矩陣建議\n\n基於 342 份問卷，建議將「碳風險管理」移入第一象限。衝擊度評分為 4.9，關注度評分為 4.7。\n\n> ⚠️ 建議座標：(4.9, 4.7)`,
    cbam_validation: `## CBAM 驗證日誌\n\n- 鋼鐵稅號：7318 (✅ 符合)\n- 排放係數：1.89 (⚠️ 略高於行業平均 1.82)\n\n> ⚠️ 驗證通過，但建議校對排放源。`,
  };

  const artifact = {
    id: genId('art'),
    executionId: execution.id,
    taskId: task.id,
    artifactType: 'report_section_draft',
    title: `${task.title} (VPS)`,
    content: contentMap[task.taskType] || 'Content generated on VPS.',
    sourceRefIds: task.inputRefIds,
    reviewStatus: 'awaiting_review',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  execution.outputRefIds = [artifact.id];

  res.json({ execution, artifact });
});

// ──────────────────────────────────────────────────────────────
// oa-summon ritual — text trigger endpoint
// Any authorized caller posts { text }; if the text contains the awakened
// name "OmniAgent 萬能代理", the summon ritual runs (wakes all online agents).
// ──────────────────────────────────────────────────────────────
app.post('/invoke', requireAuth, (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== 'string' || text.length === 0) {
    return res.status(400).json({ error: 'text required' });
  }
  if (!isSummoned(text)) {
    return res.json({ summoned: false, ritual: null });
  }
  const rite = summonRitual(agents);
  console.log(`[OmniAgent] 🔮 oa-summon ritual triggered — awakened ${rite.awakenedAgents.length} agent(s)`);
  res.json({ summoned: true, ritual: rite });
});

// Bind on all interfaces INSIDE the container so that nginx (docker network) can
// reach the gateway via `omniagent-gateway:8642`. External exposure is controlled
// at the host layer: docker-compose publishes only 127.0.0.1:8642, and OCI
// security lists should NOT open 8642/tcp to 0.0.0.0/0 (see oci-launch-vps.yml).
const BIND_ADDR = process.env.GATEWAY_BIND_ADDR || '0.0.0.0';
app.listen(port, BIND_ADDR, () => {
  console.log(`OmniAgent Gateway Server running on port ${port} (bind ${BIND_ADDR})`);
});
