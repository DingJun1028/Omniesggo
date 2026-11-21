// ============================================================
// pm2 ecosystem — 萬能藍圖中心 (Omni-Blueprint Hub)
// 部署: pm2 start ecosystem.config.cjs && pm2 save
// env 由 monitor-server.mjs 內建 env.mjs 從同目錄 .env 載入
// ============================================================
module.exports = {
  apps: [
    {
      name: 'omni-blueprint-hub',
      script: 'monitor-server.mjs',
      cwd: __dirname,
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      min_uptime: '20s',
      restart_delay: 3000,
      max_memory_restart: '400M',
      kill_timeout: 8000,          // SSE 長連接需要時間優雅收線
      wait_ready: false,
      time: true,                  // log 加時間戳 (5T Trackable)
      merge_logs: true,
      out_file: './logs/out.log',
      error_file: './logs/err.log',
      env: {
        NODE_ENV: 'production',
        PORT: 8787
      }
    }
  ]
};
