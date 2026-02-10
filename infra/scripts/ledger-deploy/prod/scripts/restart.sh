#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(dirname "$0")/../../.."
COMPOSE_FILE="deploy/prod/docker-compose.prod.yml"
ENV_FILE="/opt/credits-ledger/.env"

if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
fi

cd "$PROJECT_ROOT"
echo "🔄 Restarting Backend..."
docker compose -f "$COMPOSE_FILE" restart backend
echo "✅ Done."
