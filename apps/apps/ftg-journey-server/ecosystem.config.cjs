module.exports = {
  apps: [
    {
      name: 'ftg-journey-server',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PORT: 8792,
        NODE_ENV: 'production',
        // 金鑰一律由環境變數注入，不再寫在檔中（舊版把真實金鑰明文 commit 進
        // git 歷史，等同外洩）。啟動前請先備妥 JWT_SECRET 環境變數或 .env。
        JWT_SECRET: process.env.JWT_SECRET || '',
        DB_PATH: '/var/www/esggo/apps/ftg-journey-server/ftg-journey.db',
        UPLOAD_DIR: '/var/www/ftg-journey-web/uploads/',
        GOOGLE_CLIENT_ID: '',
        ADMIN_EMAILS: 'dingjunhong1028@gmail.com',
        STAFF_DOMAINS: '@esggo.co,@ftg.com.tw'
      },
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: '256M'
    }
  ]
};
