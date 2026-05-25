---
name: route-access-matrix
description: Which routes require which auth roles and where each role is redirected on access denial
metadata:
  type: project
---

| Route | Unauthenticated | Agent | Admin |
|---|---|---|---|
| `/login` | Accessible | Redirected to `/` (via `useEffect` in LoginPage) | Redirected to `/` |
| `/` | Redirected to `/login` (ProtectedRoute) | Accessible | Accessible |
| `/users` | Redirected to `/login` (ProtectedRoute) | Redirected to `/` (AdminRoute) | Accessible |
| `/*` (catch-all) | Redirected to `/login` (via `/` → ProtectedRoute) | Redirected to `/` | Redirected to `/` |

**Route guard components** (in `client/src/App.tsx`):
- `ProtectedRoute` — requires any session; redirects to `/login` if none
- `AdminRoute` — nested inside `ProtectedRoute`; requires `session.user.role === "admin"`; redirects to `/` for agents

**How to apply:** When writing access-control tests, always assert both the resulting URL AND the absence/presence of page-specific headings to confirm navigation completed.
