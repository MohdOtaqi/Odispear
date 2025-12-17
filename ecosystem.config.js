module.exports = {
  apps: [
    {
      name: "unity-backend",
      script: "./backend/dist/index.js",
      cwd: "/var/www/Odispear/unity-platform",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_file: "./logs/backend-combined.log",
      time: true,
      merge_logs: true
    },
    {
      name: "unity-frontend",
      script: "npx",
      args: "serve -s frontend/dist -p 5173",
      cwd: "/var/www/Odispear/unity-platform",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_file: "./logs/frontend-combined.log",
      time: true,
      merge_logs: true
    }
  ]
};
