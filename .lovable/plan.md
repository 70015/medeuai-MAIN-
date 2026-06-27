## Goal

Make the admin panel feel like a separate site on its own subdomain (e.g. `admin.yourdomain.com`), while keeping it inside the same Lovable project and database.

## How it will work

Single deployment, host-aware routing:

- When the app loads from a host starting with `admin.` (or equals `admin.localhost` in dev), it switches into **Admin Mode**:
  - The marketing site, `/dashboard`, `/tests`, `/ai-teacher`, `/billing`, etc. are hidden/redirected to `/admin`.
  - The header/shell is replaced with an Admin-only shell (Admin logo, admin tabs, sign out).
  - Visiting `/` on the admin subdomain auto-redirects to `/admin`.
- When the app loads from the main host (no `admin.` prefix), behavior is unchanged. `/admin` still works there too (useful as a fallback before DNS is set up).
- Same Supabase auth, same `has_role('admin')` check — non-admins hitting the admin subdomain see the "Claim admin / access denied" screen we already have.

## Changes

1. **`src/lib/host.ts`** (new) — `isAdminHost()` helper reading `window.location.hostname`, SSR-safe (returns false on server).
2. **`src/routes/__root.tsx`** — on admin host, force-redirect any non-`/admin*` and non-`/auth*` path to `/admin`.
3. **`src/components/app-shell.tsx`** — when `isAdminHost()`, render a slimmer `AdminShell` (no student nav, no "Take a test" CTA, admin-branded title).
4. **`src/routes/index.tsx`** — on admin host, redirect to `/admin` instead of rendering the marketing landing.
5. **`src/routes/_authenticated/admin.tsx`** — minor: show "Admin Console" branding more prominently when on the admin subdomain.
6. **Sidebar link in the main app** — add a visible "Admin" entry in `app-shell` that only renders for users with the admin role (so admins on the main domain can still get in easily).

No database, no auth, no billing changes.

## What you need to do (one-time, outside code)

1. In **Project Settings → Domains**, connect your custom domain (e.g. `yourdomain.com`) — or buy one from Lovable.
2. Add a second entry for `admin.yourdomain.com` in the same Domains screen. Lovable will give you a DNS record to add at your registrar (CNAME or A record).
3. Publish the project. Once DNS propagates, `admin.yourdomain.com` will serve the admin-only experience and `yourdomain.com` will serve the student app — both from this same project.

Until DNS is set up, you can keep using `/admin` on the preview URL exactly as you do today.

## Out of scope

- A truly separate codebase / second Lovable project (would duplicate code, auth, and DB connections — not recommended).
- Different database for admin (we keep RLS + `has_role` as the security boundary).
