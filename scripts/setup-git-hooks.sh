#!/bin/bash
set -euo pipefail
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-push
echo "✅ git hooks installed: core.hooksPath=.githooks"
