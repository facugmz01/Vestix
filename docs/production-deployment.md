# Guía de Despliegue en Producción - Retail ERP

Esta guía detalla los pasos exactos para instalar, configurar y desplegar el sistema en un servidor Linux (Ubuntu/Debian) o VPS.

---

## 1. Requisitos de Software (Instalación)

Deberás instalar los siguientes componentes en el servidor:

### Servidor de Aplicaciones y Herramientas
- **Node.js (v20+):** Entorno de ejecución para Backend y Frontend.
- **npm:** Gestor de paquetes.
- **PM2:** Gestor de procesos para mantener el Backend siempre activo.
- **Nginx:** Servidor web para servir el Frontend y actuar como Proxy Inverso.

```bash
# Instalación de Node.js (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalación de PM2 globalmente
sudo npm install pm2 -g

# Instalación de Nginx
sudo apt-get install -y nginx
```

### Bases de Datos y Caché
- **PostgreSQL (v15+):** Base de datos principal.
- **Redis:** Requerido para colas de tareas (AFIP) y limitación de tráfico (Throttler).

```bash
# Instalación de PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Instalación de Redis
sudo apt-get install -y redis-server
```

---

## 2. Configuración de Base de Datos (PostgreSQL)

1. **Acceder a Postgres:**
   ```bash
   sudo -u postgres psql
   ```

2. **Crear usuario y base de datos:**
   ```sql
   CREATE DATABASE erp_prod;
   CREATE USER erp_user WITH PASSWORD 'TU_PASSWORD_SEGURO';
   GRANT ALL PRIVILEGES ON DATABASE erp_prod TO erp_user;
   \q
   ```

3. **URL de Conexión:**
   Anota tu URL: `postgresql://erp_user:TU_PASSWORD_SEGURO@localhost:5432/erp_prod`

---

## 3. Despliegue del Backend

1. **Clonar/Subir código:** Sube la carpeta `backend` al servidor (ej. `/var/www/erp/backend`).
2. **Instalar dependencias:**
   ```bash
   npm install --omit=dev
   ```
3. **Configurar variables de entorno:** Crea un archivo `.env` en `backend/`:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL="postgresql://erp_user:TU_PASSWORD_SEGURO@localhost:5432/erp_prod"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="UNA_CADENA_MUY_LARGA_Y_ALEATORIA"
   CORS_ORIGIN="https://tu-dominio-frontend.com"
   ```
4. **Ejecutar Migraciones de Prisma:**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
5. **Iniciar con PM2:**
   ```bash
   npm run build
   pm2 start dist/main.js --name erp-backend
   pm2 save
   ```

---

## 4. Despliegue del Frontend

El frontend debe compilarse localmente o en el servidor antes de ser servido por Nginx.

1. **Configurar API URL:** En `frontend/.env.production`:
   ```env
   VITE_API_BASE=https://api.tu-dominio.com
   ```
2. **Generar el Build:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   Esto generará una carpeta `dist`.
3. **Configurar Nginx:** Crea un archivo `/etc/nginx/sites-available/erp`:
   ```nginx
   server {
       listen 80;
       server_name app.tu-dominio.com;

       location / {
           root /var/www/erp/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
   }

   server {
       listen 80;
       server_name api.tu-dominio.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. **Habilitar sitio y reiniciar Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/erp /etc/nginx/sites-enabled/
    sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 5. Seguridad Adicional

- **SSL (HTTPS):** Usa Certbot para obtener certificados gratuitos de Let's Encrypt.
  ```bash
  sudo apt-get install python3-certbot-nginx
  sudo certbot --nginx -d app.tu-dominio.com -d api.tu-dominio.com
  ```
- **Firewall:** Permite solo puertos 80, 443 y SSH.
  ```bash
  sudo ufw allow 'Nginx Full'
  sudo ufw allow OpenSSH
  sudo ufw enable
  ```

---

## Resumen de Checklist de Instalación

| Componente | Qué instalar | Qué configurar |
| :--- | :--- | :--- |
| **Base de Datos** | PostgreSQL 15+, Redis | Crear DB, Usuario, `DATABASE_URL` |
| **Backend** | Node 20, PM2 | `.env`, Migraciones Prisma, Build |
| **Frontend** | Node 20 | `VITE_API_BASE`, Build (`dist`) |
| **Infraestructura** | Nginx, Certbot | Proxy Inverso, Certificados SSL |
