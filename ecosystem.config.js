module.exports = {
  apps: [
    {
      name: 'life-tracker-backend',
      script: 'dist/main.js',
      cwd: 'backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        ENV: 'production',
        PORT: 3020,
      },
      env_development: {
        NODE_ENV: 'development',
        ENV: 'development',
        PORT: 3020,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
