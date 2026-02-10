#!/bin/bash
set -euo pipefail

# deploy/prod/scripts/run-smoke.sh
# Production Smoke Test Gate
# Usage: ./run-smoke.sh [target_url]

# Configuration
PROJECT_ROOT="$(dirname "$0")/../../.."
COMPOSE_FILE="deploy/prod/docker-compose.prod.yml"
ENV_FILE="/opt/credits-ledger/.env"

# Optional: Allow overriding target URL (e.g., external domain)
TARGET_URL="${1:-}"

echo "🛡️  Starting Production Smoke Gate..."

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: Config file not found at $ENV_FILE"
  exit 1
fi

# Load Env
set -a; source "$ENV_FILE"; set +a

cd "$PROJECT_ROOT"

# Run Smoke Test Container
# We pass SMOKE_BASE_URL if provided, otherwise it defaults to http://backend:4000 inside the container
if [ -n "$TARGET_URL" ]; then
  echo "   Target: $TARGET_URL"
  docker compose -f "$COMPOSE_FILE" run --rm -e SMOKE_BASE_URL="$TARGET_URL" smoke
else
  echo "   Target: Internal (http://backend:4000)"
  docker compose -f "$COMPOSE_FILE" run --rm smoke
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Smoke Test Passed. Release Approved."
else
  echo "❌ Smoke Test FAILED."
fi

exit $EXIT_CODE
