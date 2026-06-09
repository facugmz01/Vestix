#!/bin/bash

# Vestix ERP - Script de Instalación Automatizada para Servidores Linux
# Preparado para Ubuntu 22.04+ / Debian 12+

set -e

echo "======================================================"
echo "  Iniciando Instalación de Vestix ERP Server"
echo "======================================================"
echo ""

# ─────────────────────────────────────────────────────────────
# PASO 0: Solicitar dominio/URL del sistema
# ─────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════"
echo "  CONFIGURACIÓN DEL DOMINIO"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Ingresá el dominio o IP pública donde se accederá al sistema."
echo "Ejemplos: erp.miempresa.com, 185.200.50.100"
echo ""
read -p "  Dominio o IP: " SERVER_DOMAIN
SERVER_DOMAIN=${SERVER_DOMAIN:-"_"}
echo ""
echo "  Dominio configurado: $SERVER_DOMAIN"
echo ""
read -p "¿Es correcto? (s/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
  echo "Instalación cancelada. Volvé a ejecutar el script."
  exit 1
fi

echo ""
echo ">>> Comenzando instalación..."
echo ""

# ─────────────────────────────────────────────────────────────
# 1. Actualizar e instalar dependencias del sistema
# ─────────────────────────────────────────────────────────────
echo ">>> [1/8] Instalando dependencias del sistema (PostgreSQL, Redis, Nginx, Git)..."
sudo apt-get update
sudo apt-get install -y curl git nginx postgresql postgresql-contrib redis-server build-essential

# Instalar Node.js (v20 LTS)
echo ">>> Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente para manejar el proceso del backend
sudo npm install -g pm2

# ─────────────────────────────────────────────────────────────
# 2. Configurar Base de Datos PostgreSQL
# ─────────────────────────────────────────────────────────────
echo ">>> [2/8] Configurando PostgreSQL..."
DB_NAME="erp_prod"
DB_USER="erp_admin"
DB_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9')

sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" 2>/dev/null || sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;" || true

# ─────────────────────────────────────────────────────────────
# 3. Clonar Repositorio
# ─────────────────────────────────────────────────────────────
echo ">>> [3/8] Clonando repositorio desde GitHub..."
APP_DIR="/var/www/vestix"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
if [ ! -d "$APP_DIR/.git" ]; then
    git clone https://github.com/facugmz01/Vestix.git $APP_DIR
else
    echo "El repositorio ya existe. Actualizando..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

# ─────────────────────────────────────────────────────────────
# 4. Generar archivos .env
# ─────────────────────────────────────────────────────────────
echo ">>> [4/8] Generando variables de entorno (.env)..."
JWT_SECRET=$(openssl rand -base64 32)

mkdir -p $APP_DIR/backend
mkdir -p $APP_DIR/frontend

# Determinar la URL pública del API
if [[ "$SERVER_DOMAIN" == "_" || "$SERVER_DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  API_PUBLIC_URL="http://$SERVER_DOMAIN/api"
  APP_PUBLIC_URL="http://$SERVER_DOMAIN"
else
  API_PUBLIC_URL="https://$SERVER_DOMAIN/api"
  APP_PUBLIC_URL="https://$SERVER_DOMAIN"
fi

cat <<EOF > $APP_DIR/backend/.env
PORT=3000
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
JWT_SECRET="$JWT_SECRET"
NODE_ENV="production"
APP_URL="$APP_PUBLIC_URL"
EOF

cat <<EOF > $APP_DIR/frontend/.env
VITE_API_URL="/api"
VITE_APP_URL="$APP_PUBLIC_URL"
EOF

# ─────────────────────────────────────────────────────────────
# 5. Instalar y Compilar Backend
# ─────────────────────────────────────────────────────────────
echo ">>> [5/8] Instalando y compilando el Backend..."
cd $APP_DIR/backend
rm -rf node_modules
npm install --unsafe-perm
chmod -R +x node_modules/.bin || true
npx prisma generate
npx prisma db push --accept-data-loss
npm run build

# ─────────────────────────────────────────────────────────────
# 6. Instalar y Compilar Frontend
# ─────────────────────────────────────────────────────────────
echo ">>> [6/8] Instalando y compilando el Frontend..."
cd $APP_DIR/frontend
rm -rf node_modules
npm install --unsafe-perm
chmod -R +x node_modules/.bin || true
npm run build

# ─────────────────────────────────────────────────────────────
# 7. Iniciar Backend con PM2
# ─────────────────────────────────────────────────────────────
echo ">>> [7/8] Iniciando servicios de Backend con PM2..."
cd $APP_DIR/backend
pm2 delete vestix-backend 2>/dev/null || true
pm2 start dist/src/main.js --name "vestix-backend" --env production
pm2 save
pm2 startup | grep "sudo" | bash || true

# ─────────────────────────────────────────────────────────────
# 8. Configurar Nginx
# ─────────────────────────────────────────────────────────────
echo ">>> [8/8] Configurando Servidor Web Nginx..."
NGINX_CONF="/etc/nginx/sites-available/vestix"

# Determinar server_name para Nginx
if [[ "$SERVER_DOMAIN" == "_" ]]; then
  NGINX_SERVER_NAME="_"
else
  NGINX_SERVER_NAME="$SERVER_DOMAIN"
fi

sudo bash -c "cat <<NGINXEOF > $NGINX_CONF
server {
    listen 80;
    server_name $NGINX_SERVER_NAME;

    client_max_body_size 20M;

    root $APP_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \\\\\$uri \\\\\$uri/ /index.html;
    }

    location /api/ {
        rewrite ^/api/(.*) /\\\\\$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\\\$host;
        proxy_set_header X-Real-IP \\\\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\\\$scheme;
        proxy_cache_bypass \\\\\$http_upgrade;
    }
}
NGINXEOF"

sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
sudo systemctl enable redis-server

echo ""
echo "======================================================"
echo "  ✅ ¡Instalación Completada con Éxito!"
echo "======================================================"
echo ""
echo "Resumen de la instalación:"
echo "  URL:           $APP_PUBLIC_URL"
echo "  Nginx:         Puerto 80 (dominio: $NGINX_SERVER_NAME)"
echo "  Backend:       PM2 → localhost:3000"
echo "  PostgreSQL:    $DB_NAME"
echo "  Redis:         localhost:6379"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  DATOS DE BASE DE DATOS (¡GUARDALOS!)"
echo "═══════════════════════════════════════════════════════"
echo "  Base de datos: $DB_NAME"
echo "  Usuario DB:    $DB_USER"
echo "  Password DB:   $DB_PASS"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  📋 PRÓXIMO PASO:"
echo "  Abrí $APP_PUBLIC_URL en tu navegador."
echo "  El sistema te guiará para crear el Super Admin"
echo "  y configurar los datos de tu empresa."
echo ""
echo "Comandos útiles:"
echo "  pm2 status                  → Ver estado del backend"
echo "  pm2 logs vestix-backend     → Ver logs del servidor"
echo "======================================================"
