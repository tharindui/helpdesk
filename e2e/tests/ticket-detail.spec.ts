import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";
const SIGN_IN_URL = "http://localhost:3001/api/auth/sign-in/email";
const INBOUND_URL = "http://localhost:3001/api/tickets/inbound";

async function loginAsAdmin(page: Page): Promise<void> {
  const response = await page.request.post(SIGN_IN_URL, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok()) {
    throw new Error(`Admin login failed: ${response.status()} ${await response.text()}`);
  }
}

async function createTicketViaWebhook(
  page: Page,
  subject: string
): Promise<number> {
  const response = await page.request.post(INBOUND_URL, {
    data: {
      from: `customer-${Date.now()}@test.com`,
      fromName: "Test Customer",
      subject,
      body: "This is a test ticket body created for E2E testing.",
    },
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.WEBHOOK_SECRET ?? "",
    },
  });
  if (!response.ok()) {
    throw new Error(`Webhook ticket creation failed: ${response.status()} ${await response.text()}`);
  }
  const ticket = await response.json();
  return ticket.id as number;
}

// ===========================================================================
// Ticket detail page — access control
// ===========================================================================

test.describe("Ticket detail page — access control", () => {
  test("unauthenticated user visiting /tickets/1 is redirected to /login", async ({
    page,
  }) => {
    await page.context().clearCookies();

    await page.goto("/tickets/1");
    await page.waitForURL("/login");

    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});

// ===========================================================================
// Ticket detail page — navigation from ticket list
// ===========================================================================

test.describe("Ticket detail page — navigation", () => {
  test("clicking a ticket subject link navigates to /tickets/:id", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await loginAsAdmin(page);

    const subject = `Nav test ticket ${Date.now()}`;
    const ticketId = await createTicketViaWebhook(page, subject);

    await page.goto("/tickets");
    await page.waitForURL("/tickets");
    await expect(page.getByRole("table")).toBeVisible();

    await page.getByRole("link", { name: subject }).click();
    await page.waitForURL(`/tickets/${ticketId}`);

    await expect(
      page.getByRole("heading", { name: subject, level: 1 })
    ).toBeVisible();
  });
});

// ===========================================================================
// Ticket detail page — reply submission
// ===========================================================================

test.describe("Ticket detail page — reply submission", () => {
  test("agent submits a reply and it appears in the reply list", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await loginAsAdmin(page);

    const subject = `Reply test ticket ${Date.now()}`;
    const ticketId = await createTicketViaWebhook(page, subject);

    await page.goto(`/tickets/${ticketId}`);
    await page.waitForURL(`/tickets/${ticketId}`);

    // Wait for the detail to load — the subject heading confirms the ticket
    // data has arrived and the reply form is rendered.
    await expect(
      page.getByRole("heading", { name: subject, level: 1 })
    ).toBeVisible();

    // Confirm the empty state is shown before any reply is submitted.
    await expect(page.getByText("No replies yet")).toBeVisible();

    const replyText = `E2E reply at ${Date.now()}`;
    await page.getByPlaceholder("Type your reply...").fill(replyText);
    await page.getByRole("button", { name: "Send reply" }).click();

    // The reply should appear in the thread after the mutation settles.
    await expect(page.getByText(replyText)).toBeVisible();

    // The "No replies yet" placeholder should be gone.
    await expect(page.getByText("No replies yet")).not.toBeVisible();
  });
});
