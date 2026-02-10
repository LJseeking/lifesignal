#!/bin/bash
# backend/scripts/ops/health-watch.sh
# 简易看门狗脚本：定期检查服务健康状态
# 用法: ./backend/scripts/ops/health-watch.sh

URL="http://localhost:4000/healthz"
INTERVAL=10

echo "🐶 Starting Health Watchdog..."
echo "Target: $URL"
echo "Interval: ${INTERVAL}s"
echo "Press Ctrl+C to stop."

while true; do
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
  
  # Capture HTTP Status Code
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  
  if [ "$STATUS" -eq 200 ]; then
    echo "[$TIMESTAMP] ✅ UP (200 OK)"
  else
    echo "[$TIMESTAMP] ❌ DOWN (Status: $STATUS)"
    # 可在此处添加报警逻辑，如发送 Slack/Email
    # ./alert.sh "Service Down! Status: $STATUS"
  fi
  
  sleep $INTERVAL
done
