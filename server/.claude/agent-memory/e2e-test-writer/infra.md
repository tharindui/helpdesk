---
name: infra
description: Playwright test infrastructure — ports, env files, global-setup behaviour, workers, browser
metadata:
  type: project
---

- Test server: port **3001** (`server/.env.test` sets `PORT=3001`)
- Test Vite client: port **5174**
- Always use absolute URLs like `http://localhost:3001/api/...` in `request` fixture calls — they bypass the Vite proxy
- `workers: 1` — fully serial execution, no parallelism
- Browser: Chromium only
- Global setup (`e2e/global-setup.ts`): runs `prisma migrate reset --force` then seeds admin + agent users before every full test run
- Seeded credentials: admin `admin@example.com` / `password123`, agent `agent@example.com` / `password123`
- Sign-in URL: `http://localhost:3001/api/auth/sign-in/email`

**Why:** test DB (`helpdesk_test`) is completely reset on each run, so tests that create data do not need to clean up between runs — but within a single run they must use unique identifiers (e.g. `Date.now()` in subjects) to avoid collisions.

**How to apply:** When writing new tests, always reference port 3001 for API calls and 5174 for browser navigation. Use unique values in payloads rather than relying on teardown.
