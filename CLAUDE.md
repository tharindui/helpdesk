# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

Use the **context7 MCP server** to fetch up-to-date documentation for any library used in this project before implementing features or debugging. Key libraries to look up via context7: React, Express, Prisma, Tailwind CSS, Vite, Anthropic SDK, express-session, connect-pg-simple, SendGrid/Mailgun, Better Auth, shadcn/ui, Zod.

## Project Overview

AI-powered helpdesk ticket management system. Support emails arrive via webhook, are stored as tickets, and AI (Claude API) handles classification, summarisation, and suggested replies. Agents review and send responses; admin manages agents.

**Roles:** Admin (full access, created at seed time) and Agent (ticket management only).  
**Ticket statuses:** New → Processing → Resolved (AI auto-resolved, hidden from list) or Open (needs agent) → Resolved → Closed.  
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

- Entry point: `src/index.ts` — creates the Express app, registers middleware (CORS restricted to localhost, JSON body parser), mounts routes. Startup logic (queue init + server listen + signal handlers) is wrapped in a `boot()` function called at the bottom of the file.
- CORS is configured with `credentials: true` to support cookie-based sessions.
- Runtime is **Bun** (not Node CLI); use `bun --watch` in dev and `bun dist/index.js` in production.
- **Express 5 async error handling:** Express 5 automatically forwards rejected promises from async route handlers to error middleware — do **not** wrap route bodies in `try/catch`. Only use `try/catch` when you need to handle a specific error locally (e.g. to return a different status code for a known failure). The centralized error handler is in `src/middleware/errorHandler.ts` and must be registered last in `index.ts`.

### Background Queue (pg-boss)

- **`server/src/queue.ts`** — pg-boss singleton. Exports `startQueue()`, `stopQueue()`, `sendClassifyJob(ticket)`. `startQueue()` is called inside `boot()` in `index.ts`. `stopQueue()` is registered for `SIGTERM`/`SIGINT`.
- **`server/src/workers/classifyTicket.ts`** — worker that runs for every new ticket. Sets status to `processing`, then runs `classifyTicket` and `autoResolveTicket` in parallel:
  - If AI can resolve: creates an `ai`-typed reply + sets ticket to `resolved`.
  - If AI cannot resolve: sets ticket to `open` so agents can handle it.
- pg-boss v12: requires `boss.createQueue(name)` before `boss.work()`. Worker handler receives `jobs[]` (array), not a single job.
- Job tables live in the `pgboss` schema in PostgreSQL (not `public`).

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
- **Pages built:** `LoginPage` (email/password form), `HomePage` (placeholder dashboard), `UsersPage` (admin only — full CRUD: list, add, edit, delete users), `TicketsPage` (paginated ticket list with sort/filter/search), `TicketDetailPage` (ticket detail, status/category/assignee editing, reply thread).
- **Shared layout:** `src/components/AppLayout.tsx` — renders `NavBar`, `<main>` with `max-w-5xl` container via `<Outlet />`, and a `<footer>`. All authenticated pages nest under this; pages render only their own content, not a full-page wrapper.
- **Custom shared components** live in `src/components/` (not `ui/` — that is shadcn only). Current custom components: `AlertMessage`, `AssigneeCombobox`, `TicketBadges`.

### Page Folder Structure

Pages are organised into **feature subfolders** under `src/pages/`. Each feature folder owns all its components, hooks, API module, and tests:

```
src/pages/
  tickets/
    __tests__/          ← ticket-scoped mocks, renders, and test files
    CategorySelect.tsx
    ReplyForm.tsx
    ReplyThread.tsx
    StatusSelect.tsx
    TicketCard.tsx
    TicketDetailPage.tsx
    TicketDetailSkeleton.tsx
    TicketTable.tsx
    TicketsPage.tsx
    ticketsApi.ts
    useTickets.ts
  users/
    __tests__/          ← user-scoped mocks, renders, and test files
    UserDialog.tsx
    UsersPage.tsx
    usersApi.ts
    useUsers.ts
  HomePage.tsx          ← no related files, stays at root
  LoginPage.tsx         ← no related files, stays at root
```

**Single-responsibility page rule:** pages with significant UI are split into focused modules:
- `<FeaturePage>.tsx` — data layer only: runs all `useQuery`/`useMutation` hooks, handles loading/error states, passes data down.
- `<FeatureCard>.tsx` — main content card: receives data and handlers as props, renders the full UI.
- `<FeatureSkeleton>.tsx` — skeleton placeholder shown while data loads.
- Sub-components (e.g. `ReplyForm.tsx`, `ReplyThread.tsx`, `StatusSelect.tsx`) — single-purpose, receive only what they need via props.

**Cross-feature imports** are fine (e.g. `tickets/TicketCard.tsx` imports `Assignee` type from `../users/usersApi`) — avoid copying types across features.

### UI Conventions

- Always use **shadcn CSS tokens** (`bg-background`, `text-muted-foreground`, `border-border`, `text-destructive`, etc.) — never raw Tailwind color classes like `bg-gray-50` or `text-blue-600`.
- Use `aria-invalid={!!error}` on `Input` components to trigger error styling — do not use conditional classNames.
- Error messages: `text-xs text-destructive` below the field.
- Page/form-level alerts: use `<AlertMessage>` from `src/components/AlertMessage.tsx` — never write inline alert divs. Props: `message: string`, `variant?: "error" | "success" | "warning"` (default `"error"`), optional `className` for spacing. Example: `<AlertMessage message="Something went wrong." variant="error" className="mb-4" />`. Inline error colours for reference: error = `bg-destructive/10 border-destructive/30 text-destructive`, success = `bg-green-50 border-green-200 text-green-800`, warning = `bg-amber-50 border-amber-200 text-amber-800` — but always go through the component, never repeat these inline.
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

