// PM2 Configuration for Production Clustering
// This enables the backend to run multiple instances for better performance

module.exports = {
  apps: [
    {
      name: "orgobloom-backend",
      script: "./dist/server.js",

      // Cluster mode - use all available CPU cores
      instances: "max",
      exec_mode: "cluster",

      // Auto-restart on crash
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      // Environment variables
      env: {
        NODE_ENV: "development",
        PORT: 8000,
      },

      env_production: {
        NODE_ENV: "production",
        PORT: 8000,
      },

      // Logging
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,

      // Auto-restart on memory limit
      min_uptime: "10s",
      max_restarts: 10,

      // Cron restart (restart at 3 AM daily)
      cron_restart: "0 3 * * *",
    },
  ],
};
