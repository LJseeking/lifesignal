#!/bin/bash
set -u

# Repo root
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

TEST_DIR="apps/mysticos/__policy_tmp__"
HOOK=".githooks/pre-commit"
PASSED=0
TOTAL=0

# Cleanup function
function cleanup {
  if [ -d "$TEST_DIR" ]; then
    git restore --staged "$TEST_DIR" >/dev/null 2>&1 || true
    rm -rf "$TEST_DIR"
  fi
}
trap cleanup EXIT INT TERM

mkdir -p "$TEST_DIR"
chmod +x "$HOOK"

run_test() {
  local name=$1
  local file="$TEST_DIR/$2"
  local content=$3
  local expect_fail=$4 

  ((TOTAL++))
  echo "--- Test $TOTAL: $name ---"
  
  echo "$content" > "$file"
  git add "$file"

  if "$HOOK" >/dev/null 2>&1; then
    RES=0
  else
    RES=1
  fi

  git restore --staged "$file"
  rm "$file"

  if [ "$RES" -eq "$expect_fail" ]; then
    echo "✅ PASSED"
    ((PASSED++))
  else
    echo "❌ FAILED (Expected exit code $expect_fail, got $RES)"
  fi
}

run_test "Bad TS Source" "bad.ts" "const c = 'pnpm exec prisma migrate deploy'" 1

# Obfuscate bad URL to avoid self-match
BAD_PROTO="postgresql://"
BAD_URL="${BAD_PROTO}user:pass@host/db"
run_test "Bad Env File" ".env.bad" "DATABASE_URL='$BAD_URL'" 1

run_test "Markdown Doc" "doc.md" "Usage: prisma migrate deploy" 0

echo "=== Summary: $PASSED / $TOTAL Passed ==="

if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Git status dirty!"
  git status --porcelain
  exit 1
fi

if [ "$PASSED" -eq "$TOTAL" ]; then
  exit 0
else
  exit 1
fi
