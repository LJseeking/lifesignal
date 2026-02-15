#!/bin/bash
set -e

# Load .env.local without xargs (preserves quotes and special chars)
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
else
  echo "Error: .env.local not found"
  exit 1
fi

# Print masked URL info
echo "== Database Connection Info =="
SCHEME=$(echo $DATABASE_URL | cut -d: -f1)
LEN=${#DATABASE_URL}
TAIL=${DATABASE_URL: -40}
echo "Scheme: $SCHEME"
echo "Length: $LEN"
echo "Tail: ...$TAIL"

# Verify scheme is postgresql
if [[ "$SCHEME" != "postgresql" && "$SCHEME" != "postgres" ]]; then
  echo "Error: Scheme must be postgresql, got $SCHEME"
  exit 1
fi

echo ""
echo "== 1. DB Push (Schema Sync) =="
pnpm exec prisma db push --accept-data-loss

echo ""
echo "== 2. Verify Tables (Public Schema) =="
pnpm exec prisma db execute --schema prisma/schema.prisma --stdin <<'SQL'
select tablename from pg_tables where schemaname='public' order by tablename;
SQL

echo ""
echo "== 3. Generate Client =="
pnpm exec prisma generate

echo ""
echo "== Verification Success =="
