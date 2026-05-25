---
name: test-credentials
description: Seeded test user credentials for the helpdesk_test database — emails, passwords, and names
metadata:
  type: project
---

Both users are seeded by `server/prisma/seed.ts` when run with `bun --env-file=.env.test`.

**Admin user**
- Email: `admin@example.com` (from `SEED_ADMIN_EMAIL` in `server/.env.test`)
- Password: `password123` (from `SEED_ADMIN_PASSWORD` in `server/.env.test`)
- Name: `"Admin"` (hardcoded in seed.ts)
- Role: `admin`

**Agent user**
- Email: `agent@example.com` (hardcoded in seed.ts)
- Password: `password123` (hardcoded in seed.ts)
- Name: `"Agent"` (hardcoded in seed.ts)
- Role: `agent` (default)

**Why:** Better Auth's `disableSignUp: true` means users must be seeded. The test database uses `prisma migrate reset --force --skip-seed` then runs `seed.ts` on every global-setup run, so credentials are always deterministic.

**How to apply:** Use these constants directly in test files. Do not hardcode credentials inline — reference `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AGENT_EMAIL`, `AGENT_PASSWORD` constants defined at the top of each spec file.
