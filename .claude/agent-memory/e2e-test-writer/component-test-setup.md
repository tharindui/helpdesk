---
name: component-test-setup
description: Vitest + React Testing Library setup for the client workspace — what was installed, how it's configured, and key mocking patterns
metadata:
  type: project
---

Vitest and React Testing Library were not pre-installed. They were added to `client/` devDependencies as part of writing the UsersPage component tests.

**Packages to install (run from `client/`):**
```
bun add -d vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

**Config changes made:**
- `client/vite.config.ts` — added `/// <reference types="vitest" />` triple-slash directive and a `test` block with `environment: "jsdom"`, `globals: true`, `setupFiles: ["./src/test/setup.ts"]`, and the `@` alias.
- `client/tsconfig.json` — added `"vitest/globals"` and `"@testing-library/jest-dom"` to the `types` array.
- `client/src/test/setup.ts` — created; imports `@testing-library/jest-dom` to register matchers.
- `client/package.json` — added `"test": "vitest run"` and `"test:watch": "vitest"` scripts.

**Key mocking pattern for `@/lib/axios`:**
- Mock the module with `vi.mock("@/lib/axios", ...)` returning `{ default: { get, post, patch, delete } }` where each is a `vi.fn()`.
- Re-import `api` from `@/lib/axios` AFTER the mock declaration so the test holds the mocked reference.
- Also mock the top-level `axios` package to make `axios.isAxiosError()` return `true` for fake error objects shaped as `{ isAxiosError: true, response: { data: { error: string } } }`.

**Why:** The component imports `api` (the axios instance) from `@/lib/axios` and calls `axios.isAxiosError()` from the bare `axios` package to extract error messages. Both need to be mocked together for error-path tests to work.

**TanStack Query wrapper:**
Each test creates a fresh `QueryClient` with `retry: false` on both queries and mutations, then wraps the component in `<QueryClientProvider client={queryClient}>`. This lets TanStack Query run for real (no mocking of hooks) so state transitions (isPending → data/error) are exercised naturally.

**Dialog testing note:**
The `Dialog` component is built on `@base-ui/react`. It renders into a portal on `document.body`. `screen.getByRole("dialog")` works correctly in jsdom — no special portal setup needed. Use `within(screen.getByRole("dialog"))` to scope queries to the open dialog.

**How to apply:** Reference these patterns whenever adding component tests to the `client/` workspace.
