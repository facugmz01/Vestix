#!/bin/bash

# Vestix ERP - Script de Instalación Automatizada para Servidores Linux
# Preparado para Ubuntu 22.04+ / Debian 12+
# Se recomienda ejecutar este script como un usuario con permisos sudo (no root directamente)

set -e

echo "======================================================"
echo "  Iniciando Instalación de Vestix ERP Server"
echo "======================================================"

# 1. Actualizar e instalar dependencias del sistema
echo ">>> [1/8] Instalando dependencias del sistema (PostgreSQL, Redis, Nginx, Git)..."
sudo apt-get update
sudo apt-get install -y curl git nginx postgresql postgresql-contrib redis-server build-essential

# Instalar Node.js (v20 LTS)
echo ">>> Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente para manejar el proceso del backend
sudo npm install -g pm2

# 2. Configurar Base de Datos PostgreSQL
echo ">>> [2/8] Configurando PostgreSQL..."
DB_NAME="erp_prod"
DB_USER="erp_admin"
# Generar una contraseña segura aleatoria
DB_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9')

# Crear BD y Usuario. Se usa || true para evitar que el script falle si ya existen
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;" || true

# 3. Clonar Repositorio
echo ">>> [3/8] Clonando repositorio desde GitHub..."
APP_DIR="/var/www/vestix"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
# Si el directorio ya tiene archivos, se omite el clone. De lo contrario, clona.
if [ ! -d "$APP_DIR/.git" ]; then
    git clone https://github.com/facugmz01/Vestix.git $APP_DIR
else
    echo "El repositorio ya existe. Actualizando..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

# 4. Generar archivos .env
echo ">>> [4/8] Generando variables de entorno (.env)..."
JWT_SECRET=$(openssl rand -base64 32)

# Crear directorio backend si no existe (por si el repo cambia de estructura)
mkdir -p $APP_DIR/backend
mkdir -p $APP_DIR/frontend

cat <<EOF > $APP_DIR/backend/.env
PORT=3000
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
JWT_SECRET="$JWT_SECRET"
NODE_ENV="production"
EOF

cat <<EOF > $APP_DIR/frontend/.env
VITE_API_URL="/api"
EOF

# 5. Instalar y Compilar Backend
echo ">>> [5/8] Instalando y compilando el Backend..."
cd $APP_DIR/backend
rm -rf node_modules
npm install --unsafe-perm
# Asegurar permisos de ejecucion para binarios locales
chmod -R +x node_modules/.bin || true
# Generar cliente de Prisma y empujar esquema a la BD
npx prisma generate
npx prisma db push --accept-data-loss
# Compilar NestJS
npm run build

# 6. Instalar y Compilar Frontend
echo ">>> [6/8] Instalando y compilando el Frontend..."
cd $APP_DIR/frontend
rm -rf node_modules
npm install --unsafe-perm
# Asegurar permisos de ejecucion para binarios locales
chmod -R +x node_modules/.bin || true
npm run build

# 7. Iniciar Backend con PM2
echo ">>> [7/8] Iniciando servicios de Backend con PM2..."
cd $APP_DIR/backend
# Detener instancia anterior si existe
pm2 delete vestix-backend 2>/dev/null || true
pm2 start dist/src/main.js --name "vestix-backend"
pm2 save
# Configurar PM2 para que inicie con el sistema operativo
pm2 startup | grep "sudo" | bash || true

# 8. Configurar Nginx
echo ">>> [8/8] Configurando Servidor Web Nginx..."
NGINX_CONF="/etc/nginx/sites-available/vestix"

sudo bash -c "cat <<EOF > $NGINX_CONF
server {
    listen 80;
    server_name _; # Responde a cualquier dominio o IP

    # Servir la aplicacion React/Vite compilada
    root $APP_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \\\$uri \\\$uri/ /index.html;
    }

    # Proxy reverso para la API de NestJS
    location /api/ {
        # Quita el /api antes de enviarlo al backend
        rewrite ^/api/(.*) /\\\$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOF"

# Habilitar el sitio y reiniciar Nginx
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
sudo systemctl enable nginx
sudo systemctl enable redis-server

echo "======================================================"
echo "  ¡Instalación Completada con Éxito!"
echo "======================================================"
echo ""
echo "Resumen de la instalación:"
echo "- Nginx está sirviendo el frontend en el puerto 80."
echo "- PM2 mantiene el backend vivo en segundo plano (puerto 3000 protegido)."
echo "- PostgreSQL y Redis están configurados y corriendo."
echo ""
echo "Datos Importantes (Guarda esto):"
echo "  Base de datos: $DB_NAME"
echo "  Usuario DB:    $DB_USER"
echo "  Password DB:   $DB_PASS"
echo ""
echo "Puedes ver el estado del backend ejecutando: pm2 status"
echo "Para ver los logs del servidor ejecuta: pm2 logs vestix-backend"
echo "======================================================"
