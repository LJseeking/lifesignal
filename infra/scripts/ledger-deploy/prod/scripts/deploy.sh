#!/bin/bash
set -euo pipefail

# deploy/prod/scripts/deploy.sh
# Production Deployment Script
# Usage: ./deploy.sh

# 1. Configuration
PROJECT_ROOT="$(dirname "$0")/../../.."
COMPOSE_FILE="deploy/prod/docker-compose.prod.yml"
ENV_FILE="/opt/credits-ledger/.env"

echo "🚀 Starting Production Deployment..."

# 2. Check Prerequisites
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: Config file not found at $ENV_FILE"
  echo "   Please copy deploy/prod/.env.example to $ENV_FILE and configure it."
  exit 1
fi

# Load Env (Export vars for docker-compose interpolation)
set -a
source "$ENV_FILE"
set +a

# Validate Essential Vars
REQUIRED_VARS=("JWT_SECRET" "ADMIN_TOKEN" "CORS_ORIGIN" "POSTGRES_PASSWORD")
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR:-}" ]; then
    echo "❌ Error: Environment variable $VAR is missing in $ENV_FILE"
    exit 1
  fi
done

# 3. Navigate to Project Root
cd "$PROJECT_ROOT"
echo "📂 Working directory: $(pwd)"

# 4. Pull Code (Assuming this script is run from a repo clone)
echo "📥 Pulling latest code..."
git pull origin main || echo "⚠️  Git pull failed or not a git repo, continuing..."

# 5. Backup/Rotate Images (For Rollback)
echo "📦 Rotating images for rollback capability..."
if docker image inspect credits-ledger/backend:latest >/dev/null 2>&1; then
  docker tag credits-ledger/backend:latest credits-ledger/backend:previous
  echo "   Tagged latest -> previous"
fi

# 6. Build
echo "🔨 Building images..."
docker compose -f "$COMPOSE_FILE" build

# 7. Migrate DB
echo "🔄 Running Database Migrations..."
# Start DB first if needed
docker compose -f "$COMPOSE_FILE" up -d db
# Wait for DB
timeout 30s bash -c "until docker compose -f $COMPOSE_FILE exec db pg_isready -U $POSTGRES_USER; do sleep 2; done"
# Run migrate
docker compose -f "$COMPOSE_FILE" run --rm migrate

# 8. Start Backend
echo "🚀 Starting Backend..."
docker compose -f "$COMPOSE_FILE" up -d backend

# 9. Health Check
echo "🩺 Verifying Health..."
MAX_RETRIES=12
COUNT=0
HEALTH_URL="http://127.0.0.1:4000/healthz"
READY_URL="http://127.0.0.1:4000/readyz"

sleep 5

while [ $COUNT -lt $MAX_RETRIES ]; do
  if curl -s "$HEALTH_URL" | grep -q "true"; then
    echo "   Liveness OK"
    break
  fi
  printf "."
  sleep 5
  COUNT=$((COUNT+1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Error: Deployment failed. /healthz check timed out."
  docker compose -f "$COMPOSE_FILE" logs --tail 50 backend
  exit 1
fi

# Check Readiness (DB Connection)
if curl -s "$READY_URL" | grep -q "true"; then
  echo "   Readiness OK"
else
  echo "⚠️  Warning: /readyz check failed. DB might be unreachable."
  docker compose -f "$COMPOSE_FILE" logs --tail 20 backend
fi

# 10. Smoke Test Gate
echo "🛡️  Running Smoke Test Gate..."
if ./deploy/prod/scripts/run-smoke.sh; then
  echo "✅ Gate Passed."
else
  echo "❌ Gate Failed! Initiating Rollback..."
  ./deploy/prod/scripts/rollback.sh
  echo "🚫 Deployment Aborted."
  exit 1
fi

# 11. Summary
echo "✅ Deployment Successful!"
echo "   Backend is listening on 127.0.0.1:4000"
echo "   Please ensure Nginx is configured to proxy requests."
