#!/bin/bash

# Vestix ERP - Script de Actualización
# Usa este script para desplegar nuevos cambios sin reinstalar todo.

set -e

echo "======================================================"
echo "  Iniciando Actualización de Vestix ERP"
echo "======================================================"
echo ""

APP_DIR="/var/www/vestix"

# 1. Descargar últimos cambios
echo ">>> [1/5] Descargando últimos cambios desde GitHub..."
cd $APP_DIR
git fetch origin
git reset --hard origin/main

# 2. Actualizar y compilar Backend
echo ">>> [2/5] Actualizando Backend..."
cd $APP_DIR/backend
# Limpieza profunda para evitar corrupción de symlinks y webassembly de Prisma
rm -rf node_modules
npm install --unsafe-perm
npx prisma generate
npx prisma db push --accept-data-loss
npm run build

# 3. Actualizar y compilar Frontend
echo ">>> [3/5] Actualizando Frontend..."
cd $APP_DIR/frontend
npm install --unsafe-perm
npm run build

# 4. Reiniciar servidor Backend
echo ">>> [4/5] Reiniciando servicios (PM2)..."
cd $APP_DIR/backend
pm2 restart vestix-backend

echo ""
echo "======================================================"
echo "  ✅ ¡Actualización Completada con Éxito!"
echo "======================================================"
echo "Los últimos cambios ya están online."
