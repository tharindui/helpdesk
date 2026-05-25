---
name: seed-script-changes
description: Changes made to server/prisma/seed.ts and server/.env.test to support deterministic E2E test credentials
metadata:
  type: project
---

## server/prisma/seed.ts — changes

**Before:** Only seeded the admin user; used `crypto.randomUUID()` as the admin password (non-deterministic).

**After:**
1. Reads `SEED_ADMIN_PASSWORD` env var and uses it as the admin password (falls back to `crypto.randomUUID()` when not set, preserving existing dev-env behaviour).
2. Also seeds the agent user `agent@example.com` / `password123` / name `"Agent"` with default role `agent`.
3. Both user creation blocks are idempotent (check for existing user first, skip if found).

**Why:** The E2E tests require known, deterministic credentials for both roles. The original seed script printed a random admin password to stdout — fine for dev, but unusable by automated tests.

## server/.env.test — changes

**Before:** No `SEED_ADMIN_PASSWORD` variable.

**After:** Added `SEED_ADMIN_PASSWORD="password123"`.

**Why:** Without this var, `seed.ts` falls back to `crypto.randomUUID()` even in the test environment, making the admin password unknown to tests.

**How to apply:** If you need additional seeded users for new tests, add them to `seed.ts` with hardcoded credentials (since this is a test-only seed, deterministic passwords are fine and expected).
