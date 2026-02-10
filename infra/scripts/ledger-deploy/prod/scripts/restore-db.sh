#!/bin/bash
set -euo pipefail

# deploy/prod/scripts/restore-db.sh
# Production Database Restore Script
# Usage: sudo ./restore-db.sh [backup_file_path]

# Configuration
ENV_FILE="/opt/credits-ledger/.env"
CONTAINER_NAME="credits_db_prod"

# Check arguments
if [ -z "${1:-}" ]; then
  echo "❌ Error: Missing backup file argument."
  echo "   Usage: sudo ./restore-db.sh /path/to/backup.sql"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: File not found: $BACKUP_FILE"
  exit 1
fi

# Load Environment Variables
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
else
  echo "❌ Error: Env file not found at $ENV_FILE"
  exit 1
fi

echo "⚠️  DANGER ZONE: RESTORING DATABASE ⚠️"
echo "Target Container: $CONTAINER_NAME"
echo "Target Database : $POSTGRES_DB"
echo "Source File     : $BACKUP_FILE"
echo ""
echo "This will OVERWRITE the current database state. Data since the backup will be LOST."
echo "Are you absolutely sure?"
read -p "Type 'YES' to confirm: " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
  echo "🚫 Restore cancelled."
  exit 0
fi

echo "🛑 Terminating existing connections..."
# Force kill existing connections to allow drop/restore
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d postgres -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE datname = '$POSTGRES_DB' 
    AND pid <> pg_backend_pid();"

echo "🔄 Restoring schema and data..."
# Drop and recreate schema public to ensure clean state
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Pipe backup file into container
cat "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "✅ Restore completed successfully."
