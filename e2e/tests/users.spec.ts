import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// Credentials — kept in sync with server/.env.test and the seed script.
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

// Better Auth sign-in endpoint served by the test server (port 3001).
// Using an absolute URL because page.request bypasses the Vite dev-server proxy.
const SIGN_IN_URL = "http://localhost:3001/api/auth/sign-in/email";

// API base for programmatic setup/teardown calls (also bypasses the Vite proxy).
const API_BASE = "http://localhost:3001";

// ---------------------------------------------------------------------------
// Helper: programmatic login — session cookie is written into the shared
// browser context cookie jar so subsequent page.goto() calls are authenticated.
// ---------------------------------------------------------------------------

async function loginAsAdmin(page: Page): Promise<void> {
  const response = await page.request.post(SIGN_IN_URL, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok()) {
    throw new Error(
      `Admin login failed: ${response.status()} ${await response.text()}`
    );
  }
}

// ---------------------------------------------------------------------------
// Helper: create a test user via the API. Returns the created user's id.
// Uses the session cookie already present in the page's browser context.
// ---------------------------------------------------------------------------

async function createUser(
  request: APIRequestContext,
  opts: {
    name: string;
    email: string;
    password?: string;
    role?: "admin" | "agent";
  }
): Promise<string> {
  const res = await request.post(`${API_BASE}/api/users`, {
    data: {
      name: opts.name,
      email: opts.email,
      password: opts.password ?? "testpassword123",
      role: opts.role ?? "agent",
    },
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok()) {
    throw new Error(
      `createUser(${opts.email}) failed: ${res.status()} ${await res.text()}`
    );
  }

  const user = await res.json();
  return user.id as string;
}

// ---------------------------------------------------------------------------
// Helper: soft-delete a user by id via the API.
// ---------------------------------------------------------------------------

async function deleteUser(
  request: APIRequestContext,
  id: string
): Promise<void> {
  await request.delete(`${API_BASE}/api/users/${id}`);
}

// ---------------------------------------------------------------------------
// Helper: look up a user id by email via the list endpoint.
// Returns undefined when the email is not found (e.g. already deleted).
// ---------------------------------------------------------------------------

async function findUserIdByEmail(
  request: APIRequestContext,
  email: string
): Promise<string | undefined> {
  const res = await request.get(`${API_BASE}/api/users`);
  if (!res.ok()) return undefined;
  const users = (await res.json()) as Array<{ id: string; email: string }>;
  return users.find((u) => u.email === email)?.id;
}

// ---------------------------------------------------------------------------
// Unique email generator: keeps each test's fixture email distinct so that
// serial test runs never collide on Better Auth's unique-email constraint,
// which is enforced independently of Prisma's soft-delete deletedAt field.
// ---------------------------------------------------------------------------

let emailSeq = 0;
function uniqueEmail(prefix: string): string {
  return `${prefix}-${++emailSeq}@e2e.example.com`;
}

// ===========================================================================
// Users page — CRUD happy paths
// ===========================================================================

test.describe("Users page — CRUD happy paths", () => {
  // Log in as admin before every test. Using beforeEach so each test starts
  // with a fresh authenticated session at /users.
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAsAdmin(page);
    await page.goto("/users");
    await page.waitForURL("/users");
    // Wait for the real table to appear (not the loading skeleton).
    await expect(page.getByRole("table")).toBeVisible();
  });

  // =========================================================================
  // 1. List users (Read)
  // =========================================================================

  test.describe("List users", () => {
    test("admin sees the Users page heading and the seeded users in the table", async ({
      page,
    }) => {
      // Page heading is present.
      await expect(
        page.getByRole("heading", { name: "Users" })
      ).toBeVisible();

      // Both seeded rows appear in the table.
      await expect(
        page.getByRole("cell", { name: ADMIN_EMAIL })
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "agent@example.com" })
      ).toBeVisible();
    });
  });

  // =========================================================================
  // 2. Create a new user (Create)
  // =========================================================================

  test.describe("Create user", () => {
    test("admin can open the Add User dialog and create a new agent user", async ({
      page,
    }) => {
      const email = uniqueEmail("create-agent");
      const name = "Created Agent";

      const rowsBefore = await page.locator("tbody tr").count();

      // Open the dialog.
      await page.getByRole("button", { name: "Add User" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Add User" })
      ).toBeVisible();

      // Fill in the form. The role select defaults to "Agent".
      await page.getByLabel("Name").fill(name);
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill("testpassword123");

      await page.getByRole("button", { name: "Create User" }).click();

      // Dialog closes on success.
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // The table now has one extra row.
      await expect(page.locator("tbody tr")).toHaveCount(rowsBefore + 1);

      // The new user appears in the table.
      await expect(page.getByRole("cell", { name: name })).toBeVisible();
      await expect(page.getByRole("cell", { name: email })).toBeVisible();

      // Role badge reads "Agent" — scope to the span element that renders the badge
      // to avoid matching the text that also appears inside the name/email cells.
      await expect(
        page.locator("tr", { hasText: email }).locator("span", { hasText: "Agent" })
      ).toBeVisible();

      // Cleanup: look up the created user's id and soft-delete it.
      const id = await findUserIdByEmail(page.request, email);
      if (id) await deleteUser(page.request, id);
    });

    test("admin can create a new admin user by selecting Admin role", async ({
      page,
    }) => {
      const email = uniqueEmail("create-admin");
      const name = "Created Admin";

      await page.getByRole("button", { name: "Add User" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByLabel("Name").fill(name);
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill("testpassword123");
      await page.getByLabel("Role").selectOption("admin");

      await page.getByRole("button", { name: "Create User" }).click();

      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Role badge reads "Admin" — target the span element to avoid false matches.
      await expect(
        page.locator("tr", { hasText: email }).locator("span", { hasText: "Admin" })
      ).toBeVisible();

      // Cleanup.
      const id = await findUserIdByEmail(page.request, email);
      if (id) await deleteUser(page.request, id);
    });

  });

  // =========================================================================
  // 3. Edit an existing user (Update)
  // =========================================================================

  test.describe("Edit user", () => {
    test("admin can edit a user's name and email", async ({ page }) => {
      const originalEmail = uniqueEmail("edit-name");
      const updatedEmail = uniqueEmail("edit-name-updated");
      const originalName = "Edit Name Test";
      const updatedName = "Edit Name Updated";

      // Create the user to edit via API so the test doesn't depend on UI state.
      const id = await createUser(page.request, {
        name: originalName,
        email: originalEmail,
      });

      // Reload so the new row appears.
      await page.reload();
      await page.waitForURL("/users");
      await expect(page.getByRole("table")).toBeVisible();

      // Open the Edit dialog for this specific row.
      await page
        .locator("tr", { hasText: originalEmail })
        .getByRole("button", { name: "Edit" })
        .click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Edit User" })
      ).toBeVisible();

      // Form should be pre-populated with the current values.
      await expect(page.getByLabel("Name")).toHaveValue(originalName);
      await expect(page.getByLabel("Email")).toHaveValue(originalEmail);

      // Apply updates.
      await page.getByLabel("Name").fill(updatedName);
      await page.getByLabel("Email").fill(updatedEmail);

      await page.getByRole("button", { name: "Save Changes" }).click();

      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Updated values are visible in the table.
      await expect(
        page.getByRole("cell", { name: updatedName })
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: updatedEmail })
      ).toBeVisible();

      // Old email is no longer visible.
      await expect(
        page.getByRole("cell", { name: originalEmail })
      ).not.toBeVisible();

      // Cleanup.
      await deleteUser(page.request, id);
    });

    test("admin can promote an agent to admin role via the Edit dialog", async ({
      page,
    }) => {
      const email = uniqueEmail("edit-role");
      const name = "Promote To Admin";

      const id = await createUser(page.request, { name, email, role: "agent" });

      await page.reload();
      await page.waitForURL("/users");
      await expect(page.getByRole("table")).toBeVisible();

      const targetRow = page.locator("tr", { hasText: email });
      await expect(targetRow.locator("span", { hasText: "Agent" })).toBeVisible();

      await targetRow.getByRole("button", { name: "Edit" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByLabel("Role").selectOption("admin");
      await page.getByRole("button", { name: "Save Changes" }).click();

      await expect(page.getByRole("dialog")).not.toBeVisible();

      // The row now shows "Admin" badge — target the span element to avoid ambiguity.
      await expect(
        page.locator("tr", { hasText: email }).locator("span", { hasText: "Admin" })
      ).toBeVisible();

      // Cleanup.
      await deleteUser(page.request, id);
    });

  });

  // =========================================================================
  // 4. Delete a user (Delete)
  // =========================================================================

  test.describe("Delete user", () => {
    test("admin can delete a user and the row is removed from the table", async ({
      page,
    }) => {
      const email = uniqueEmail("delete-row");
      const name = "Delete Row Test";

      await createUser(page.request, { name, email });

      await page.reload();
      await page.waitForURL("/users");
      await expect(page.getByRole("table")).toBeVisible();

      const rowsBefore = await page.locator("tbody tr").count();

      // Open the delete confirmation dialog for the target row.
      const targetRow = page.locator("tr", { hasText: email });
      await targetRow.getByRole("button", { name: "Delete" }).click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Delete User" })
      ).toBeVisible();

      // The confirmation body includes the user's name.
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByText(name, { exact: false })).toBeVisible();

      // Confirm the deletion via the destructive Delete button inside the dialog.
      await dialog.getByRole("button", { name: "Delete" }).click();

      // Dialog closes.
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // The deleted user's row is gone.
      await expect(
        page.getByRole("cell", { name: email })
      ).not.toBeVisible();

      // Row count decremented by one.
      await expect(page.locator("tbody tr")).toHaveCount(rowsBefore - 1);
    });

  });
});
