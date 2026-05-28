---
name: tickets-page-patterns
description: Key patterns, selectors, and decisions for the /tickets page E2E tests
metadata:
  type: project
---

## Route and access

`/tickets` is a protected route accessible to **all authenticated users** (admin and agent). Unauthenticated visitors are redirected to `/login`.

## Test file

`e2e/tests/tickets-page.spec.ts`

## Webhook helper in UI tests

Tickets have no seed data and no DELETE endpoint. Tests create tickets via the inbound webhook inside each test using `page.request.post(INBOUND_URL, ...)`. Because `page.request` shares the same browser context, cookies are included — but the inbound webhook uses `X-Webhook-Secret` header authentication, not session cookies, so this works regardless of auth state.

Use a unique `from` email address per ticket within the same test run to avoid the 409 duplicate-payload check (which deduplicates on `from + subject + body`).

## Reload pattern after webhook create

The page does not auto-refresh. After creating a ticket via the API, call `await page.reload()` followed by `await page.waitForURL("/tickets")` and wait for `page.getByRole("table")` to be visible before asserting row content.

## Row locator pattern

```typescript
const row = page.locator("tr", { hasText: subject });
```

Scope all column assertions to the `row` locator to avoid matching cells in other rows.

## Status badge selector

The `StatusBadge` component renders inline `<span>` elements. Use `row.getByText("Open", { exact: true })` to match the badge text. The `exact: true` flag avoids false matches if "Open" appears elsewhere in the row.

## Category em-dash assertion

When a ticket has no category, the Category cell renders:

```html
<span class="text-muted-foreground">—</span>
```

Assert with `row.getByText("—")`. New tickets created via the webhook will always have no category (classification happens asynchronously in the AI service).

## Ordering assertion pattern

To verify newest-first ordering without relying on pixel positions, collect `allTextContents()` from `tbody tr td:first-child` and compare `indexOf`:

```typescript
const allSubjects = await page.locator("tbody tr td:first-child").allTextContents();
const newerIdx = allSubjects.findIndex((t) => t.includes(newerSubject));
const olderIdx = allSubjects.findIndex((t) => t.includes(olderSubject));
expect(newerIdx).toBeLessThan(olderIdx);
```

## Count subtitle locator

The subtitle is rendered as:

```tsx
<p className="text-sm text-muted-foreground mt-1">
  {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
</p>
```

Target it with `page.locator("p.text-sm.text-muted-foreground").first()`. Singular: "1 ticket". Plural: "N tickets".

## Tickets nav link

The NavBar always renders a `<NavLink to="/tickets">Tickets</NavLink>` for all authenticated roles. Select with `page.getByRole("link", { name: "Tickets" })`.
