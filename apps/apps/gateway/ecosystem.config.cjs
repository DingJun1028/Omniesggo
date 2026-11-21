module.exports = {
  apps: [
    {
      name: 'omniagent-gateway',
      cwd: __dirname,
      script: 'omni-server.mjs',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      exp_backoff_restart_delay: 100,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 8642,
        VPS_IP: process.env.VPS_IP || '161.118.248.180',
      },
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      merge_logs: true,
    },
  ],
};
