# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

Use the **context7 MCP server** to fetch up-to-date documentation for any library used in this project before implementing features or debugging. Key libraries to look up via context7: React, Express, Prisma, Tailwind CSS, Vite, Anthropic SDK, express-session, connect-pg-simple, SendGrid/Mailgun, Better Auth, shadcn/ui, Zod.

## Project Overview

AI-powered helpdesk ticket management system. Support emails arrive via webhook, are stored as tickets, and AI (Claude API) handles classification, summarisation, and suggested replies. Agents review and send responses; admin manages agents.

**Roles:** Admin (full access, created at seed time) and Agent (ticket management only).  
**Ticket statuses:** Open → Resolved → Closed.  
**Ticket categories:** General Question, Technical Question, Refund Request.

## Monorepo Structure

Bun workspaces with three packages: `client/` (React + Vite), `server/` (Node.js + Express + Bun runtime), and `core/` (shared Zod schemas, imported by both as `@helpdesk/core`). The client resolves `@helpdesk/core` via a Vite alias pointing directly at `core/src/index.ts`.

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

# Client: unit tests (run once)
bun run --filter client test

# Client: unit tests (watch mode)
bun run --filter client test:watch
```

The server runs on **port 3000**. The Vite dev server proxies `/api/*` requests to `http://localhost:3000`, so the client should call `/api/...` (not the absolute URL).

## Architecture

### Server (`server/src/`)

- Entry point: `src/index.ts` — creates the Express app, registers middleware (CORS restricted to localhost, JSON body parser), mounts routes, and starts the listener.
- CORS is configured with `credentials: true` to support cookie-based sessions.
- Runtime is **Bun** (not Node CLI); use `bun --watch` in dev and `bun dist/index.js` in production.
- Planned additions: route files per domain (tickets, users, dashboard), email service module, AI service module wrapping the Anthropic SDK.
- **Express 5 async error handling:** Express 5 automatically forwards rejected promises from async route handlers to error middleware — do **not** wrap route bodies in `try/catch`. Only use `try/catch` when you need to handle a specific error locally (e.g. to return a different status code for a known failure). The centralized error handler is in `src/middleware/errorHandler.ts` and must be registered last in `index.ts`.

### Authentication (Server)

- **`server/src/auth.ts`** — exports `auth`, the Better Auth instance. Uses the Prisma adapter (PostgreSQL). Email/password auth only; **sign-up is disabled** (`disableSignUp: true`) — users must be seeded. User has an additional `role` field (`"admin" | "agent"`, default `"agent"`, not user-settable via API).
- **Express mounting** (`index.ts`): auth routes registered **before** `express.json()` (Better Auth reads the raw body). `helmet()` and CORS (origin from `TRUSTED_ORIGINS` env var) applied globally. `authLimiter` (100 req / 15 min via `express-rate-limit`) applied to `/api/auth/*path` in **production only** (`NODE_ENV=production`).
- **`server/src/middleware/requireAuth.ts`** — exports two middleware: `requireAuth` (attaches `req.user` + `req.session`, returns 401 if no session or if user has `deletedAt` set) and `requireAdmin` (returns 403 if `req.user.role !== Role.admin`). Always chain as `requireAuth, requireAdmin` for admin-only routes — never rely on client-side guards alone.
- **`auth.ts` startup validation:** throws at startup if `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, or `TRUSTED_ORIGINS` are missing.
- Env vars required: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `TRUSTED_ORIGINS` (comma-separated), `NODE_ENV`.

### Client (`client/src/`)

- Entry point: `main.tsx` → `App.tsx`.
- **Tailwind CSS v4** via `@tailwindcss/vite` Vite plugin — no `tailwind.config.js`.
- **shadcn/ui** installed (style: `base-nova`, base color: `neutral`). Components live in `src/components/ui/`. Theme CSS variables are in `src/index.css` via `@theme inline`.
- **Path alias** `@` → `src/` configured in both `tsconfig.json` and `vite.config.ts`.
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters` enforced.
- **Routing:** React Router v7. Route guards in `App.tsx`: `ProtectedRoute` (any authenticated user), `AdminRoute` (admin role only, nested inside `ProtectedRoute`), `AppLayout` (shared layout — NavBar + footer — wrapping all authenticated pages via `<Outlet />`). Routes: `/login` (public), `/` (protected), `/users` (admin only). Catch-all redirects to `/`.
- **Auth:** Better Auth client in `src/lib/auth-client.ts` — uses `inferAdditionalFields<typeof auth>()` plugin to pull `role` typing from the server's `auth` instance. Use `authClient.useSession()` for session state (`session.user.name`, `.email`, `.role`), `authClient.signIn.email()` to log in, `authClient.signOut()` to log out.
- **HTTP client:** Axios. Use the shared instance at `src/lib/axios.ts` (pre-configured with `withCredentials: true`). Never use `fetch` directly.
- **Server state:** TanStack Query (`@tanstack/react-query`). `QueryClientProvider` is mounted in `App.tsx`. Use `useQuery` for data fetching and `useMutation` for create/update/delete. Update the cache via `queryClient.setQueryData` on mutation success — avoid unnecessary refetches.
- **Pages built:** `LoginPage` (email/password form), `HomePage` (placeholder dashboard), `UsersPage` (admin only — full CRUD: list, add, edit, delete users).
- **Shared layout:** `src/components/AppLayout.tsx` — renders `NavBar`, `<main>` with `max-w-5xl` container via `<Outlet />`, and a `<footer>`. All authenticated pages nest under this; pages render only their own content, not a full-page wrapper.

### UI Conventions

- Always use **shadcn CSS tokens** (`bg-background`, `text-muted-foreground`, `border-border`, `text-destructive`, etc.) — never raw Tailwind color classes like `bg-gray-50` or `text-blue-600`.
- Use `aria-invalid={!!error}` on `Input` components to trigger error styling — do not use conditional classNames.
- Error messages: `text-xs text-destructive` below the field; root-level errors: `bg-destructive/10 border border-destructive/30 text-destructive` alert div.
- Loading states: `<p className="text-sm text-muted-foreground">` on a `bg-background` full-screen div.
- NavBar pattern: sticky header with `backdrop-blur`, user avatar (initials), `Button variant="ghost"` with lucide icon. Use `NavLink` for nav links — active state `text-foreground font-medium`, inactive `text-muted-foreground hover:text-foreground`. Condition admin-only links on `session?.user.role === Role.admin`.

### Adding shadcn Components

Due to a corporate proxy TLS issue, prefix shadcn CLI commands with `NODE_TLS_REJECT_UNAUTHORIZED=0`:

```bash
cd client
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add <component>
```

Installed components: `button`, `input`, `label`, `card`, `dialog`, `skeleton`.

### Validation (Zod)

- Use **Zod** for all data validation at system boundaries: API request bodies (server-side), form inputs (client-side), and external data (webhook payloads, API responses).
- **Shared schemas and enums live in `core/src/`.** Schemas go in `core/src/schemas/`; shared enums (like `Role`) go in `core/src/enums.ts`. Anything used by both client and server must be defined in `@helpdesk/core` — never duplicate across packages. Server-only or client-only types stay local to that package.
- **`Role` enum:** Use `Role` from `@helpdesk/core` everywhere — `import { Role } from "@helpdesk/core"`. Never use magic strings `"admin"` or `"agent"` directly; always reference `Role.admin` or `Role.agent`. `Role` is a const-as-enum pattern (`{ admin: "admin", agent: "agent" } as const`) so it works as both a value and a type.
- Server: parse request bodies with `schema.safeParse(req.body)`; on failure return `400` with `{ errors: result.error.flatten().fieldErrors }`.
- Client: use **React Hook Form** with `zodResolver` from `@hookform/resolvers/zod`. Pass `zodResolver(schema)` to `useForm<z.infer<typeof schema>>`. Use `register`, `handleSubmit`, and `formState.errors` — never manage form state manually with `useState`.
- Render field errors with `{errors.field && <p className="text-xs text-destructive">{errors.field.message}</p>}` and `aria-invalid={!!errors.field}` on the input.
- Never use Zod `.parse()` in render paths; use `.safeParse()` so errors don't throw.
- Infer TypeScript types from schemas with `z.infer<typeof schema>` — do not maintain separate interface/type definitions for validated shapes.
- Always put `.trim()` before `.min(1)` on string fields so whitespace-only input is rejected after trimming.
- Do **not** use `.default()` in shared schemas — it makes the Zod input type optional, which conflicts with `useForm<z.infer<typeof schema>>`. Apply defaults in server route code instead (e.g. `const { role = Role.agent } = result.data`).

### Database

- PostgreSQL accessed through **Prisma**. Migrations and schema live in `server/prisma/`. Seed script at `server/prisma/seed.ts` creates the admin user (reads `SEED_ADMIN_EMAIL` env var, generates a random password).
- Sessions stored in Postgres by Better Auth (no JWTs). Better Auth tables (User, Session, Account, Verification) generated in `server/src/generated/prisma/`.
- Seeded users: admin (`SEED_ADMIN_EMAIL` env var, role: `admin`), agent (`agent@example.com` / `password123`, role: `agent`).
- To create additional users: instantiate a separate `betterAuth` instance with sign-up enabled, call `seedAuth.api.signUpEmail()`, then optionally `prisma.user.update()` to set the role.
- **Running Prisma CLI against a non-default database:** pass `DATABASE_URL` directly in the shell — `dotenv/config` in `prisma.config.ts` loads `.env` but won't override an already-set env var: `DATABASE_URL="..." bunx prisma migrate deploy`.

### Unit / Component Testing (Vitest + React Testing Library)

- **Stack:** Vitest 4, React Testing Library, `@testing-library/user-event`, `happy-dom` (not jsdom — Windows EPERM issues with jsdom on Bun).
- **Run:** `bun run --filter client test` (once) or `bun run --filter client test:watch` (watch mode). Do **not** run `vitest` directly or `bun test` — `bun test` invokes Bun's built-in runner instead of Vitest.
- **File structure:** test files live in a `__tests__/` subdirectory next to the source file, split into three modules:
  - `mocks.ts` — types, factory functions (`makeUser`, `makeAxiosError`), pure data only
  - `renders.tsx` — component render helpers wrapping with required providers (`QueryClientProvider`, etc.)
  - `<ComponentName>.test.tsx` — `vi.mock` declarations (must stay here — Vitest hoists them) + all `describe`/`it` blocks
- **Mocking axios:** mock `@/lib/axios` with a `vi.fn()` object; use `vi.mocked(api.get).mockResolvedValue(...)` — never use `as ReturnType<typeof vi.fn>` casts (causes IDE type errors).
- **QueryClient in tests:** create a fresh `QueryClient` per test with `retry: false` (so errors surface immediately without retry delays).
- **`@testing-library/dom`** must be installed explicitly as a dev dependency — Bun does not auto-install peer dependencies, and `@testing-library/react` re-exports `screen`, `waitFor`, `within` from it.

### E2E Testing (Playwright)

Use the **`e2e-test-writer` agent** for all Playwright test work — writing new tests, adding coverage for existing pages, or expanding the test suite. Invoke it via the Agent tool whenever a feature is complete or tests are explicitly requested.

### AI Integration

- Claude API (Anthropic SDK) called server-side only.
- Three use cases: ticket category classification (on creation), ticket summary (on creation), suggested reply (on ticket detail load, using a knowledge base).

### Email

- Inbound: webhook endpoint (`POST /api/tickets/inbound`) receives parsed emails from SendGrid/Mailgun and creates tickets.
- Outbound: email service module sends replies when an agent submits a response.
