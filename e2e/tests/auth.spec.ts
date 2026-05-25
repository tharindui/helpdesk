import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Credentials — kept in sync with server/.env.test and the seed script.
//
// SEED_ADMIN_EMAIL is "admin@example.com" in server/.env.test.
// SEED_ADMIN_PASSWORD is "password123" in server/.env.test (added so the
//   test database admin has a deterministic password).
// The agent user is seeded by server/prisma/seed.ts with fixed credentials.
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";
const ADMIN_NAME = "Admin";

const AGENT_EMAIL = "agent@example.com";
const AGENT_PASSWORD = "password123";
const AGENT_NAME = "Agent";

// Better Auth sign-in endpoint served by the test server (port 3001).
// Using an absolute URL because the page.request context goes directly to the
// API, bypassing the Vite dev server proxy.
const SIGN_IN_URL = "http://localhost:3001/api/auth/sign-in/email";

// ---------------------------------------------------------------------------
// Helper: programmatic login using page.request so that the session cookie
// is automatically stored in the shared browser context cookie jar.
// This is the preferred approach for tests that are not testing auth flows —
// it avoids repeating the UI login form for every test.
// ---------------------------------------------------------------------------

async function loginAs(page: Page, email: string, password: string): Promise<void> {
  const response = await page.request.post(SIGN_IN_URL, {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok()) {
    throw new Error(
      `Programmatic login failed for ${email}: ${response.status()} ${await response.text()}`
    );
  }
}

// ===========================================================================
// 1. Login page — UI-driven auth flow tests
// ===========================================================================

test.describe("Login page — UI auth flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean session.
    await page.context().clearCookies();
    await page.goto("/login");
  });

  // -------------------------------------------------------------------------
  // Happy paths
  // -------------------------------------------------------------------------

  test("admin can log in with valid credentials and lands on /", async ({ page }) => {
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("/");
    await expect(page).toHaveURL("/");

    // The home page greets the user by name.
    await expect(
      page.getByRole("heading", { name: `Welcome back, ${ADMIN_NAME}` })
    ).toBeVisible();
  });

  test("agent can log in with valid credentials and lands on /", async ({ page }) => {
    await page.getByLabel("Email").fill(AGENT_EMAIL);
    await page.getByLabel("Password").fill(AGENT_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("/");
    await expect(page).toHaveURL("/");

    await expect(
      page.getByRole("heading", { name: `Welcome back, ${AGENT_NAME}` })
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Client-side validation errors (no network call issued)
  // -------------------------------------------------------------------------

  test("submitting empty form shows validation errors on both fields", async ({ page }) => {
    await page.getByRole("button", { name: "Sign In" }).click();

    // zod schema messages from LoginPage.tsx:
    //   email: z.email("Enter a valid email")
    //   password: z.string().min(1, "Password is required")
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();

    // Must remain on /login — no redirect on invalid input.
    await expect(page).toHaveURL("/login");
  });

  test("submitting with only email filled shows password validation error", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill(AGENT_EMAIL);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page.getByText("Enter a valid email")).not.toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("submitting with only password filled shows email validation error", async ({
    page,
  }) => {
    await page.getByLabel("Password").fill(AGENT_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.getByText("Password is required")).not.toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("submitting an invalid email format shows email validation error", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill(AGENT_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  // -------------------------------------------------------------------------
  // API-level auth errors — wrong credentials trigger a root-level alert
  // -------------------------------------------------------------------------

  test("wrong password shows a root-level error alert", async ({ page }) => {
    await page.getByLabel("Email").fill(AGENT_EMAIL);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    // The root error div has role="alert" (added to LoginPage.tsx).
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("non-existent email shows a root-level error alert", async ({ page }) => {
    await page.getByLabel("Email").fill("does-not-exist@example.com");
    await page.getByLabel("Password").fill("any-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Better Auth returns UNAUTHORIZED for any credential mismatch —
    // assert that the alert renders, regardless of the specific message.
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  // -------------------------------------------------------------------------
  // Button loading state while the API call is in flight
  // -------------------------------------------------------------------------

  test("sign-in button shows loading text while request is in flight", async ({ page }) => {
    // Delay the API response to make the intermediate state observable.
    await page.route(SIGN_IN_URL, async (route) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.getByLabel("Email").fill(AGENT_EMAIL);
    await page.getByLabel("Password").fill(AGENT_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    // While the request is in flight the label changes to "Signing in…".
    await expect(page.getByRole("button", { name: "Signing in…" })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Already-authenticated user visiting /login is redirected to /
  // -------------------------------------------------------------------------

  test("already logged-in user visiting /login is redirected to /", async ({ page }) => {
    // Programmatically log in, then attempt to visit /login.
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
    await page.goto("/login");

    // LoginPage's useEffect detects the active session and navigates to /.
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});

// ===========================================================================
// 2. Sign-out
// ===========================================================================

test.describe("Sign-out", () => {
  test("logged-in user can sign out and is redirected to /login", async ({ page }) => {
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
    await page.goto("/");
    await page.waitForURL("/");

    await page.getByRole("button", { name: "Sign Out" }).click();

    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");

    // The login form must be visible — confirms we are truly signed out.
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("after sign-out, visiting / redirects to /login", async ({ page }) => {
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
    await page.goto("/");
    await page.waitForURL("/");

    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.waitForURL("/login");

    // Navigate directly to the protected root — must bounce back.
    await page.goto("/");
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });
});

// ===========================================================================
// 3. NavBar after login
// ===========================================================================

test.describe("NavBar after login", () => {
  test("NavBar shows agent initials, name, and sign-out button after login", async ({
    page,
  }) => {
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
    await page.goto("/");
    await page.waitForURL("/");

    // Avatar initials — first letter of each word in the user's name.
    const expectedInitials = AGENT_NAME.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // The initials appear inside a small circle div in the NavBar.
    await expect(page.getByText(expectedInitials, { exact: true }).first()).toBeVisible();

    // Full name is shown alongside the avatar.
    await expect(page.getByText(AGENT_NAME).first()).toBeVisible();

    // Sign-out button is always present.
    await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
  });

  test("NavBar shows admin initials and name after login", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/");
    await page.waitForURL("/");

    const expectedInitials = ADMIN_NAME.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    await expect(page.getByText(expectedInitials, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(ADMIN_NAME).first()).toBeVisible();
  });

  test("admin NavBar shows Users link; agent NavBar does not", async ({ page }) => {
    // Admin session — should see the Users nav link.
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/");
    await page.waitForURL("/");
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();

    // Switch to agent session.
    await page.context().clearCookies();
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
    await page.goto("/");
    await page.waitForURL("/");

    // The Users nav link must not be present for the agent role.
    await expect(page.getByRole("link", { name: "Users" })).not.toBeVisible();
  });
});

// ===========================================================================
// 4. Unauthenticated access — redirect to /login
// ===========================================================================

test.describe("Unauthenticated access — redirects to /login", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated user visiting / is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });

  test("unauthenticated user visiting /users is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/users");
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });

  test("unauthenticated user visiting an unknown route is redirected to /login", async ({
    page,
  }) => {
    // App.tsx catch-all navigates to "/" which the ProtectedRoute then sends to /login.
    await page.goto("/some/unknown/path");
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });
});

// ===========================================================================
// 5. Role-based access control
// ===========================================================================

test.describe("Role-based access — /users is admin-only", () => {
  test("agent visiting /users is redirected to /", async ({ page }) => {
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
    await page.goto("/users");

    // AdminRoute redirects non-admins to "/".
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");

    // The Users page heading must not appear.
    await expect(page.getByRole("heading", { name: "Users" })).not.toBeVisible();
  });

  test("admin can visit /users and sees the Users page heading", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/users");
    await page.waitForURL("/users");
    await expect(page).toHaveURL("/users");

    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });
});

// ===========================================================================
// 6. Session persistence across page refresh
// ===========================================================================

test.describe("Session persistence", () => {
  test("agent session cookie keeps user logged in after page refresh", async ({
    page,
  }) => {
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
    await page.goto("/");
    await page.waitForURL("/");

    // Hard reload — simulates the user pressing F5.
    await page.reload();

    // Should still be on "/" with the authenticated UI intact.
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: `Welcome back, ${AGENT_NAME}` })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
  });

  test("admin session persists across page refresh on /users", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/users");
    await page.waitForURL("/users");

    await page.reload();

    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });
});
