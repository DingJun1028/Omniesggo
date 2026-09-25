module.exports = {
  apps: [
    {
      name: "esggo-core",
      script: "npm",
      args: "run start",
      cwd: "/var/www/esggo",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        GROQ_API_KEY: process.env.GROQ_API_KEY || "",
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/esggo-error.log",
      out_file: "/var/log/pm2/esggo-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10
    },
    {
      name: "omniagent-gateway",
      script: "node",
      args: "omni-server.mjs",
      cwd: "/var/www/esggo/vps",
      env: {
        NODE_ENV: "production",
        PORT: "8642",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
        GATEWAY_API_KEY: process.env.GATEWAY_API_KEY || ""
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      error_file: "/var/log/pm2/omni-error.log",
      out_file: "/var/log/pm2/omni-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5
    },
    {
      name: "vps-agent",
      script: "node",
      args: "agent-bootstrap.mjs",
      cwd: "/var/www/esggo/vps",
      env: {
        NODE_ENV: "production",
        GATEWAY_URL: process.env.GATEWAY_URL || "http://localhost:8642",
        GATEWAY_TOKEN: process.env.GATEWAY_API_KEY || "",
        GATEWAY_API_KEY: process.env.GATEWAY_API_KEY || "",
        HEALTH_INTERVAL: process.env.HEALTH_INTERVAL || "30000",
        POLL_INTERVAL: process.env.POLL_INTERVAL || "5000"
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "256M",
      error_file: "/var/log/pm2/vps-agent-error.log",
      out_file: "/var/log/pm2/vps-agent-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10
    },
    {
      name: "ftg-journey-server",
      script: "server.js",
      cwd: "/var/www/ftg-journey-server",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "8787",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
        JWT_SECRET: process.env.JWT_SECRET || "",
        DB_PATH: "/var/www/ftg-journey-server/ftg-journey.db",
        UPLOAD_DIR: "/var/www/ftg-journey-web/uploads/",
        ADMIN_EMAILS: "dingjunhong1028@gmail.com",
        STAFF_DOMAINS: "@esggo.co,@ftg.com.tw"
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      error_file: "/var/log/pm2/ftg-journey-error.log",
      out_file: "/var/log/pm2/ftg-journey-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10
    }
  ]
};
