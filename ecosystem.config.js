module.exports = {
  apps: [
    {
      name: "xeno-frontend",
      script: "npm",
      args: "run start:web",
      cwd: "./",
      watch: false,
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: "postgresql://xeno:xenosecretpassword@localhost:5432/xenocrm?sslmode=disable",
        CHANNEL_SERVICE_URL: "http://localhost:3001",
        CRM_RECEIPT_URL: "http://localhost:3000/api/receipts"
      }
    },
    {
      name: "xeno-backend",
      script: "node",
      script: "apps/channel-service/dist/index.js",
      cwd: "./",
      watch: false,
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        DATABASE_URL: "postgresql://xeno:xenosecretpassword@localhost:5432/xenocrm?sslmode=disable"
      }
    }
  ]
};
