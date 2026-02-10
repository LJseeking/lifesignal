#!/bin/bash
set -euo pipefail

# deploy/prod/scripts/rollback.sh
# Rollback to the previous image tag
# Usage: ./rollback.sh

PROJECT_ROOT="$(dirname "$0")/../../.."
COMPOSE_FILE="deploy/prod/docker-compose.prod.yml"
ENV_FILE="/opt/credits-ledger/.env"

echo "⏪ Starting Rollback Procedure..."

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: Config file not found at $ENV_FILE"
  exit 1
fi

# Load Env
set -a
source "$ENV_FILE"
set +a

cd "$PROJECT_ROOT"

# Check if previous image exists
if ! docker image inspect credits-ledger/backend:previous >/dev/null 2>&1; then
  echo "❌ Error: No previous image found (credits-ledger/backend:previous)."
  echo "   Cannot rollback."
  exit 1
fi

echo "🔄 Restoring previous image..."
docker tag credits-ledger/backend:previous credits-ledger/backend:latest

echo "🚀 Restarting Backend with previous image..."
docker compose -f "$COMPOSE_FILE" up -d --force-recreate backend

echo "🩺 Verifying Health..."
sleep 5
if curl -s "http://127.0.0.1:4000/healthz" | grep -q "true"; then
  echo "✅ Rollback Successful! Service is healthy."
else
  echo "❌ Error: Service unhealthy after rollback."
  docker compose -f "$COMPOSE_FILE" logs --tail 50 backend
  exit 1
fi
