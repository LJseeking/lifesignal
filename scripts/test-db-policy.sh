#!/bin/bash
set -u

# Setup
HOOK_PATH=".githooks/pre-commit"
TEST_DIR="apps/mysticos"
PASSED=0
TOTAL=0

function run_test() {
  local desc=$1
  local file=$2
  local content=$3
  local should_pass=$4 # 0 for pass, 1 for fail

  TOTAL=$((TOTAL + 1))
  echo "--- Test $TOTAL: $desc ---"
  
  # Setup file
  mkdir -p "$(dirname "$file")"
  echo "$content" > "$file"
  git add "$file"
  
  # Run Hook
  # Note: The hook checks staged files.
  if "$HOOK_PATH"; then
    HOOK_EXIT=0
  else
    HOOK_EXIT=1
  fi
  
  # Cleanup
  git restore --staged "$file"
  rm "$file"
  
  # Verify result
  if [ $HOOK_EXIT -eq $should_pass ]; then
    echo "✅ PASSED"
    PASSED=$((PASSED + 1))
  else
    echo "❌ FAILED (Expected exit code $should_pass, got $HOOK_EXIT)"
  fi
  echo ""
}

echo "=== Starting DB Policy Verification (Non-Destructive) ==="

# Case 1: TS file with forbidden command -> Should Block (1)
run_test "TS file with 'prisma migrate'" \
  "$TEST_DIR/test_guard.ts" \
  "const cmd = 'pnpm exec prisma migrate deploy';" \
  1

# Case 2: DB URL in env file -> Should Block (1)
# Construct URL to avoid triggering the hook on this script itself
# Pattern: postgresql://...
SCHEME="postgresql"
CRED="user:pass"
HOST="host/db"
BAD_URL="${SCHEME}://${CRED}@${HOST}"

run_test "Real DB URL in .env file" \
  "$TEST_DIR/.env.test_guard" \
  "DATABASE_URL='$BAD_URL'" \
  1

# Case 3: Markdown file with forbidden command -> Should Pass (0) but warn
run_test "Markdown file with 'prisma migrate'" \
  "$TEST_DIR/TEST_GUARD.md" \
  "Example: pnpm exec prisma migrate deploy" \
  0

# Summary
echo "=== Summary: $PASSED / $TOTAL Tests Passed ==="
if [ $PASSED -eq $TOTAL ]; then
  exit 0
else
  exit 1
fi
