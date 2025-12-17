// PM2 Ecosystem Configuration
// Copy to: ~/Odispear/unity-platform/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'odispear-backend',
      cwd: '/home/ubuntu/Odispear/unity-platform/backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/home/ubuntu/logs/odispear-error.log',
      out_file: '/home/ubuntu/logs/odispear-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
