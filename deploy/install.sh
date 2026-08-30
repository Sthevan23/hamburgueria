#!/bin/bash
set -e

echo "=== Deploy Hamburgueria — sthevandev.com.br ==="

cd "$(dirname "$0")/.."

npm install --production
node server/db/seed.js 2>/dev/null || true

if command -v pm2 &> /dev/null; then
  pm2 start ecosystem.config.cjs || pm2 restart hamburgueria
  pm2 save
  echo "App rodando com PM2 na porta 3001"
else
  echo "PM2 nao encontrado. Instale: npm i -g pm2"
  echo "Ou rode: APP_URL=https://sthevandev.com.br PORT=3001 npm start"
fi

echo ""
echo "Configure o Nginx com: deploy/nginx-sthevandev.conf"
echo "Cardapio: https://sthevandev.com.br"
echo "Admin:    https://sthevandev.com.br/admin/"
