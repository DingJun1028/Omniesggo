#!/usr/bin/env node
/**
 * OA-Team 30 萬能蜂群桌面背景 AI App — 入口
 * 用法:
 *   node dist/index.js            # 背景守護 (HTTP :8788)
 *   node dist/index.js --desktop  # 背景守護 + 自動開瀏覽器儀表板
 */
import { SwarmCore } from './swarm-core.js';
import { createServerApp } from './server.js';

const core = new SwarmCore();
const port = Number(process.env.PORT ?? 8788);
const { server } = createServerApp(core, port);

server.listen(port, () => {
  console.log(`🐝 OA-Team 30 萬能蜂群守護啟動: http://localhost:${port}`);
  console.log(`   矩陣: 30 蜂 / 5 陣列 | 5T 合規 | 熵減循環啟動`);
  if (process.argv.includes('--desktop')) {
    const url = `http://localhost:${port}/dashboard`;
    console.log(`   桌面模式: 開啟 ${url}`);
    // Windows / macOS / Linux 開瀏覽器 (免依賴)
    const { spawn } = require('node:child_process');
    const op = process.platform === 'win32' ? 'cmd' : 'open';
    const arg = process.platform === 'win32' ? ['/c', 'start', url] : [url];
    try { spawn(op, arg, { detached: true, stdio: 'ignore' }).unref(); } catch {}
  }
});

// 優雅關閉
process.on('SIGINT', () => { console.log('\n蜂群收工'); process.exit(0); });
process.on('SIGTERM', () => process.exit(0));
