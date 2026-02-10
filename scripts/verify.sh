#!/bin/bash
ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
echo "🔍 Verifying LifeSignal Monorepo at $ROOT..."
check() { if [ -e "$1" ]; then echo "✅ Found: $1"; else echo "❌ MISSING: $1"; exit 1; fi; }
check "$ROOT/apps/ledger/backend/package.json"
check "$ROOT/apps/mysticos/package.json"
check "$ROOT/apps/listener/package.json"
check "$ROOT/data/charges.sqlite"
echo "Verification Passed"
