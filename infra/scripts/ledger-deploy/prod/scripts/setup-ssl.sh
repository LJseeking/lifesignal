#!/bin/bash
set -euo pipefail

# deploy/prod/scripts/setup-ssl.sh
# Enable HTTPS using Certbot (Let's Encrypt)
# Usage: sudo ./setup-ssl.sh <your-domain> <email>

if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please run as root (sudo)."
  exit 1
fi

if [ -z "${1:-}" ] || [ -z "${2:-}" ]; then
  echo "❌ Error: Missing arguments."
  echo "   Usage: sudo ./setup-ssl.sh <your-domain> <email>"
  exit 1
fi

DOMAIN=$1
EMAIL=$2

echo "🔒 Setting up SSL for $DOMAIN..."

# 1. Install Certbot
echo "📦 Installing Certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# 2. Obtain Certificate & Configure Nginx
echo "🚀 Requesting Certificate..."
# --nginx: Use Nginx plugin
# --redirect: Force redirect HTTP to HTTPS
# --agree-tos: Agree to terms
# --no-eff-email: Don't share email with EFF
certbot --nginx \
  -d "$DOMAIN" \
  -m "$EMAIL" \
  --redirect \
  --agree-tos \
  --non-interactive \
  --no-eff-email

# 3. Verify Auto-Renewal
echo "🔄 Verifying Auto-Renewal..."
systemctl list-timers | grep certbot || echo "⚠️  Certbot timer not found, please check 'systemctl list-timers'"

echo "✅ SSL Setup Complete!"
echo "   https://$DOMAIN is now live."
echo "   Certbot will automatically renew certificates expiring within 30 days."
echo "   You can test renewal with: sudo certbot renew --dry-run"
