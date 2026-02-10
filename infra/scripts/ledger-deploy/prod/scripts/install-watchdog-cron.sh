#!/bin/bash
set -euo pipefail

# deploy/prod/scripts/install-watchdog-cron.sh
# Install Health Watchdog Cron Job (Runs every minute)
# Usage: sudo ./install-watchdog-cron.sh

if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please run as root (sudo)."
  exit 1
fi

SCRIPT_PATH="/opt/credits-ledger/deploy/prod/scripts/watchdog.sh"
LOG_FILE="/var/log/credits-watchdog.log"
CRON_SCHEDULE="* * * * *" # Every minute

echo "🐶 Installing Watchdog Cron Job..."

if [ ! -f "$SCRIPT_PATH" ]; then
  echo "❌ Error: Watchdog script not found at $SCRIPT_PATH"
  echo "   Please ensure the application is deployed to /opt/credits-ledger"
  exit 1
fi

chmod +x "$SCRIPT_PATH"
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

# Check if job already exists
if crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"; then
  echo "⚠️  Cron job already exists. Skipping."
else
  (crontab -l 2>/dev/null; echo "$CRON_SCHEDULE $SCRIPT_PATH") | crontab -
  echo "✅ Cron job added: $CRON_SCHEDULE $SCRIPT_PATH"
fi

echo "📋 Current Crontab:"
crontab -l
