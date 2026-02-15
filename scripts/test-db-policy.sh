#!/bin/bash
set -u

# Ensure clean state on exit/interrupt
function cleanup {
  echo "🧹 Cleaning up..."
  git restore --staged apps/mysticos 2>/dev/null || true
  # Clean up temp files if they exist (using find to be safe)
  find apps/mysticos -name "tmp_test_*" -delete 2>/dev/null || true
  find apps/mysticos -name ".env.tmp_*" -delete 2>/dev/null || true
}
trap cleanup EXIT INT TERM

HOOK_PATH=".githooks/pre-commit"
PASSED=0
TOTAL=0

# Ensure hooks are executable
chmod +x "$HOOK_PATH"

function run_test() {
  local desc=$1
  local filename_pattern=$2 # e.g., tmp_test_XXXX.ts
  local content=$3
  local should_pass=$4 # 0 for pass, 1 for fail

  TOTAL=$((TOTAL + 1))
  echo "--- Test $TOTAL: $desc ---"
  
  # Create temp file safely
  local file
  file=$(mktemp "apps/mysticos/${filename_pattern}")
  
  # Write content
  echo "$content" > "$file"
  git add "$file"
  
  # Run Hook
  # Note: The hook checks staged files.
  if "$HOOK_PATH" >/dev/null 2>&1; then
    HOOK_EXIT=0
  else
    HOOK_EXIT=1
  fi
  
  # Immediate cleanup for this test case
  git restore --staged "$file"
  rm "$file"
  
  # Verify result
  if [ $HOOK_EXIT -eq $should_pass ]; then
    echo "✅ PASSED"
    PASSED=$((PASSED + 1))
  else
    echo "❌ FAILED (Expected exit code $should_pass, got $HOOK_EXIT)"
  fi
}

echo "=== Starting DB Policy Verification (Non-Destructive) ==="

# Ensure apps/mysticos dir exists
mkdir -p apps/mysticos

# Case 1: TS file with forbidden command -> Should Block (1)
run_test "TS file with 'prisma migrate'" \
  "tmp_test_XXXX.ts" \
  "const cmd = 'pnpm exec prisma migrate deploy';" \
  1

# Case 2: DB URL in env file -> Should Block (1)
# Pattern: postgresql://...
SCHEME="postgresql"
CRED="user:pass"
HOST="host/db"
BAD_URL="${SCHEME}://${CRED}@${HOST}"

run_test "Real DB URL in .env file" \
  ".env.tmp_XXXX" \
  "DATABASE_URL='$BAD_URL'" \
  1

# Case 3: Markdown file with forbidden command -> Should Pass (0)
run_test "Markdown file with 'prisma migrate'" \
  "tmp_test_XXXX.md" \
  "Example: pnpm exec prisma migrate deploy" \
  0

echo ""
echo "=== Summary: $PASSED / $TOTAL Tests Passed ==="

# Check git status cleanliness
STATUS=$(git status --porcelain)
if [ -n "$STATUS" ]; then
  echo "❌ Error: Git status is not clean after tests:"
  echo "$STATUS"
  exit 1
fi

if [ $PASSED -eq $TOTAL ]; then
  exit 0
else
  exit 1
fi
