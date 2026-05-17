# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

Use the **context7 MCP server** to fetch up-to-date documentation for any library used in this project before implementing features or debugging. Key libraries to look up via context7: React, Express, Prisma, Tailwind CSS, Vite, Anthropic SDK, express-session, connect-pg-simple, SendGrid/Mailgun.

## Project Overview

AI-powered helpdesk ticket management system. Support emails arrive via webhook, are stored as tickets, and AI (Claude API) handles classification, summarisation, and suggested replies. Agents review and send responses; admin manages agents.

**Roles:** Admin (full access, created at seed time) and Agent (ticket management only).  
**Ticket statuses:** Open → Resolved → Closed.  
**Ticket categories:** General Question, Technical Question, Refund Request.

## Monorepo Structure

Bun workspaces with two packages: `client/` (React + Vite) and `server/` (Node.js + Express + Bun runtime).

## Commands

Run from the repo root unless otherwise noted.

```bash
# Start both client and server in dev mode
bun dev

# Start only one workspace
bun run --filter client dev
bun run --filter server dev

# Build all
bun build

# Server: type-check only
cd server && bun run build   # tsc, outputs to server/dist/

# Client: type-check + bundle
cd client && bun run build   # tsc -b && vite build
```

The server runs on **port 3000**. The Vite dev server proxies `/api/*` requests to `http://localhost:3000`, so the client should call `/api/...` (not the absolute URL) once the proxy is in place.

## Architecture

### Server (`server/src/`)

- Entry point: `src/index.ts` — creates the Express app, registers middleware (CORS restricted to localhost, JSON body parser), mounts routes, and starts the listener.
- CORS is configured with `credentials: true` to support cookie-based sessions.
- Runtime is **Bun** (not Node CLI); use `bun --watch` in dev and `bun dist/index.js` in production.
- Planned additions: Prisma client, `express-session` + `connect-pg-simple` for database sessions, route files per domain (auth, tickets, users, dashboard), email service module, AI service module wrapping the Anthropic SDK.

### Client (`client/src/`)

- Entry point: `main.tsx` → `App.tsx`.
- Tailwind CSS v4 is loaded via the `@tailwindcss/vite` Vite plugin (no `tailwind.config.js` needed).
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters` enforced.
- Planned additions: React Router for page routing, an API client wrapper (Axios or fetch), auth context/guard, pages for Login, Ticket List, Ticket Detail, User Management, Dashboard.

### Database

- PostgreSQL accessed through **Prisma**. Migrations and schema will live in `server/prisma/`.
- Sessions stored in Postgres via `connect-pg-simple` (no JWTs).

### AI Integration

- Claude API (Anthropic SDK) called server-side only.
- Three use cases: ticket category classification (on creation), ticket summary (on creation), suggested reply (on ticket detail load, using a knowledge base).

### Email

- Inbound: webhook endpoint (`POST /api/tickets/inbound`) receives parsed emails from SendGrid/Mailgun and creates tickets.
- Outbound: email service module sends replies when an agent submits a response.
