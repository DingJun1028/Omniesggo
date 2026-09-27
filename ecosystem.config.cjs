module.exports = {
  apps: [
    {
      name: 'esggo-core',
      cwd: '/var/www/esggo',
      script: 'pnpm',
      args: 'run start',
      env: { NODE_ENV: 'production', PORT: 3000, HOSTNAME: '127.0.0.1', NEXT_TELEMETRY_DISABLED: '1' },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      merge_logs: true,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'omniagent-gateway',
      cwd: '/var/www/esggo/apps/gateway',
      script: 'omni-server.mjs',
      interpreter: 'node',
      env: { NODE_ENV: 'production', PORT: '8642' },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/gateway-error.log',
      out_file: 'logs/gateway-out.log',
      merge_logs: true,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
    },
    {
      name: 'universal-translator',
      cwd: '/var/www/esggo/apps/universal-translator',
      script: 'server.mjs',
      interpreter: 'node',
      env: { NODE_ENV: 'production', PORT: '8788', STT_PORT: '8791' },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/ut-error.log',
      out_file: 'logs/ut-out.log',
      merge_logs: true,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 5,
    },
    {
      name: 'stt-whisper',
      cwd: '/var/www/esggo/apps/stt',
      script: 'server.py',
      interpreter: '/var/www/esggo/apps/stt/.venv/bin/python3',
      env: { NODE_ENV: 'production', STT_PORT: '8791', WHISPER_MODEL: 'base', WHISPER_DEVICE: 'cpu', WHISPER_COMPUTE: 'int8' },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '2G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/stt-error.log',
      out_file: 'logs/stt-out.log',
      merge_logs: true,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
    },
    {
      name: 'deerflow',
      cwd: '/opt/deer-flow',
      script: '/var/www/esggo/vps-deploy/deerflow-watchdog.sh',
      interpreter: 'bash',
      env: { NODE_ENV: 'production' },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/www/esggo/logs/deerflow-error.log',
      out_file: '/var/www/esggo/logs/deerflow-out.log',
      merge_logs: true,
      autorestart: true,
      restart_delay: 10000,
      max_restarts: 10,
    },
    // ── ftg-journey-server 刻意不列入本部署生態檔（2026-09-27）─────────
    // 移除原因：本檔由 .github/workflows/deploy-oracle.yml 的
    // `pm2 start ecosystem.config.cjs` 執行，而部署管線只把倉庫同步到
    // /var/www/esggo，從不建立 /var/www/ftg-journey-server。條目指向該
    // 不存在路徑 → `Script not found` → set -e 下整個部署紅燈（run 36307022638）。
    //
    // 這不是改個路徑就能解決：server.js 對 JWT_SECRET fail-fast，而
    // JWT_SECRET / GOOGLE_CLIENT_ID 不在 GitHub secrets（56 個 secret 中無
    // 此兩項），CI 無法注入。只修路徑會得到「部署綠、服務卻 crash-loop」
    // 的假完成 —— 與 5T Transparent 相違。
    //
    // 管理歸屬：FTG Journey Server 由本機 Windows 的
    // apps/ftg-journey-server/ecosystem.config.cjs 管理（見 03cac4c34 的決策）。
    // 注意：同目錄舊有的 ecosystem.config.js 已刪除 —— 該檔把 JWT_SECRET 硬寫在
    // 原始碼中，且 repo 為 public，憑證已進 git 歷史（見 7a1365dc7）。
    // 該金鑰必須視為已外洩並輪換；刪檔不等於清除歷史。
    // 要讓它上 VPS，須同時補齊：
    //   (1) JWT_SECRET / GOOGLE_CLIENT_ID 進 GitHub secrets 並在部署時注入
    //   (2) 此條目重新加入，且 cwd 改為 /var/www/esggo/apps/ftg-journey-server
    //   (3) 部署後健康檢查納入 :8787
    // 注意：nginx.conf 有 proxy_pass → ftg-journey-server:8787，該路由目前
    // 已是死路由（服務從未在 VPS 上部署過），移除條目不會使其更糟。
  ],
};
