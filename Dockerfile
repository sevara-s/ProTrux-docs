FROM node:22-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Copy monorepo configuration
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
COPY apps/web ./apps/web

# Build shared, server, and web
RUN pnpm build

# Production runner stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Copy built artifacts and configurations
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/dist ./packages/shared/dist
COPY apps/server/package.json ./apps/server/
COPY apps/server/dist ./apps/server/dist
COPY apps/web/package.json ./apps/web/
COPY apps/web/dist ./apps/web/dist

# Install production dependencies only
RUN pnpm install --prod

# Expose HTTP and WebSocket port
EXPOSE 4000

# Create data directory for SQLite persistence
VOLUME [ "/app/data" ]

CMD ["node", "apps/server/dist/index.js"]
