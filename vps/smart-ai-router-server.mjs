/**
 * Smart AI Router — HTTP Server (Zero-Dependency)
 * 將 SmartAIRouter 包裝為 Node.js 內建 http 服務
 * 
 * 5T-Traceable: source_origin=C:/Project/esggo/vps/smart-ai-router.mjs
 * 5T-Trackable: 所有請求記錄 timestamp + provider
 * 5T-Tangible: REST API 即時回應
 * 5T-Transparent: 端點邏輯公開
 * 5T-Trustworthy: API keys 只從 vault 讀取
 */

import { createServer } from 'http';
import { SmartAIRouter } from './smart-ai-router.mjs';

// ── Config ──────────────────────────────────────────────────

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// ── Router ─────────────────────────────────────────────────

const router = new SmartAIRouter().init();

// ── HTTP Helpers ───────────────────────────────────────────

function sendJSON(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// ── HTTP Server ────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }
  
  try {
    // GET /health
    if (req.method === 'GET' && path === '/health') {
      const health = await router.healthCheck();
      return sendJSON(res, 200, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        providers: health,
      });
    }
    
    // POST /chat
    if (req.method === 'POST' && path === '/chat') {
      const body = await readBody(req);
      const { messages, provider, model, maxTokens, temperature } = body;
      
      if (!messages || !Array.isArray(messages)) {
        return sendJSON(res, 400, {
          error: 'messages is required and must be an array',
        });
      }
      
      const options = {};
      if (provider) options.provider = provider;
      if (model) options.model = model;
      if (maxTokens) options.maxTokens = maxTokens;
      if (temperature) options.temperature = temperature;
      
      const result = await router.chat(messages, options);
      
      return sendJSON(res, 200, {
        ...result,
        timestamp: new Date().toISOString(),
      });
    }
    
    // GET /stats
    if (req.method === 'GET' && path === '/stats') {
      const stats = router.getStats();
      return sendJSON(res, 200, {
        ...stats,
        timestamp: new Date().toISOString(),
      });
    }
    
    // GET /
    if (req.method === 'GET' && path === '/') {
      return sendJSON(res, 200, {
        name: 'Smart AI Router',
        version: '2.0.0-beta.2',
        description: '免費模組自動轉換路由器',
        endpoints: {
          'GET /health': '健康檢查',
          'POST /chat': 'Chat completion（自動路由）',
          'GET /stats': '統計資訊',
        },
        providers: ['nvidia', 'gemini'],
        timestamp: new Date().toISOString(),
      });
    }
    
    // 404
    sendJSON(res, 404, {
      error: 'Not found',
      endpoints: ['GET /health', 'POST /chat', 'GET /stats', 'GET /'],
    });
    
  } catch (error) {
    sendJSON(res, 500, {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ── Start Server ───────────────────────────────────────────

server.listen(PORT, HOST, () => {
  console.log(`[Smart AI Router] Server running at http://${HOST}:${PORT}`);
  console.log(`[Smart AI Router] Providers: nvidia → gemini`);
});

// ── Graceful Shutdown ──────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[Smart AI Router] SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Smart AI Router] SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});
