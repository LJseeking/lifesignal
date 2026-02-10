# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable

# Copy root config files (for monorepo structure)
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Copy backend package config
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma/

# Install dependencies (frozen-lockfile for reproducibility)
# We install all dependencies because monorepo linking might require it
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend ./backend

# Generate Prisma Client (in backend directory)
RUN pnpm --dir backend prisma:generate

# Build application (in backend directory)
RUN pnpm --dir backend build

# Deploy backend to a separate directory (includes prod deps)
# This handles pnpm symlinks correctly for docker
RUN pnpm --filter=backend --prod deploy /app/deployed --legacy

# Capture Prisma Client to a fixed location (it could be in root node_modules or backend node_modules)
# We try both locations to be safe and fail if not found (removed 2>/dev/null to see errors)
# Debug: list locations to help troubleshoot
# Fix: use find to locate .prisma dynamically and copy its content
RUN mkdir -p /app/prisma-artifact && \
    find /app/node_modules -type d -name ".prisma" -exec cp -r {}/. /app/prisma-artifact/ \;

# Stage 2: Runner
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
# Default port, can be overridden
ENV PORT=4000 
# Fix: Ensure Node can find modules in root node_modules
ENV NODE_PATH=/app/node_modules

# Install openssl for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy deployed application from builder
# /app/deployed contains package.json, node_modules, and source (but we compiled to dist)
# Note: pnpm deploy copies source files. We need to ensure dist is there.
# pnpm deploy usually runs the 'install' script.
# We manually copy dist if deploy doesn't include build artifacts (it copies package content).
COPY --from=builder --chown=node:node /app/deployed ./
# Overwrite with built dist if needed (pnpm deploy might copy src but not dist if not configured)
COPY --from=builder --chown=node:node /app/backend/dist ./dist
# Ensure prisma is available for migrations
COPY --from=builder --chown=node:node /app/backend/prisma ./prisma
# Copy generated Prisma Client from captured artifact
COPY --from=builder --chown=node:node /app/prisma-artifact ./node_modules/.prisma

# Switch to non-root user
USER node

# Expose the application port
EXPOSE 4000

# Start the application
CMD ["node", "dist/index.js"]
