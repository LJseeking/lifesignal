#!/bin/bash
set -euo pipefail

# deploy/prod/scripts/backup-db.sh
# Production Database Backup Script
# Usage: ./backup-db.sh

# Configuration
BACKUP_DIR="/opt/credits-ledger/backups"
ENV_FILE="/opt/credits-ledger/.env"
CONTAINER_NAME="credits_db_prod"
RETENTION_COUNT=7

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Load Environment Variables
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
else
  echo "❌ Error: Env file not found at $ENV_FILE"
  exit 1
fi

# Generate Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="${BACKUP_DIR}/credits_backup_${TIMESTAMP}.sql"

echo "📦 Starting backup for database '${POSTGRES_DB}'..."

# Execute Backup
# Note: Using -U postgres inside the container (default superuser) if POSTGRES_USER is different, 
# but usually POSTGRES_USER is the owner.
if docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$FILENAME"; then
  echo "✅ Backup created: $FILENAME"
  echo "   Size: $(du -h "$FILENAME" | cut -f1)"
else
  echo "❌ Backup failed!"
  rm -f "$FILENAME"
  exit 1
fi

# Retention Policy (Keep last N)
echo "🧹 Cleaning up old backups (Keeping last $RETENTION_COUNT)..."
# List files by time (newest first), skip first N, remove the rest
find "$BACKUP_DIR" -name "credits_backup_*.sql" -type f -printf "%T@ %p\n" | \
  sort -rn | \
  awk "NR > $RETENTION_COUNT" | \
  cut -d' ' -f2- | \
  xargs -r rm -v

echo "✨ Backup process completed."
