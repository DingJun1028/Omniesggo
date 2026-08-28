module.exports = {
  apps: [
    {
      name: 'self-healing',
      script: 'server.mjs',
      cwd: '/home/ubuntu/repos/esggo/apps/self-healing',
      env: {
        NODE_ENV: 'production',
        PORT: 8792,
        ESGRO_REPO: '/home/ubuntu/repos/esggo',
        OLLAMA_URL: 'http://127.0.0.1:11434',
        OLLAMA_MODEL: 'qwen3:8b',
        WEBHOOK_SECRET: '4e9494902600314ac0ddebdfb3071f7b7a2bcfd0840f93353a643b057c647747',
        TELEGRAM_BOT_TOKEN: '8776627849:AAHnIbWZqHsHBfREFoW0pDxCK3NRPEVhQcY',
        TELEGRAM_CHAT_ID: '6387287462',
      },
      max_memory_restart: '512M',
      restart_delay: 5000,
      max_restarts: 10,
    },
    {
      name: 'gmail-poller',
      script: 'gmail-poller.mjs',
      cwd: '/home/ubuntu/repos/esggo/apps/self-healing',
      env: {
        NODE_ENV: 'production',
        ENGINE_URL: 'http://127.0.0.1:8792',
        GMAIL_POLL_INTERVAL_MS: 60000,
        GMAIL_USER: 'dingjunhong1028@gmail.com',
        GMAIL_APP_PASSWORD: '!S1421680s1202',
      },
      max_memory_restart: '256M',
      restart_delay: 10000,
    },
  ],
};
