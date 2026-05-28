---
name: users-page-patterns
description: Key patterns, selectors, and pitfalls discovered when writing and running the users CRUD E2E tests
metadata:
  type: project
---

## Role badge selector

The `RoleBadge` component renders as a `<span>`. When the row locator is `page.locator("tr", { hasText: email })`, using `.getByText("Agent")` causes a strict-mode violation because the cell text (e.g., "Created Agent") also contains the substring "Agent". The correct selector is:

```typescript
page.locator("tr", { hasText: email }).locator("span", { hasText: "Agent" })
page.locator("tr", { hasText: email }).locator("span", { hasText: "Admin" })
```

## Better Auth email uniqueness across soft-deletes

The server's `DELETE /api/users/:id` is a **soft delete** (sets `deletedAt`). However, Better Auth's own User/Account tables are not touched — the email remains registered in Better Auth's internal tables. If a test creates a user with email X, soft-deletes it, then tries to create another user with email X, the `POST /api/users` call fails with a 422 "User already exists" from Better Auth, which manifests as a 500 from the server.

**Fix:** Use a unique email per test via a counter-based generator:

```typescript
let emailSeq = 0;
function uniqueEmail(prefix: string): string {
  return `${prefix}-${++emailSeq}@e2e.example.com`;
}
```

## Count-based subtitle assertions

The subtitle `<p>` shows `"N user(s)"`. Asserting the count as `rowsBefore + 1` or `rowsBefore - 1` is fragile because TanStack Query's client-side cache can cause a freshly navigated page to briefly show stale data. `rowsBefore` might be captured from the cached render, not the fresh fetch.

**Fix:** Derive the expected label from the actual count *after* the mutation, not from `countBefore ± 1`:

```typescript
// After the dialog closes and the table updates:
const countAfter = await page.locator("tbody tr").count();
const label = countAfter === 1 ? "1 user" : `${countAfter} users`;
await expect(page.getByText(label)).toBeVisible();
```

For Cancel tests, assert the specific email is absent rather than comparing row counts.

## Fixture user cleanup pattern for Create tests

When a test creates a user via the UI (not the API), its id is unknown up front. Use `findUserIdByEmail` via `page.request.get` to look up the id, then delete:

```typescript
const id = await findUserIdByEmail(page.request, email);
if (id) await deleteUser(page.request, id);
```

Note: `page.request` shares the browser context's cookie jar, so the admin session cookie is automatically sent with these API calls.

## Edit/Delete setup: create via API, reload page

Tests that need a specific user to already exist before opening a dialog should:
1. Call `createUser(page.request, { ... })` to create via API (returns the user id)
2. Call `await page.reload()` followed by `await page.waitForURL("/users")` and `await expect(table).toBeVisible()` to ensure the new row is rendered

Do not create users through the UI in a `beforeEach` — that couples setup to the feature under test.

## Seed script bug fix

The seed script at `server/prisma/seed.ts` was importing `Role` from `../src/db` (which never exported it). The correct import is:

```typescript
import { Role } from "@helpdesk/core";
import prisma from "../src/db";
```

This was fixed as part of the users test work. [[seed-script-changes]]
