# ── Build stage ───────────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy workspace manifests first — better layer caching (changes rarely)
COPY package.json bun.lock ./
COPY core/package.json    ./core/
COPY client/package.json  ./client/
COPY server/package.json  ./server/
COPY e2e/package.json     ./e2e/

# Install all dependencies (dev included — Vite, tsc, Prisma CLI needed for build)
RUN bun install --frozen-lockfile

# Copy source files
COPY core/   ./core/
COPY client/ ./client/
COPY server/ ./server/

# Build server FIRST → server/dist/  (prisma generate + tsc)
# prisma generate must run before any TypeScript compilation across the workspace
RUN bun run --filter server build

# Build client → client/dist/  (tsc -b + vite build)
RUN bun run --filter client build


# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Copy workspace manifests + lockfile so `bun install` can run in this stage.
# Bun stores packages in a global cache — copying node_modules from the builder
# would copy an empty directory, so we reinstall here instead.
COPY --from=builder /app/package.json  ./package.json
COPY --from=builder /app/bun.lock      ./bun.lock
COPY --from=builder /app/core/package.json    ./core/package.json
COPY --from=builder /app/client/package.json  ./client/package.json
COPY --from=builder /app/server/package.json  ./server/package.json
COPY --from=builder /app/e2e/package.json     ./e2e/package.json

# Install all deps (includes prisma CLI needed for migrate deploy at startup)
RUN bun install --frozen-lockfile

# @helpdesk/core source (workspace symlink target)
COPY --from=builder /app/core ./core

# Compiled server output (includes compiled Prisma client at server/dist/generated/)
COPY --from=builder /app/server/dist             ./server/dist

# Prisma migration files + config (needed by `prisma migrate deploy` at startup)
COPY --from=builder /app/server/prisma           ./server/prisma
COPY --from=builder /app/server/prisma.config.ts ./server/prisma.config.ts

# AI knowledge base — loaded at runtime by autoResolveTicket
COPY --from=builder /app/server/knowledge-base.md ./server/knowledge-base.md

# Built React app — served statically by Express in production
COPY --from=builder /app/client/dist ./client/dist

# Startup script (strip Windows CRLF line endings if present, then make executable)
COPY start.sh ./
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

EXPOSE 3000

CMD ["sh", "start.sh"]
