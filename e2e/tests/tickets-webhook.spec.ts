import { test, expect } from "@playwright/test";

const SERVER_BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
const INBOUND_URL = `${SERVER_BASE}/api/tickets/inbound`;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Returns a base set of valid headers that will pass the secret check.
function webhookHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Webhook-Secret": WEBHOOK_SECRET,
  };
}

// Builds a valid inbound-email payload. Override individual fields to exercise
// specific validation paths.
function validPayload(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    from: "customer@example.com",
    fromName: "Test Customer",
    subject: "Help with my order",
    body: "I cannot find my order confirmation.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/inbound — happy paths", () => {
  test("valid payload with correct secret returns 201 and the created ticket", async ({
    request,
  }) => {
    // Use a unique subject so this test is independent of others even when
    // tickets are not cleaned up (no DELETE /api/tickets/:id endpoint exists).
    const subject = `Valid payload test — ${Date.now()}`;

    const res = await request.post(INBOUND_URL, {
      headers: webhookHeaders(),
      data: validPayload({ subject }),
    });

    expect(res.status()).toBe(201);

    const ticket = await res.json();

    // Shape assertions — all fields required by the spec must be present.
    expect(typeof ticket.id).toBe("number");
    expect(ticket.fromEmail).toBe("customer@example.com");
    expect(ticket.fromName).toBe("Test Customer");
    expect(ticket.subject).toBe(subject);
    expect(ticket.status).toBe("open");
    // createdAt should be a parseable ISO date string.
    expect(new Date(ticket.createdAt).getTime()).not.toBeNaN();
  });

  test("duplicate payload (same from + subject + body) returns 409 with the existing ticket", async ({
    request,
  }) => {
    const subject = `Duplicate test — ${Date.now()}`;
    const payload = validPayload({ subject });

    // First request creates the ticket.
    const first = await request.post(INBOUND_URL, {
      headers: webhookHeaders(),
      data: payload,
    });
    expect(first.status()).toBe(201);
    const created = await first.json();

    // Second request with identical from + subject + body must return 409.
    const second = await request.post(INBOUND_URL, {
      headers: webhookHeaders(),
      data: payload,
    });

    expect(second.status()).toBe(409);

    const body = await second.json();
    expect(body.error).toBe("Ticket already exists");

    // The response must include the previously created ticket.
    expect(body.ticket).toBeDefined();
    expect(body.ticket.id).toBe(created.id);
    expect(body.ticket.fromEmail).toBe(created.fromEmail);
    expect(body.ticket.subject).toBe(created.subject);
    expect(body.ticket.status).toBe("open");
  });
});

// ---------------------------------------------------------------------------
// Unhappy paths — authentication
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/inbound — secret validation", () => {
  test("wrong X-Webhook-Secret header returns 403", async ({ request }) => {
    const res = await request.post(INBOUND_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": "wrong-secret",
      },
      data: validPayload(),
    });

    expect(res.status()).toBe(403);
  });

  test("missing X-Webhook-Secret header returns 403", async ({ request }) => {
    const res = await request.post(INBOUND_URL, {
      headers: { "Content-Type": "application/json" },
      // Deliberately omit X-Webhook-Secret.
      data: validPayload(),
    });

    expect(res.status()).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Unhappy paths — body validation
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/inbound — body validation", () => {
  test("invalid email in `from` field returns 400 with errors.from", async ({
    request,
  }) => {
    const res = await request.post(INBOUND_URL, {
      headers: webhookHeaders(),
      data: validPayload({ from: "not-an-email" }),
    });

    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.errors).toBeDefined();
    expect(Array.isArray(body.errors.from)).toBe(true);
    expect(body.errors.from.length).toBeGreaterThan(0);
  });

  test("empty `fromName` returns 400 with errors.fromName", async ({
    request,
  }) => {
    const res = await request.post(INBOUND_URL, {
      headers: webhookHeaders(),
      data: validPayload({ fromName: "" }),
    });

    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.errors).toBeDefined();
    expect(Array.isArray(body.errors.fromName)).toBe(true);
    expect(body.errors.fromName.length).toBeGreaterThan(0);
  });

  test("whitespace-only `fromName` returns 400 with errors.fromName", async ({
    request,
  }) => {
    // The schema applies .trim() before .min(1), so whitespace-only input must
    // also be rejected.
    const res = await request.post(INBOUND_URL, {
      headers: webhookHeaders(),
      data: validPayload({ fromName: "   " }),
    });

    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.errors).toBeDefined();
    expect(Array.isArray(body.errors.fromName)).toBe(true);
    expect(body.errors.fromName.length).toBeGreaterThan(0);
  });

  test("empty `subject` returns 400 with errors.subject", async ({
    request,
  }) => {
    const res = await request.post(INBOUND_URL, {
      headers: webhookHeaders(),
      data: validPayload({ subject: "" }),
    });

    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.errors).toBeDefined();
    expect(Array.isArray(body.errors.subject)).toBe(true);
    expect(body.errors.subject.length).toBeGreaterThan(0);
  });

  test("whitespace-only `subject` returns 400 with errors.subject", async ({
    request,
  }) => {
    const res = await request.post(INBOUND_URL, {
      headers: webhookHeaders(),
      data: validPayload({ subject: "   " }),
    });

    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.errors).toBeDefined();
    expect(Array.isArray(body.errors.subject)).toBe(true);
    expect(body.errors.subject.length).toBeGreaterThan(0);
  });

  test("empty `body` field returns 400 with errors.body", async ({
    request,
  }) => {
    const res = await request.post(INBOUND_URL, {
      headers: webhookHeaders(),
      data: validPayload({ body: "" }),
    });

    expect(res.status()).toBe(400);

    const responseBody = await res.json();
    expect(responseBody.errors).toBeDefined();
    expect(Array.isArray(responseBody.errors.body)).toBe(true);
    expect(responseBody.errors.body.length).toBeGreaterThan(0);
  });

  test("whitespace-only `body` field returns 400 with errors.body", async ({
    request,
  }) => {
    const res = await request.post(INBOUND_URL, {
      headers: webhookHeaders(),
      data: validPayload({ body: "   " }),
    });

    expect(res.status()).toBe(400);

    const responseBody = await res.json();
    expect(responseBody.errors).toBeDefined();
    expect(Array.isArray(responseBody.errors.body)).toBe(true);
    expect(responseBody.errors.body.length).toBeGreaterThan(0);
  });
});
