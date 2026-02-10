#!/bin/bash
set -e

# backend/scripts/dev-up.sh
# 自动化启动开发环境（基于 Docker Compose v0.6）
# 用法: 
#   ./backend/scripts/dev-up.sh        (默认启动)
#   ./backend/scripts/dev-up.sh clean  (先清理旧容器和卷)

# 0. 检查是否在正确目录运行
if [ ! -f "docker-compose.yml" ]; then
  echo "❌ Error: Please run this script from the project root (where docker-compose.yml is located)."
  echo "   Usage: ./backend/scripts/dev-up.sh"
  exit 1
fi

echo "🚀 Starting Local Dev Environment (v0.6)..."

# 1. 可选：清理环境
if [ "$1" == "clean" ]; then
  echo "🧹 Cleaning up old containers and volumes..."
  docker compose down -v
fi

# 2. 启动数据库
echo "📦 Starting Postgres..."
docker compose up -d db

# 3. 等待数据库健康
echo "⏳ Waiting for DB to be healthy..."
until docker inspect --format "{{json .State.Health.Status}}" credits_db | grep -q "healthy"; do
  printf "."
  sleep 2
done
echo " ✅ DB is healthy!"

# 4. 执行数据库迁移 (Deploy Mode)
# 生产/类生产环境只运行 migrate deploy，严禁自动 migrate dev
echo "🔄 Running Migrations (Deploy Mode)..."
docker compose run --rm migrate

# 5. 启动后端服务
echo "🚀 Starting Backend..."
# Force recreate to pick up new env vars if any, and build to pick up code changes
docker compose up -d --force-recreate --build backend

# 6. 等待后端健康 (/healthz)
echo "⏳ Waiting for Backend to be healthy..."
MAX_RETRIES=30
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
  # 使用 HTTP 200 + JSON ok:true 双重校验
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/healthz)
  if [ "$HTTP_CODE" -eq 200 ]; then
    BODY=$(curl -s http://localhost:4000/healthz)
    if echo "$BODY" | grep -q '"ok":true'; then
      echo " ✅ Backend is healthy (Liveness)!"
      break
    fi
  fi
  printf "."
  sleep 2
  COUNT=$((COUNT+1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
  echo " ❌ Backend failed to start (Healthz check timeout). Logs:"
  docker logs credits_backend
  exit 1
fi

# 7. 检查数据库连接 (/readyz)
echo "🔌 Verifying DB Connection (Readiness)..."
HTTP_CODE_READY=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/readyz)
if [ "$HTTP_CODE_READY" -eq 200 ]; then
   echo " ✅ Backend is ready (DB Connected)!"
else
   echo " ⚠️  Backend is up but DB check failed (Status: $HTTP_CODE_READY). Check logs."
   docker logs credits_backend | tail -n 20
   exit 1
fi

echo "🎉 Dev Environment Up & Ready!"
echo "Next Step: Run local smoke tests via:"
echo "   ./backend/scripts/local-smoke.sh"
