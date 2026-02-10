#!/bin/bash
set -e

# backend/scripts/local-smoke.sh
# 安全加载本地 .env 配置并运行 Smoke Test
# 用法: ./backend/scripts/local-smoke.sh

# 0. 检查目录
if [ ! -f "backend/scripts/smoke.ts" ]; then
  echo "❌ Error: Please run from project root."
  exit 1
fi

echo "🔥 Preparing Local Smoke Test..."

# 1. 安全加载 .env (POSIX compliant, no xargs/grep hacks)
if [ -f .env ]; then
  echo "📄 Loading .env file..."
  # set -a 自动导出后续定义的变量
  set -a
  source .env
  set +a
else
  echo "⚠️  Warning: .env file not found. Ensuring mandatory vars are set..."
  if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET is not set and no .env found."
    exit 1
  fi
fi

# 2. 生成并注入 Token
# 使用 eval 执行 generate-token.ts 输出的 export 命令
echo "🔑 Generating Smoke Token..."
TOKEN_CMD=$(npx ts-node backend/scripts/generate-token.ts)
if [ $? -ne 0 ]; then
  echo "❌ Failed to generate token."
  exit 1
fi
eval "$TOKEN_CMD"

# Double check
if [ -z "$SMOKE_TOKEN" ]; then
  echo "❌ SMOKE_TOKEN failed to export."
  exit 1
fi
echo " ✅ Token generated."

# 3. 基础连通性验证 (curl)
echo "📡 Verifying API Connectivity..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $SMOKE_TOKEN" http://localhost:4000/credits/summary)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo " ✅ API is reachable and Auth works (200 OK)."
else
  echo " ❌ API check failed with status $HTTP_CODE. Is the server running?"
  exit 1
fi

# 4. 运行完整 Smoke Test
echo "🚀 Running Full Smoke Suite..."
npx ts-node backend/scripts/smoke.ts
