module.exports = {
  apps: [{
    name: 'futures-baccarat-board',
    script: 'app.py',
    interpreter: '/opt/futures-baccarat-board/venv/bin/python',
    cwd: '/opt/futures-baccarat-board',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      PORT: 7777,
      FLASK_DEBUG: 'false',
      BACCARAT_LIMIT: '100',
      SECRET_KEY: 'CHANGE_THIS_TO_RANDOM_STRING'
    },
    error_file: '/var/log/pm2/futures-baccarat-board-error.log',
    out_file: '/var/log/pm2/futures-baccarat-board-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
