module.exports = {
  apps: [
    {
      name: "hamburgueria",
      script: "server/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        APP_URL: "https://sthevandev.com.br",
        JWT_SECRET: "troque-esta-chave-em-producao-agora",
      },
    },
  ],
};
