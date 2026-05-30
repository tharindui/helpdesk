---
name: ticket-detail-patterns
description: Key patterns, selectors, and decisions for the /tickets/:id detail page E2E tests
metadata:
  type: project
---

## Route and access

`/tickets/:id` is a protected route accessible to all authenticated users. Unauthenticated visitors are redirected to `/login`.

## Test file

`e2e/tests/ticket-detail.spec.ts`

## Navigation test pattern

Create a ticket via the inbound webhook to get a known `ticketId`, navigate to `/tickets`, wait for the table, then click the subject link. Playwright's `waitForURL` on `/tickets/:id` confirms navigation succeeded.

```typescript
await page.getByRole("link", { name: subject }).click();
await page.waitForURL(`/tickets/${ticketId}`);
```

Assert the page loaded by targeting the `<h1>` with the ticket subject:

```typescript
await expect(page.getByRole("heading", { name: subject, level: 1 })).toBeVisible();
```

## Reply submission pattern

1. Create a ticket via the webhook to get a clean, reply-free ticket.
2. Navigate directly to `/tickets/:id`.
3. Wait for the `<h1>` heading to confirm the ticket data has loaded (replies query fires in parallel, so the form is ready by this point).
4. Assert "No replies yet" is visible before submission.
5. Fill the textarea by placeholder `"Type your reply..."` and click `"Send reply"`.
6. Assert the reply text is visible — TanStack Query's `setQueryData` updates the list optimistically without a reload.
7. Assert "No replies yet" is no longer visible.

## Webhook helper

Reuse the same `createTicketViaWebhook` helper from [[tickets-page-patterns]]. Use `Date.now()` in both the subject and the reply body to make each test run unique and avoid any state leakage.

## Empty-state text

The reply list header renders one of two states:
- No replies: `"No replies yet"` (plain text node inside `<h2>`)
- Has replies: `"Replies (N)"` where N is the count

Use `page.getByText("No replies yet")` to assert before submission and `.not.toBeVisible()` after.
