#!/bin/bash
# scripts/sync_images_prod.sh
# Aplica las imagenes y las vinculaciones en la base de datos de produccion

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SQL_FILE="$SCRIPT_DIR/apply_images_prod.sql"
IMAGES_DIR="$ROOT_DIR/backend/uploads/products"

echo "======================================================"
echo "  Aplicando Imagenes en Producción (Vestix ERP)"
echo "======================================================"

if [ ! -f "$SQL_FILE" ]; then
    echo "ERROR: No se encontró el archivo $SQL_FILE" >&2
    exit 1
fi

if [ ! -d "$IMAGES_DIR" ]; then
    echo "ERROR: No se encontró la carpeta de imágenes $IMAGES_DIR" >&2
    exit 1
fi

TOTAL_IMAGES=$(find "$IMAGES_DIR" -type f | wc -l)
echo ">>> Total de archivos de imagen a aplicar: $TOTAL_IMAGES"

# Modo 1: Docker / Podman Compose
if command -v docker >/dev/null 2>&1 && docker ps | grep -q "vestix-postgres"; then
    echo ">>> Detectado entorno Docker Compose."
    
    echo ">>> 1. Copiando archivos de imagen al contenedor backend..."
    docker cp "$IMAGES_DIR/." vestix-backend-1:/app/uploads/products/ || docker cp "$IMAGES_DIR/." vestix_backend_1:/app/uploads/products/
    
    echo ">>> 2. Ejecutando sentencias SQL en la base de datos..."
    docker exec -i vestix-postgres-1 psql -U erp_admin -d erp_prod < "$SQL_FILE" || docker exec -i vestix_postgres_1 psql -U erp_admin -d erp_prod < "$SQL_FILE"

# Modo 2: Podman directo
elif command -v podman >/dev/null 2>&1 && podman ps | grep -q "vestix-postgres"; then
    echo ">>> Detectado entorno Podman."
    
    echo ">>> 1. Copiando archivos de imagen al contenedor backend..."
    podman cp "$IMAGES_DIR/." vestix-backend-1:/app/uploads/products/
    
    echo ">>> 2. Ejecutando sentencias SQL en la base de datos..."
    podman exec -i vestix-postgres-1 psql -U erp_admin -d erp_prod < "$SQL_FILE"

# Modo 3: Instalación Bare Metal / PM2 (/var/www/vestix)
else
    echo ">>> Detectada instalación Bare Metal / PM2."
    
    DEST_DIR="/var/www/vestix/backend/uploads/products"
    mkdir -p "$DEST_DIR"
    echo ">>> 1. Copiando archivos a $DEST_DIR..."
    cp -r "$IMAGES_DIR/." "$DEST_DIR/"
    chown -R www-data:www-data "$DEST_DIR" 2>/dev/null || true
    
    echo ">>> 2. Ejecutando sentencias SQL en PostgreSQL local..."
    sudo -u postgres psql -d erp_prod < "$SQL_FILE" || psql -U erp_user -d erp_prod < "$SQL_FILE"
fi

echo ""
echo "======================================================"
echo "  ✅ ¡Imágenes y base de datos sincronizadas con éxito!"
echo "======================================================"
