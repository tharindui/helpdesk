# Plan: Convert Helpdesk Client to PWA

## Context
The helpdesk client is a Vite + React app with no PWA infrastructure at all — no service worker, no manifest, no icons, no public/ directory. Converting it to a PWA enables browser installation, offline app-shell loading, and a native-app-like experience. This is an internal B2B tool so caching strategy must be conservative: API routes (`/api/*`) must never be cached because they carry live, session-scoped ticket data.

---

## Files to Modify / Create

| File | Action |
|---|---|
| `client/package.json` | Add `vite-plugin-pwa` to devDependencies |
| `client/tsconfig.json` | Add `"vite-plugin-pwa/client"` to `compilerOptions.types` |
| `client/vite.config.ts` | Import + configure `VitePWA` plugin |
| `client/index.html` | Add PWA meta tags and manifest link |
| `client/src/main.tsx` | Register service worker, dispatch update events |
| `client/src/App.tsx` | Mount `<PwaUpdatePrompt />` once inside `<BrowserRouter>` |
| `client/src/components/PwaUpdatePrompt.tsx` | **Create** — toast banner for SW update / offline-ready |
| `client/public/pwa-192x192.png` | **Create** — standard PWA icon |
| `client/public/pwa-512x512.png` | **Create** — large PWA icon |
| `client/public/maskable-icon-512x512.png` | **Create** — maskable icon (safe-zone padding) |
| `client/public/apple-touch-icon-180x180.png` | **Create** — iOS home screen icon |
| `client/public/favicon.ico` | **Create** — browser tab favicon |

---

## Step 1 — Install Package

```bash
cd client
NODE_TLS_REJECT_UNAUTHORIZED=0 bun add -d vite-plugin-pwa
```

No other packages needed — `vite-plugin-pwa` ships the `virtual:pwa-register` virtual module internally.

---

## Step 2 — Generate Icons

Use `@vite-pwa/assets-generator` with a source SVG placed at `client/public/favicon.svg`:

```bash
cd client
NODE_TLS_REJECT_UNAUTHORIZED=0 bunx @vite-pwa/assets-generator --preset minimal
```

This emits all required PNG sizes + `favicon.ico` into `client/public/`. Alternatively, use `realfavicongenerator.net` and place files manually.

---

## Step 3 — `client/tsconfig.json`

Add to `compilerOptions.types`:
```json
"types": ["vite/client", "vite-plugin-pwa/client"]
```

---

## Step 4 — `client/vite.config.ts`

Add `VitePWA` plugin after the existing `react()` and `tailwindcss()` plugins:

```typescript
import { VitePWA } from "vite-plugin-pwa";

VitePWA({
  registerType: "prompt",          // paired with PwaUpdatePrompt component
  injectRegister: "auto",
  strategies: "generateSW",        // Workbox generates SW — no custom sw.ts needed

  manifest: {
    name: "Helpdesk",
    short_name: "Helpdesk",
    description: "AI-powered helpdesk ticket management",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#ffffff",
    background_color: "#ffffff",
    start_url: "/",
    scope: "/",
    lang: "en",
    icons: [
      { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },

  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/api\//],   // CRITICAL: never serve index.html for API requests
    skipWaiting: false,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^\/api\//,
        handler: "NetworkOnly",               // CRITICAL: never cache API responses
      },
      {
        urlPattern: /\.(woff2?|ttf|otf|eot)$/,
        handler: "CacheFirst",
        options: { cacheName: "font-assets", expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
      },
      {
        urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: "CacheFirst",
        options: { cacheName: "image-assets", expiration: { maxEntries: 50, maxAgeSeconds: 2592000 } },
      },
    ],
  },

  devOptions: { enabled: false },
})
```

---

## Step 5 — `client/index.html`

Add to `<head>`:
```html
<meta name="description" content="AI-powered helpdesk ticket management" />
<meta name="application-name" content="Helpdesk" />
<meta name="theme-color" content="#ffffff" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="192x192" href="/pwa-192x192.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Helpdesk" />
<meta name="msapplication-TileColor" content="#ffffff" />
```

---

## Step 6 — `client/src/main.tsx`

Add SW registration before `createRoot`:

```typescript
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent("pwa:needRefresh", { detail: { updateSW } }));
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent("pwa:offlineReady"));
  },
  onRegisterError(error) {
    console.error("[PWA] SW registration failed:", error);
  },
});
```

---

## Step 7 — Create `client/src/components/PwaUpdatePrompt.tsx`

A toast banner component that:
- Listens for `pwa:needRefresh` and `pwa:offlineReady` DOM events (dispatched from `main.tsx`)
- Shows "New version available. [Reload]" or "App ready to work offline."
- Uses shadcn `Button` + shadcn CSS tokens only (`bg-background`, `border-border`, `text-foreground`)
- Calls `updateSW(true)` on the Reload button to activate the waiting SW and reload

Mount it once in `App.tsx` inside `<BrowserRouter>` above `<Routes>`.

---

## Caching Strategy Summary

| URL Pattern | Strategy | Why |
|---|---|---|
| `/api/*` | `NetworkOnly` | Live session-scoped data — must never be stale or cached |
| JS/CSS/HTML (build output) | Precache (install-time) | Vite content-hashes these; safe to cache forever |
| Fonts (woff/woff2) | `CacheFirst` 1yr | Immutable after hash-named |
| Images/icons (png/ico/svg) | `CacheFirst` 30d | Rarely change |
| SPA navigations | `navigateFallback: "/index.html"` | React Router handles routing from cached shell |

**Offline behaviour:** App shell loads → `useSession()` hits `/api/auth/get-session` → `NetworkOnly` throws → `ProtectedRoute` redirects to `/login` → login page renders from cache. Users cannot work offline (they need live ticket data) but they get a clean branded experience instead of the browser's error page.

---

## Verification

1. `bun build` from repo root — confirm no TypeScript errors
2. `cd client && bun preview` — serve the production build
3. Chrome DevTools → Application tab:
   - Manifest: name, icons, `display: standalone` all present, "No installability issues"
   - Service Workers: SW "activated and running"
   - Cache Storage: JS/CSS/HTML/icons cached; **no `/api/` URLs in any cache**
4. Address bar shows install icon → click → app installs as standalone window
5. Lighthouse PWA audit → all "Installable" checks green
6. Network tab → throttle to Offline → reload → app shell loads (login page visible)
