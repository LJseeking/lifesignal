#!/bin/bash
set -e

# Load .env.local if exists
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi

# 1. Check if prisma/schema.prisma uses postgresql
PROVIDER=$(grep -A 5 "datasource db" prisma/schema.prisma | grep "provider" | cut -d'"' -f2)
if [ "$PROVIDER" != "postgresql" ]; then
  echo "❌ Error: Datasource provider must be 'postgresql', found '$PROVIDER'"
  exit 1
fi

# 2. Check DATABASE_URL scheme (if set)
if [ -n "$DATABASE_URL" ]; then
  SCHEME=$(echo $DATABASE_URL | cut -d: -f1)
  if [[ "$SCHEME" != "postgresql" && "$SCHEME" != "postgres" ]]; then
    echo "❌ Error: DATABASE_URL scheme must be 'postgresql', found '$SCHEME'"
    exit 1
  fi
fi

# 3. Check for banned commands in arguments
for arg in "$@"; do
  if [[ "$arg" == *"migrate"* ]]; then
    echo "❌ Error: 'prisma migrate' commands are BANNED by policy."
    echo "   Use 'prisma db push' instead."
    exit 1
  fi
done

echo "✅ DB Guard: Policy Check Passed (Provider: $PROVIDER)"
