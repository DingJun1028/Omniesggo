module.exports = {
  apps: [
    {
      name: 'esggo-core',
      cwd: '/var/www/esggo',
      script: 'pnpm',
      args: 'run start',
      env: { NODE_ENV: 'production', PORT: '3000' },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      watch: false,
      delete_process_data: true,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s'
    },
    {
      name: 'omniagent-gateway',
      cwd: '/var/www/esggo/vps',
      script: 'node',
      args: 'omni-server.mjs',
      env: { NODE_ENV: 'production', PORT: '8642' },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      watch: false,
      delete_process_data: true,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    },
    {
      name: 'vps-agent',
      cwd: '/var/www/esggo/vps',
      script: 'node',
      args: 'agent-bootstrap.mjs',
      env: { NODE_ENV: 'production' },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '256M',
      watch: false,
      delete_process_data: true,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    },
    {
      name: 'ftg-journey-server',
      script: 'server.js',
      cwd: '/var/www/ftg-journey-server',
      interpreter: 'node',
      env: { NODE_ENV: 'production', PORT: '8787' },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      watch: false,
      delete_process_data: true,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
};
