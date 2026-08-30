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
        WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
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
        GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || '',
      },
      max_memory_restart: '256M',
      restart_delay: 10000,
    },
  ],
};
