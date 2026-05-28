---
name: tickets-webhook
description: Coverage, patterns, and setup notes for the tickets-webhook E2E spec
metadata:
  type: project
---

Test file: `e2e/tests/tickets-webhook.spec.ts`

## What is tested

- POST /api/tickets/inbound — public webhook secured by `X-Webhook-Secret` header
- Happy path: 201 with full ticket shape (id, fromEmail, fromName, subject, status: "open", createdAt)
- Duplicate detection: same from+subject+body → 409 with `{ error: "Ticket already exists", ticket: {...} }`
- Auth failures: wrong secret → 403, missing secret → 403
- Validation failures: invalid email in `from`, empty/whitespace-only `fromName`, `subject`, `body` → 400 with `errors.<field>`
- Whitespace trim is tested separately for `fromName`, `subject`, `body` (schema uses `.trim().min(1)`)

## Env fix applied

`WEBHOOK_SECRET` was missing from `server/.env.test`. Added `WEBHOOK_SECRET="test-webhook-secret"`. The server throws at startup if this var is absent — tests would fail to start without it.

## Cleanup approach

No `DELETE /api/tickets/:id` endpoint exists. Tests use `Date.now()` in subjects to generate unique payloads so re-runs within the same DB session do not collide. DB is reset by global-setup on the next full run.

## Patterns established

- Pure API tests use `request` fixture only — no `page`, no login
- Helper `webhookHeaders()` returns headers with the secret; `validPayload(overrides)` builds a base-valid body
- Local variable named `responseBody` (not `body`) for `body` field tests to avoid shadowing the JSON key name
