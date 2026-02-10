#!/bin/bash
set -u

# deploy/prod/scripts/watchdog.sh
# Health Watchdog: Restarts backend if health checks fail 3 times consecutively.
# Usage: ./watchdog.sh

# Configuration
PROJECT_ROOT="$(dirname "$0")/../../.."
COMPOSE_FILE="deploy/prod/docker-compose.prod.yml"
ENV_FILE="/opt/credits-ledger/.env"
HEALTH_URL="http://127.0.0.1:4000/healthz"
READY_URL="http://127.0.0.1:4000/readyz"
LOG_FILE="/var/log/credits-watchdog.log"

# Ensure we have the environment variables
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
fi

cd "$PROJECT_ROOT"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

check_health() {
  # Check Liveness
  if ! curl -s -f "$HEALTH_URL" > /dev/null; then
    return 1
  fi
  # Check Readiness
  if ! curl -s -f "$READY_URL" > /dev/null; then
    return 1
  fi
  return 0
}

FAIL_COUNT=0
MAX_RETRIES=3

for ((i=1; i<=MAX_RETRIES; i++)); do
  if ! check_health; then
    FAIL_COUNT=$((FAIL_COUNT+1))
    # log "Health check failed (Attempt $i/$MAX_RETRIES)"
    if [ "$i" -lt "$MAX_RETRIES" ]; then
      sleep 10
    fi
  else
    # Healthy, exit immediately
    exit 0
  fi
done

if [ "$FAIL_COUNT" -ge "$MAX_RETRIES" ]; then
  log "❌ CRITICAL: Health check failed $FAIL_COUNT times consecutively. Restarting backend..."
  
  if docker compose -f "$COMPOSE_FILE" restart backend >> "$LOG_FILE" 2>&1; then
    log "✅ Backend restarted successfully."
  else
    log "🚫 Failed to restart backend. Please check system manually."
  fi
fi
