## Problem

Right now the "Admin Panel" button on `/dashboard` is visible to **every** signed-in user. You only want admins to see it.

## Fix

Gate the Admin Panel button by role. Use the same `has_role(user, 'admin')` check that `/admin` already uses, via a small `useIsAdmin()` query.

- In `src/routes/_authenticated/dashboard.tsx`:
  - Add a `useIsAdmin` hook (mirrors the one in `admin.tsx`) that calls `supabase.rpc("has_role", { _user_id, _role: "admin" })`.
  - Wrap the `<Link to="/admin"><Button>Admin Panel</Button></Link>` so it renders **only when `isAdmin === true`**.
  - Non-admins see no trace of it on the dashboard hero.

The header "Admin" link in `app-shell.tsx` is already role-gated, so nothing to change there. The `/admin` route itself stays protected by its own role check — non-admins typing the URL still get blocked.

## Result

- Admins: see "Start mock test", "Ask AI Teacher", **and** "Admin Panel".
- Regular users: see only "Start mock test" and "Ask AI Teacher". No admin banner, no admin link, no hint the admin panel exists.

## Scope

- Edit only `src/routes/_authenticated/dashboard.tsx`.
- No DB, RLS, or auth changes.
