module.exports = {
  apps: [{
    name: 'edschool-backend',
    script: './backend/dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001, // Different from edumapping (port 5000)
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Automatically restart on crash
    autorestart: true,
    // Watch for file changes (disable in production)
    watch: false,
    // Max memory before restart
    max_memory_restart: '500M',
  }]
};

