module.exports = {
  apps: [
    {
      name: 'ud-frontend',
      script: './node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/ud-webiste/ud-c',
      // Two workers on a 4-vCPU box that also hosts MySQL and the API.
      // One worker meant every restart was a gap in service with nothing
      // behind it; the second also uses cores that were sitting idle.
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
