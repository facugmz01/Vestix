#!/bin/bash

# Vestix ERP - Script de Actualización
# Usa este script para desplegar nuevos cambios sin reinstalar todo.

set -e

echo "======================================================"
echo "  Iniciando Actualización de Vestix ERP"
echo "======================================================"
echo ""

APP_DIR="/var/www/vestix"

# 1. Resguardar archivos de entorno
echo ">>> [1/6] Resguardando configuración local (.env)..."
cp $APP_DIR/backend/.env /tmp/vestix_backend_env.bak 2>/dev/null || true
cp $APP_DIR/frontend/.env.production /tmp/vestix_frontend_env.bak 2>/dev/null || true

# 2. Descargar últimos cambios
echo ">>> [2/6] Descargando últimos cambios desde GitHub..."
cd $APP_DIR
git fetch origin
git reset --hard origin/main

# 3. Restaurar archivos de entorno
echo ">>> [3/6] Restaurando configuración local..."
mv /tmp/vestix_backend_env.bak $APP_DIR/backend/.env 2>/dev/null || true
mv /tmp/vestix_frontend_env.bak $APP_DIR/frontend/.env.production 2>/dev/null || true

# 4. Actualizar y compilar Backend
echo ">>> [4/6] Actualizando Backend..."
cd $APP_DIR/backend
# Limpieza profunda para evitar corrupción de symlinks y webassembly de Prisma
rm -rf node_modules
npm install --unsafe-perm
npx prisma generate
npx prisma db push
# Clear stale TS incremental cache — nest deleteOutDir + incremental can emit an empty dist
rm -rf dist tsconfig.tsbuildinfo
npm run build
if [ ! -f dist/main.js ]; then
  echo "ERROR: backend build did not produce dist/main.js" >&2
  exit 1
fi

# 5. Actualizar y compilar Frontend
echo ">>> [5/6] Actualizando Frontend..."
cd $APP_DIR/frontend
rm -rf node_modules
npm install --unsafe-perm
chmod -R +x node_modules/.bin || true
npm run build

# 6. Reiniciar servidor Backend
echo ">>> [6/6] Reiniciando servicios (PM2)..."
cd $APP_DIR/backend
pm2 restart vestix-backend

echo ""
echo "======================================================"
echo "  ✅ ¡Actualización Completada con Éxito!"
echo "======================================================"
echo "Los últimos cambios ya están online."
