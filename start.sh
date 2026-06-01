#!/bin/sh
set -e

# Run Prisma migrations from the server directory (where prisma.config.ts lives)
cd /app/server
bunx prisma migrate deploy
cd /app

# Start the server from repo root so process.cwd() resolves client/dist correctly
exec bun server/dist/index.js
