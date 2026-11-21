#!/usr/bin/env node
/**
 * OmniGate 24/7 Auto-Reconnect Gateway Wrapper
 * 
 * This wrapper runs the OmniAgent Gateway with:
 * - Automatic restart on crash
 * - Health checks with auto-recovery
 * - Telegram error notifications
 * - Exponential backoff restart strategy
 * - Graceful shutdown handling
 */

import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  gatewayPort: parseInt(process.env.PORT || '8642'),
  healthCheckInterval: 30000,      // 30 seconds
  maxRestarts: 10,                  // Max restarts per hour
  restartWindow: 3600000,           // 1 hour window
  initialBackoff: 1000,             // 1 second
  maxBackoff: 60000,                // 60 seconds
  backoffMultiplier: 2,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  gatewayScript: join(__dirname, 'omni-server.mjs'),
  logFile: join(__dirname, 'logs', 'gateway-wrapper.log'),
};

// State
let gatewayProcess: ChildProcess | null = null;
let restartCount = 0;
let lastRestartTime = Date.now();
let currentBackoff = CONFIG.initialBackoff;
let isShuttingDown = false;
let healthCheckTimer: NodeJS.Timeout | null = null;

// Ensure log directory exists
import { mkdirSync, appendFileSync, existsSync } from 'fs';
const logDir = join(__dirname, 'logs');
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [OmniGate-Wrapper] ${message}\n`;
  console.log(logMessage.trim());
  appendFileSync(CONFIG.logFile, logMessage);
}

function logError(message: string, error?: Error) {
  const timestamp = new Date().toISOString();
  const errorMessage = error ? `${message}: ${error.message}\n${error.stack}` : message;
  const logMessage = `[${timestamp}] [OmniGate-Wrapper] ERROR: ${errorMessage}\n`;
  console.error(logMessage.trim());
  appendFileSync(CONFIG.logFile, logMessage);
}

// Send Telegram notification
async function sendTelegram(message: string): Promise<void> {
  if (!CONFIG.telegramBotToken || !CONFIG.telegramChatId) {
    return;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${CONFIG.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.telegramChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    
    if (!response.ok) {
      logError(`Telegram API error: ${response.status} ${await response.text()}`);
    }
  } catch (err) {
    logError('Failed to send Telegram notification', err as Error);
  }
}

// Check gateway health
async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`http://127.0.0.1:${CONFIG.gatewayPort}/health`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

// Get gateway status details
async function getGatewayStatus(): Promise<any> {
  try {
    const response = await fetch(`http://127.0.0.1:${CONFIG.gatewayPort}/status`, {
      signal: AbortSignal.timeout(5000),
    });
    return await response.json();
  } catch {
    return null;
  }
}

