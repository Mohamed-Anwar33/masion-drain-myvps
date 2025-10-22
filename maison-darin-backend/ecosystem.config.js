module.exports = {
  apps: [
    {
      name: 'maison-darin-api',
      script: 'server.js',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      pmx: true,
      
      // Advanced features
      watch: process.env.NODE_ENV !== 'production',
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        'logs',
        'tests',
        '.git'
      ],
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      
      // Environment specific settings
      node_args: process.env.NODE_ENV === 'production' ? '--max-old-space-size=2048' : '',
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Cron restart (daily at 2 AM in production)
      cron_restart: process.env.NODE_ENV === 'production' ? '0 2 * * *' : undefined,
      
      // Source map support
      source_map_support: true,
      
      // Merge logs
      merge_logs: true,
      
      // Time zone
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/maison-darin-backend.git',
      path: '/var/www/maison-darin-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run seed && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/maison-darin-backend.git',
      path: '/var/www/maison-darin-backend-staging',
      'post-deploy': 'npm install && npm run seed && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
        PORT: 5001
      }
    }
  }
};