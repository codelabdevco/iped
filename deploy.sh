#!/bin/bash
# iPED Deployment Script
# Run this on the VPS: bash deploy.sh

set -e

APP_DIR="/var/www/iped"
REPO_URL="https://github.com/codelabdevco/iped.git"

echo "🚀 iPED Deployment Starting..."

# 1. Clone or pull
if [ -d "$APP_DIR/.git" ]; then
    echo "📥 Pulling latest code..."
    cd $APP_DIR
    git pull origin main
else
    echo "📦 Cloning repository..."
    mkdir -p $APP_DIR
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# 3. Copy .env if not exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env with your actual values!"
fi

# 4. Build
echo "🔨 Building..."
npm run build

# 5. Setup PM2
echo "🔄 Starting/Restarting PM2..."
if pm2 describe iped > /dev/null 2>&1; then
    pm2 restart iped
else
    pm2 start ecosystem.config.js
fi
pm2 save

# 6. Setup Nginx (first time only)
if [ ! -f /etc/nginx/sites-enabled/iped ]; then
    echo "🌐 Setting up Nginx..."
    cp nginx.conf /etc/nginx/sites-available/iped
    ln -sf /etc/nginx/sites-available/iped /etc/nginx/sites-enabled/iped
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
fi

echo ""
echo "✅ iPED deployed successfully!"
echo "🌐 Access: http://187.77.157.29"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env with your real API keys"
echo "   2. pm2 restart iped"
echo "   3. Setup MongoDB if not already running"
