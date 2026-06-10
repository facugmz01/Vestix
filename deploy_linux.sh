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

# Determinar si es IP o Dominio
if [[ "$SERVER_DOMAIN" == "_" || "$SERVER_DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  IS_IP=true
  API_PUBLIC_URL="https://$SERVER_DOMAIN/api"
  APP_PUBLIC_URL="https://$SERVER_DOMAIN"
else
  IS_IP=false
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

# Asegurar que VITE_API_BASE y VITE_APP_URL se sobreescriban correctamente en .env.production
touch $APP_DIR/frontend/.env.production
sed -i '/^VITE_API_BASE=/d' $APP_DIR/frontend/.env.production
sed -i '/^VITE_APP_URL=/d' $APP_DIR/frontend/.env.production
echo "VITE_API_BASE=\"/api\"" >> $APP_DIR/frontend/.env.production
echo "VITE_APP_URL=\"$APP_PUBLIC_URL\"" >> $APP_DIR/frontend/.env.production

# ─────────────────────────────────────────────────────────────
# 5. Instalar y Compilar Backend
# ─────────────────────────────────────────────────────────────
echo ">>> [5/9] Instalando y compilando el Backend..."
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
echo ">>> [6/9] Instalando y compilando el Frontend..."
cd $APP_DIR/frontend
rm -rf node_modules
npm install --unsafe-perm
chmod -R +x node_modules/.bin || true
npm run build

# ─────────────────────────────────────────────────────────────
# 7. Iniciar Backend con PM2
# ─────────────────────────────────────────────────────────────
echo ">>> [7/9] Iniciando servicios de Backend con PM2..."
cd $APP_DIR/backend
pm2 delete vestix-backend 2>/dev/null || true
pm2 start dist/src/main.js --name "vestix-backend" --env production
pm2 save
pm2 startup | grep "sudo" | bash || true

# ─────────────────────────────────────────────────────────────
# 8. Configurar Nginx y SSL
# ─────────────────────────────────────────────────────────────
echo ">>> [8/9] Configurando Servidor Web Nginx..."
NGINX_CONF="/etc/nginx/sites-available/vestix"

if [[ "$SERVER_DOMAIN" == "_" ]]; then
  NGINX_SERVER_NAME="_"
else
  NGINX_SERVER_NAME="$SERVER_DOMAIN"
fi

if [ "$IS_IP" = true ]; then
  echo ">>> IP detectada. Generando certificado SSL autofirmado..."
  sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/ssl/private/nginx-selfsigned.key \
      -out /etc/ssl/certs/nginx-selfsigned.crt \
      -subj "/C=AR/ST=BA/L=CABA/O=Vestix/CN=$NGINX_SERVER_NAME" 2>/dev/null

  sudo bash -c "cat << 'NGINXEOF' > $NGINX_CONF
server {
    listen 80;
    server_name $NGINX_SERVER_NAME;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $NGINX_SERVER_NAME;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    client_max_body_size 20M;

    root $APP_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF"

else
  echo ">>> Dominio detectado. Configurando Nginx para Certbot..."
  sudo bash -c "cat << 'NGINXEOF' > $NGINX_CONF
server {
    listen 80;
    server_name $NGINX_SERVER_NAME;

    client_max_body_size 20M;

    root $APP_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF"
fi

sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
sudo systemctl enable redis-server

# ─────────────────────────────────────────────────────────────
# 9. Configurar Certbot (Sólo para Dominios)
# ─────────────────────────────────────────────────────────────
if [ "$IS_IP" = false ] && [ "$SERVER_DOMAIN" != "_" ]; then
  echo ">>> [9/9] Obteniendo certificado SSL de Let's Encrypt con Certbot..."
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d $SERVER_DOMAIN --non-interactive --agree-tos --register-unsafely-without-email --redirect || echo "⚠️ Advertencia: Falló la generación del certificado SSL. Puedes configurarlo manualmente luego."
else
  echo ">>> [9/9] Certbot omitido (Se está usando IP o localhost con certificado autofirmado)."
fi

echo ""
echo "======================================================"
echo "  ✅ ¡Instalación Completada con Éxito!"
echo "======================================================"
echo ""
echo "Resumen de la instalación:"
echo "  URL Segura:    $APP_PUBLIC_URL"
if [ "$IS_IP" = true ]; then
  echo "  Nginx SSL:     Certificado Autofirmado (Verás una advertencia en el navegador)"
else
  echo "  Nginx SSL:     Certificado válido de Let's Encrypt"
fi
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
if [ "$IS_IP" = true ]; then
  echo "  (Importante: Aceptá la advertencia de seguridad SSL de tu navegador)"
fi
echo "  El sistema te guiará para crear el Super Admin"
echo "  y configurar los datos de tu empresa."
echo ""
echo "Comandos útiles:"
echo "  pm2 status                  → Ver estado del backend"
echo "  pm2 logs vestix-backend     → Ver logs del servidor"
echo "======================================================"
