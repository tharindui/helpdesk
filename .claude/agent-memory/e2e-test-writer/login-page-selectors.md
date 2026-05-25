---
name: login-page-selectors
description: Canonical Playwright selectors for the LoginPage form, field errors, root alert, and NavBar elements
metadata:
  type: project
---

## LoginPage (`/login`) — `client/src/pages/LoginPage.tsx`

| Element | Selector |
|---|---|
| Email field | `page.getByLabel("Email")` |
| Password field | `page.getByLabel("Password")` |
| Submit button (idle) | `page.getByRole("button", { name: "Sign In" })` |
| Submit button (loading) | `page.getByRole("button", { name: "Signing in…" })` |
| Email field error | `page.getByText("Enter a valid email")` |
| Password field error | `page.getByText("Password is required")` |
| Root error alert | `page.getByRole("alert")` |

The `role="alert"` attribute was added to the root error `<div>` in `LoginPage.tsx` to allow semantic selection. Before that change the error div had no accessible role.

## NavBar — `client/src/components/NavBar.tsx`

| Element | Selector |
|---|---|
| Sign-out button | `page.getByRole("button", { name: "Sign Out" })` |
| Users nav link (admin only) | `page.getByRole("link", { name: "Users" })` |
| User initials avatar | `page.getByText(initials, { exact: true }).first()` |
| User name text | `page.getByText(name).first()` |

## HomePage — `client/src/pages/HomePage.tsx`

| Element | Selector |
|---|---|
| Welcome heading | `page.getByRole("heading", { name: "Welcome back, <Name>" })` |

## UsersPage — `client/src/pages/UsersPage.tsx`

| Element | Selector |
|---|---|
| Page heading | `page.getByRole("heading", { name: "Users" })` |
