# Implementation Plan

## Phase 1 — Project Setup & Infrastructure

- [ ] Initialise monorepo folder structure (`/client`, `/server`)
- [ ] Set up Node.js + Express server with TypeScript
- [ ] Set up React app with TypeScript (Vite)
- [ ] Set up PostgreSQL and Prisma in the server


---

## Phase 2 — Authentication

- [ ] Add `express-session` and `connect-pg-simple` for database-backed sessions
- [ ] Create `POST /api/auth/login` endpoint
- [ ] Create `POST /api/auth/logout` endpoint
- [ ] Create `GET /api/auth/me` endpoint to return the current session user
- [ ] Build auth middleware to protect routes by role (admin, agent)
- [ ] Build login page in React (email + password form)
- [ ] Implement session-aware API client in React (Axios or Fetch wrapper)
- [ ] Redirect unauthenticated users to login; redirect authenticated users away from login
- [ ] Seed the database with the initial admin user on first deployment

---

## Phase 3 — Ticket Management (Core)

- [ ] Extend Prisma schema: ticket status (open, resolved, closed) and category (general, technical, refund)
- [ ] Create `GET /api/tickets` — list tickets with filtering (status, category) and sorting
- [ ] Create `GET /api/tickets/:id` — get a single ticket with full detail
- [ ] Create `POST /api/tickets` — create a ticket manually
- [ ] Create `PATCH /api/tickets/:id` — update status or category
- [ ] Build ticket list page with filter and sort controls
- [ ] Build ticket detail page (read-only view of ticket content and metadata)
- [ ] Build ticket status transition controls (open → resolved → closed)

---

## Phase 4 — User Management (Admin)

- [ ] Create `GET /api/users` — list all agents (admin only)
- [ ] Create `POST /api/users` — create a new agent (admin only)
- [ ] Create `PATCH /api/users/:id` — deactivate or update an agent (admin only)
- [ ] Build user management page: agent list and create agent form
- [ ] Enforce role-based access in both API middleware and React routes

---

## Phase 5 — Email Integration

- [ ] Choose and configure SendGrid or Mailgun account and API keys
- [ ] Create `POST /api/tickets/inbound` webhook endpoint to receive inbound emails and create tickets
- [ ] Parse inbound email payload: extract sender, subject, and body into a ticket
- [ ] Create email service module for sending outbound replies to the original sender
- [ ] Trigger outbound reply email when an agent submits a response on the ticket detail page
- [ ] Test inbound → ticket creation → reply flow end to end

---

## Phase 6 — AI Features

- [ ] Configure Anthropic Claude API client in the server
- [ ] On ticket creation, call Claude to classify the ticket category (general, technical, refund)
- [ ] On ticket creation, call Claude to generate a short AI summary of the ticket
- [ ] On ticket detail page load, call Claude to generate a suggested reply using the knowledge base
- [ ] Display AI classification, summary, and suggested reply on the ticket detail page
- [ ] Allow agents to edit the suggested reply before sending
- [ ] Add basic knowledge base content (static documents or FAQ entries) for Claude to reference

---

## Phase 7 — Dashboard

- [ ] Create `GET /api/dashboard/stats` endpoint: total tickets, open count, resolved count, closed count, breakdown by category
- [ ] Build dashboard page displaying summary stat cards
- [ ] Add recent tickets list to the dashboard
- [ ] Add filtering by date range on the dashboard stats

---

## Phase 8 — Deployment & Polish

- [ ] Write production `Dockerfile` for the server
- [ ] Write production `Dockerfile` for the client (static build served via Nginx)
- [ ] Update `docker-compose.yml` for production (env vars, volume mounts, restart policies)
- [ ] Add database migration step to the Docker startup sequence
- [ ] Add seed step to create the initial admin if no users exist
- [ ] Final review: error handling, loading states, empty states across all pages
- [ ] Manual end-to-end test of the full flow: inbound email → ticket → AI classification → agent reply → outbound email
