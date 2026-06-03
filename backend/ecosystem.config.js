module.exports = {
  apps: [
    {
      name: 'gotagota-api',
      script: './dist/server.js',
      instances: 1,          // Single instance (Socket.IO sin Redis adapter)
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        TZ: 'America/Bogota',
      },
      // ─── Logging ────────────────────────────────────────────
      error_file: '/var/log/gotagota/pm2-error.log',
      out_file: '/var/log/gotagota/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // ─── Restart ────────────────────────────────────────────
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      // ─── Graceful shutdown ───────────────────────────────────
      kill_timeout: 5000,
      listen_timeout: 8000,
      // ─── Cron para logs ──────────────────────────────────────
      cron_restart: '0 4 * * *', // Restart diario a las 4am
    },
  ],
};
