---
name: programmatic-login
description: How to perform a non-UI login in Playwright tests using page.request to set the session cookie
metadata:
  type: project
---

Use `page.request.post()` (not the `request` fixture) to call the Better Auth sign-in endpoint. Because `page.request` shares the browser context's cookie jar, the session cookie is automatically stored and applied to subsequent `page.goto()` calls.

```typescript
const SIGN_IN_URL = "http://localhost:3001/api/auth/sign-in/email";

async function loginAs(page: Page, email: string, password: string): Promise<void> {
  const response = await page.request.post(SIGN_IN_URL, {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()}`);
  }
}
```

**Why:** The `request` fixture has a separate cookie jar that does not transfer to the browser context. Using `page.request` ensures cookies are shared. The absolute URL `http://localhost:3001/...` is needed because `page.request` bypasses the Vite dev server proxy.

**How to apply:** Use `loginAs(page, email, password)` in `beforeEach` or at the start of any test that needs an authenticated session without testing the login UI flow. Always call `page.context().clearCookies()` in `beforeEach` when tests in a group need to start unauthenticated.
