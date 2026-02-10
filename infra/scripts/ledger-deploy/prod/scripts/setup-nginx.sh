#!/bin/bash
set -euo pipefail

# deploy/prod/scripts/setup-nginx.sh
# Install and Configure Nginx Reverse Proxy
# Usage: sudo ./setup-nginx.sh <your-domain>

if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please run as root (sudo)."
  exit 1
fi

if [ -z "${1:-}" ]; then
  echo "❌ Error: Missing domain argument."
  echo "   Usage: sudo ./setup-nginx.sh <your-domain>"
  echo "   Example: sudo ./setup-nginx.sh api.credits.com"
  exit 1
fi

DOMAIN=$1
CONF_SRC="deploy/prod/nginx/credits-ledger.conf"
CONF_DEST="/etc/nginx/sites-available/credits-ledger"

echo "🔧 Setting up Nginx for domain: $DOMAIN"

# 1. Install Nginx
echo "📦 Installing Nginx..."
apt-get update
apt-get install -y nginx

# 2. Configure
echo "📝 Configuring Nginx..."
if [ ! -f "$CONF_SRC" ]; then
    echo "❌ Error: Configuration file $CONF_SRC not found."
    echo "   Please run this script from the project root."
    exit 1
fi

cp "$CONF_SRC" "$CONF_DEST"

# Replace placeholder with actual domain
sed -i "s/YOUR_DOMAIN_HERE/$DOMAIN/g" "$CONF_DEST"

# 3. Enable Site
echo "🔗 Enabling Site..."
ln -sf "$CONF_DEST" /etc/nginx/sites-enabled/

# Disable default if it exists (to avoid conflicts on port 80)
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "⚠️  Disabling default Nginx site..."
    rm /etc/nginx/sites-enabled/default
fi

# 4. Verify & Reload
echo "🔍 Verifying Configuration..."
nginx -t

echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo "✅ Nginx Setup Complete!"
echo "   http://$DOMAIN should now be proxying to 127.0.0.1:4000"
echo "   Next: Run ./setup-ssl.sh to enable HTTPS."
