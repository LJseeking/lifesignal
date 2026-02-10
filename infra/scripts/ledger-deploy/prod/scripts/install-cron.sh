#!/bin/bash
set -euo pipefail

# deploy/prod/scripts/install-cron.sh
# Install Daily Backup Cron Job
# Usage: sudo ./install-cron.sh

if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please run as root (sudo)."
  exit 1
fi

SCRIPT_PATH="/opt/credits-ledger/scripts/backup-db.sh"
LOG_FILE="/var/log/credits-backup.log"
CRON_SCHEDULE="0 3 * * *" # Daily at 03:00

echo "⏰ Installing Backup Cron Job..."

if [ ! -f "$SCRIPT_PATH" ]; then
  echo "❌ Error: Backup script not found at $SCRIPT_PATH"
  echo "   Please ensure the application is deployed to /opt/credits-ledger"
  exit 1
fi

chmod +x "$SCRIPT_PATH"

# Check if job already exists
if crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"; then
  echo "⚠️  Cron job already exists. Skipping."
else
  (crontab -l 2>/dev/null; echo "$CRON_SCHEDULE $SCRIPT_PATH >> $LOG_FILE 2>&1") | crontab -
  echo "✅ Cron job added: $CRON_SCHEDULE $SCRIPT_PATH"
fi

echo "📋 Current Crontab:"
crontab -l
