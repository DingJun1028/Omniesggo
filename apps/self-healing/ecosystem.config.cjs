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
        OLLAMA_MODEL: 'qwen2.5:14b',
        WEBHOOK_SECRET: '4e9494902600314ac0ddebdfb3071f7b7a2bcfd0840f93353a643b057c647747',
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
      },
      max_memory_restart: '256M',
      restart_delay: 10000,
    },
  ],
};
