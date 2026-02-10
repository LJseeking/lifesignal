#!/bin/bash
set -e

# backend/scripts/ops/monitor.sh
# 实时监控容器状态与日志
# 用法: ./backend/scripts/ops/monitor.sh [stats|logs|all]

MODE=${1:-all}

echo "🔍 Starting Production Monitoring..."

if [ "$MODE" == "stats" ] || [ "$MODE" == "all" ]; then
  echo "📊 Container Resource Usage (One-shot):"
  docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
  echo ""
fi

if [ "$MODE" == "logs" ] || [ "$MODE" == "all" ]; then
  echo "📜 Recent Logs (Backend):"
  docker logs --tail 20 credits_backend
  echo ""
  echo "📜 Recent Logs (DB):"
  docker logs --tail 10 credits_db
  echo ""
fi

echo "💡 Tips:"
echo "  - Watch live stats: docker stats"
echo "  - Tail live logs:   docker logs -f credits_backend"