// Start the gateway process
function startGateway(): ChildProcess {
  log(`Starting OmniAgent Gateway on port ${CONFIG.gatewayPort}...`);
  
  const child = spawn('node', [CONFIG.gatewayScript], {
    cwd: __dirname,
    env: { ...process.env },
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  
  child.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[Gateway] ${output}`);
      appendFileSync(CONFIG.logFile, `[${new Date().toISOString()}] [Gateway] ${output}\n`);
    }
  });
  
  child.stderr?.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(`[Gateway-ERR] ${output}`);
      appendFileSync(CONFIG.logFile, `[${new Date().toISOString()}] [Gateway-ERR] ${output}\n`);
    }
  });
  
  child.on('exit', (code, signal) => {
    log(`Gateway process exited with code ${code}, signal ${signal}`);
    gatewayProcess = null;
    
    if (!isShuttingDown) {
      scheduleRestart(code === 0 ? 'clean exit' : `code ${code}`);
    }
  });
  
  child.on('error', (err) => {
    logError('Failed to start gateway process', err);
    if (!isShuttingDown) {
      scheduleRestart('start error');
    }
  });
  
  return child;
}

// Schedule restart with exponential backoff
function scheduleRestart(reason: string) {
  const now = Date.now();
  
  // Reset restart count if outside the window
  if (now - lastRestartTime > CONFIG.restartWindow) {
    restartCount = 0;
    currentBackoff = CONFIG.initialBackoff;
  }
  
  if (restartCount >= CONFIG.maxRestarts) {
    logError(`Max restarts (${CONFIG.maxRestarts}) reached in 1 hour. Stopping.`);
    sendTelegram(`🚨 *OmniGate Critical*\nMax restarts reached. Gateway stopped.\nReason: ${reason}\nTime: ${new Date().toISOString()}`);
    process.exit(1);
  }
  
  restartCount++;
  lastRestartTime = now;
  
  log(`Scheduling restart #${restartCount}/${CONFIG.maxRestarts} in ${currentBackoff}ms (reason: ${reason})`);
  
  sendTelegram(`⚠️ *OmniGate Restart*\nRestart #${restartCount}/${CONFIG.maxRestarts}\nReason: ${reason}\nBackoff: ${currentBackoff}ms\nTime: ${new Date().toISOString()}`);
  
  setTimeout(() => {
    if (!isShuttingDown) {
      gatewayProcess = startGateway();
      currentBackoff = Math.min(currentBackoff * CONFIG.backoffMultiplier, CONFIG.maxBackoff);
    }
  }, currentBackoff);
}

// Health check loop
async function healthCheckLoop() {
  while (!isShuttingDown) {
    await new Promise(resolve => setTimeout(resolve, CONFIG.healthCheckInterval));
    
    if (isShuttingDown) break;
    
    const healthy = await checkHealth();
    
    if (!healthy) {
      logError('Health check failed - gateway unresponsive');
      const status = await getGatewayStatus();
      
      sendTelegram(`🔴 *OmniGate Health Check Failed*\nGateway unresponsive on port ${CONFIG.gatewayPort}\nStatus: ${status ? 'reachable but unhealthy' : 'unreachable'}\nTime: ${new Date().toISOString()}\nRestarting...`);
      
      // Force restart
      if (gatewayProcess) {
        gatewayProcess.kill('SIGTERM');
        setTimeout(() => {
          if (gatewayProcess && !gatewayProcess.killed) {
            gatewayProcess.kill('SIGKILL');
          }
        }, 5000);
      }
    } else {
      // Reset backoff on successful health check
      if (currentBackoff > CONFIG.initialBackoff) {
        currentBackoff = CONFIG.initialBackoff;
        log('Health check passed - backoff reset');
      }
    }
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  log(`Received ${signal}, shutting down gracefully...`);
  isShuttingDown = true;
  
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
  }
  
  sendTelegram(`🛑 *OmniGate Shutdown*\nSignal: ${signal}\nTime: ${new Date().toISOString()}\nUptime: ${Math.floor((Date.now() - startTime) / 1000)}s`);
  
  if (gatewayProcess) {
    log('Terminating gateway process...');
    gatewayProcess.kill('SIGTERM');
    
    // Wait for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (!gatewayProcess.killed) {
      log('Force killing gateway process...');
      gatewayProcess.kill('SIGKILL');
    }
  }
  
  log('Shutdown complete');
  process.exit(0);
}

// Start wrapper
const startTime = Date.now();

log('═══════════════════════════════════════════════════════');
log('🚀 OmniGate 24/7 Wrapper Starting');
log(`   Gateway Port: ${CONFIG.gatewayPort}`);
log(`   Health Check: Every ${CONFIG.healthCheckInterval / 1000}s`);
log(`   Max Restarts: ${CONFIG.maxRestarts} per hour`);
log(`   Telegram: ${CONFIG.telegramBotToken ? '✅ Configured' : '❌ Not configured'}`);
log('═══════════════════════════════════════════════════════');

sendTelegram(`🟢 *OmniGate Started*\nWrapper v1.0.0\nPort: ${CONFIG.gatewayPort}\nTime: ${new Date().toISOString()}`);

// Start gateway
gatewayProcess = startGateway();

// Start health check loop
healthCheckLoop().catch(err => logError('Health check loop error', err));

// Signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logError('Uncaught exception in wrapper', err);
  sendTelegram(`💥 *OmniGate Wrapper Crash*\n${err.message}\n${err.stack?.slice(0, 500)}`);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  logError('Unhandled rejection in wrapper', new Error(String(reason)));
});

log('Wrapper initialized. Gateway starting...');