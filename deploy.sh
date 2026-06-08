#!/bin/bash
# deploy.sh
# Deployment script for Vestix ERP (Linux/Ubuntu)
# Assumes Node.js (v20+), Redis, and PostgreSQL are already installed or available.

set -e

echo "🚀 Starting Deployment Process for Vestix ERP..."

# Define directories
ROOT_DIR=$(pwd)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "======================================"
echo "📦 1. Updating source code"
echo "======================================"
# If using git, uncomment the following line:
# git pull origin main

echo "======================================"
echo "🔧 2. Building Backend"
echo "======================================"
cd "$BACKEND_DIR"
echo "-> Installing dependencies..."
npm install

echo "-> Running database migrations..."
npx prisma generate
npx prisma migrate deploy

echo "-> Building NestJS application..."
npm run build

echo "======================================"
echo "🎨 3. Building Frontend"
echo "======================================"
cd "$FRONTEND_DIR"
echo "-> Installing dependencies..."
npm install

echo "-> Building Vite application..."
npm run build

echo "======================================"
echo "🚀 4. Managing PM2 Processes"
echo "======================================"
# Ensure PM2 is installed
if ! command -v pm2 &> /dev/null
then
    echo "PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
fi

cd "$BACKEND_DIR"
# Stop existing pm2 instance if running
pm2 stop vestix-backend || true
pm2 delete vestix-backend || true

# Start backend using PM2
echo "-> Starting Backend with PM2..."
NODE_ENV=production pm2 start dist/src/main.js --name "vestix-backend"

echo "-> Saving PM2 state..."
pm2 save

echo "======================================"
echo "✅ Deployment completed successfully!"
echo "======================================"
echo "Important Post-Deployment Steps:"
echo "1. Configure Nginx or Apache to serve the static frontend files from: $FRONTEND_DIR/dist"
echo "2. Configure your web server as a reverse proxy to forward /api requests to the PM2 backend."
echo "3. Ensure your .env files in both backend and frontend have production values."
