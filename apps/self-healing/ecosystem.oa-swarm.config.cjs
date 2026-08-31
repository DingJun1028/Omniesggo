module.exports = {
  apps: [
    {
      name: 'oa-swarm',
      script: 'dist/index.js',
      cwd: '/var/www/esggo/apps/oa-swarm',
      env: {
        NODE_ENV: 'production',
        PORT: 8800,
      },
      max_memory_restart: '512M',
      restart_delay: 5000,
    },
  ],
};
