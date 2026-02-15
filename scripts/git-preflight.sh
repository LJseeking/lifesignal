#!/bin/bash
set -u

# Ensure we are at repo root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  echo "❌ Error: Not in a git repository."
  exit 1
fi
cd "$REPO_ROOT"

# Check index.lock
if [ -f .git/index.lock ]; then
  echo "❌ Error: .git/index.lock exists. A git process may be running or crashed."
  echo "   Remove it manually if no git process is running: rm .git/index.lock"
  exit 1
fi

# Check .git ownership
GIT_OWNER=$(ls -ld .git | awk '{print $3}')
CURRENT_USER=$(whoami)

if [ "$GIT_OWNER" != "$CURRENT_USER" ]; then
  echo "❌ Error: .git directory is owned by $GIT_OWNER, but you are running as $CURRENT_USER."
  echo "   Fix ownership: sudo chown -R $CURRENT_USER .git"
  exit 1
fi

echo "✅ Git preflight check passed."
