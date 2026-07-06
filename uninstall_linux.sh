#!/bin/bash

# Vestix ERP - Script de Desinstalación y Limpieza
# Este script revertirá los cambios realizados por deploy_linux.sh
# ¡ADVERTENCIA! Esto borrará la base de datos de producción y todo el código fuente.

set -e

echo "======================================================"
echo "  Iniciando Limpieza Completa de Vestix ERP"
echo "======================================================"

echo "⚠️  ADVERTENCIA: Esto eliminará de forma irreversible la base de datos y los archivos del proyecto."
read -r -p "¿Estás completamente seguro de continuar? (escribe 'si' para continuar): " CONFIRM
if [ "$CONFIRM" != "si" ]; then
    echo "Operación cancelada por el usuario."
    exit 0
fi

# 1. Detener y eliminar el servicio de PM2
echo ">>> [1/4] Deteniendo servicio del backend (PM2)..."
pm2 stop vestix-backend 2>/dev/null || true
pm2 delete vestix-backend 2>/dev/null || true
pm2 save --force 2>/dev/null || true

# 2. Eliminar configuración de Nginx
echo ">>> [2/4] Eliminando configuración de Nginx..."
sudo rm -f /etc/nginx/sites-enabled/vestix
sudo rm -f /etc/nginx/sites-available/vestix
sudo systemctl restart nginx || true

# 3. Eliminar Base de Datos y Usuario de PostgreSQL
echo ">>> [3/4] Eliminando Base de Datos PostgreSQL..."
DB_NAME="erp_prod"
DB_USER="erp_admin"
# Se desconectan las sesiones activas para poder hacer el DROP
sudo -u postgres psql -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" || true

# 4. Eliminar el directorio de la aplicación
echo ">>> [4/4] Eliminando el directorio del código fuente..."
APP_DIR="/var/www/vestix"
if [ -d "$APP_DIR" ]; then
    sudo rm -rf $APP_DIR
    echo "Directorio $APP_DIR eliminado."
else
    echo "Directorio $APP_DIR no encontrado, se omite."
fi

echo "======================================================"
echo "  ¡Limpieza Completada!"
echo "======================================================"
echo "El servidor ha quedado limpio. Vestix ERP ha sido desinstalado correctamente."
