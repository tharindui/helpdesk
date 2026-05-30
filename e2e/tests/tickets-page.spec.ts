import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";
const SIGN_IN_URL = "http://localhost:3001/api/auth/sign-in/email";

async function loginAsAdmin(page: Page): Promise<void> {
  const response = await page.request.post(SIGN_IN_URL, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok()) {
    throw new Error(`Admin login failed: ${response.status()} ${await response.text()}`);
  }
}

// ===========================================================================
// Tickets page — navigation and access control
// ===========================================================================

test.describe("Tickets page — navigation", () => {
  test("the Tickets nav link navigates to /tickets", async ({ page }) => {
    await page.context().clearCookies();
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForURL("/");

    await page.getByRole("link", { name: "Tickets" }).click();
    await page.waitForURL("/tickets");

    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
  });
});

// ===========================================================================
// Tickets page — access control
// ===========================================================================

test.describe("Tickets page — access control", () => {
  test("unauthenticated user is redirected to /login when visiting /tickets", async ({
    page,
  }) => {
    // Clear any leftover cookies to ensure no session.
    await page.context().clearCookies();

    await page.goto("/tickets");
    await page.waitForURL("/login");

    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("agent can access the Tickets page", async ({ page }) => {
    await page.context().clearCookies();

    // Log in as the seeded agent.
    const res = await page.request.post(SIGN_IN_URL, {
      data: { email: "agent@example.com", password: "password123" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.ok()).toBeTruthy();

    await page.goto("/tickets");
    await page.waitForURL("/tickets");

    await expect(
      page.getByRole("heading", { name: "Tickets" })
    ).toBeVisible();
  });
});
