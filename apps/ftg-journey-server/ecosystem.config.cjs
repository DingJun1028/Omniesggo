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
        JWT_SECRET: 'e2e2f887bf4ffdbb05a4f48144e545a82c3c1c0018df1de23de939c850e5cfafc68fa5dc0cbb90d409abca146e39a39bdaae319a98ff271024b474d14eb5a59b',
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