Component tests are the **primary testing layer**. Default to writing component tests for all UI logic — they run fast, need no server, and can cover every rendering case in isolation.

- **Stack:** Vitest 4, React Testing Library, `@testing-library/user-event`, `happy-dom` (not jsdom — Windows EPERM issues with jsdom on Bun).
- **Run:** `bun run --filter client test` (once) or `bun run --filter client test:watch` (watch mode). Do **not** run `vitest` directly or `bun test` — `bun test` invokes Bun's built-in runner instead of Vitest.
- **File structure:** test files live in a `__tests__/` subdirectory **inside each feature folder** (e.g. `pages/tickets/__tests__/`, `pages/users/__tests__/`). Each `__tests__/` folder is self-contained — never share `mocks.ts` or `renders.tsx` across feature folders. Three modules per feature:
  - `mocks.ts` — types and factory functions scoped to that feature (e.g. `makeTicket`, `makeUser`), pure data only. Import from the sibling API module (`../ticketsApi`, `../usersApi`).
  - `renders.tsx` — render helpers for that feature's components, wrapping with required providers (`QueryClientProvider`, `MemoryRouter`, etc.)
  - `<ComponentName>.test.tsx` — `vi.mock` declarations (must stay here — Vitest hoists them) + all `describe`/`it` blocks
- **`shadcn/ui` heading caveat:** `CardTitle` renders as a `<div>`, not a heading element — `getByRole("heading")` will not find it. Use `getByText` or assert on URL/button instead.
- **Mocking axios:** mock `@/lib/axios` with a `vi.fn()` object; use `vi.mocked(api.get).mockResolvedValue(...)` — never use `as ReturnType<typeof vi.fn>` casts (causes IDE type errors).
- **QueryClient in tests:** create a fresh `QueryClient` per test with `retry: false` (so errors surface immediately without retry delays).
- **`@testing-library/dom`** must be installed explicitly as a dev dependency — Bun does not auto-install peer dependencies, and `@testing-library/react` re-exports `screen`, `waitFor`, `within` from it.
- **What belongs here:** loading/skeleton states, error states, empty states, badge rendering, data display, counts, date formatting, render order — anything that can be verified by mocking the API response.

### E2E Testing (Playwright)

E2E tests are reserved for scenarios that **cannot be covered by component tests**: real browser navigation, real auth cookie flows, routing/redirects, and full-stack integration (e.g. webhook → DB → UI). Do not write E2E tests for UI rendering logic already covered by component tests.

**When to write E2E tests:**
- Auth redirects (unauthenticated → `/login`, role-gated pages → `/`)
- Navigation (clicking nav links, verifying URL changes)
- Full-stack flows that require a real server and database

**When NOT to write E2E tests:** loading states, error messages, badge/label rendering, count displays, date formatting — use component tests for all of these.

Use the **`e2e-test-writer` agent** for all Playwright test work. Invoke it via the Agent tool whenever a feature is complete or E2E tests are explicitly requested — but only for the integration concerns listed above.

**Run E2E tests after every code change** — before reporting a task complete, always run:

```bash
bun run --filter e2e test
```

This requires the dev servers to be running (`bun dev`). The test database is separate from dev — the E2E suite manages its own seed data. If tests fail, fix the root cause before marking the task done.

### AI Integration

- AI calls are server-side only via **Vercel AI SDK** (`ai` package) with the **Groq provider** (`@ai-sdk/groq`, model: `llama-3.3-70b-versatile`). Configured in `server/src/services/ai.ts`.
- Groq does **not** support `json_schema` response format — use `generateText` with an explicit JSON prompt, then `JSON.parse(text.trim().replace(/^```json\n?|```$/g, ""))` to parse the result.
- **Four AI functions in `server/src/services/ai.ts`:**
  - `autoResolveTicket(subject, body, fromName)` — reads `server/knowledge-base.md` (loaded once at module init) and attempts to answer from it. Returns `{ canResolve: true, reply }` or `{ canResolve: false }`. Follows escalation rules in the KB. Addresses customer by first name (`fromName.trim().split(" ")[0]`).
  - `classifyTicket(subject, body)` — classifies into `general_question`, `technical_question`, or `refund_request`. Returns `TicketCategory | null`.
  - `summarizeTicket(subject, body, replies)` — summarises ticket + conversation in 2–4 sentences.
  - `polishReply(draft, agentName, ticketSubject, ticketBody, clientName)` — returns `{ polished, aiSuggestion }` as two alternative reply options.
- **Knowledge base:** `server/knowledge-base.md` — official support policies used by `autoResolveTicket`. Contains escalation rules (legal threats, refunds outside 30 days, chargebacks, account security) that prevent auto-resolution.
- **`SenderType.ai`** — used when creating replies from `autoResolveTicket`. Displayed as "AI Support" in the reply thread (right-aligned, same styling as agent replies).

### Ticket Lifecycle

Inbound tickets go through an AI-gated flow before reaching agents:

```
inbound webhook → status: new
  → pg-boss job → status: processing
    → autoResolveTicket answers from KB → status: resolved, reply created (senderType: ai)
    → autoResolveTicket cannot answer  → status: open (visible to agents)
```

- Tickets with status `new` or `processing` are **excluded from `GET /api/tickets`** by default (hidden while AI is working). Agents can still filter by those statuses explicitly.
- `resolved` and `closed` tickets remain visible in the list (filterable by status).
- The inbound route explicitly sets `status: TicketStatus.new` on creation.

### Email

- Inbound: webhook endpoint (`POST /api/tickets/inbound`) receives parsed emails from SendGrid/Mailgun and creates tickets.
- Outbound: email service module sends replies when an agent submits a response.
