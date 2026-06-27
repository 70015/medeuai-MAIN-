## Problem

You can sign in fine, but there's no visible way to reach the admin panel from the UI. Right now it's URL-only — you have to type `/admin` manually. The "Admin" link in the header only appears AFTER you already have the admin role, which is a chicken-and-egg problem for the very first admin.

Also, the session replay shows a Vite error overlay on the home page — I'll check and fix that as part of this so the app loads cleanly.

## Fix

1. **Make admin access obvious on the dashboard.** Add a prominent "Admin Panel" card on `/dashboard` for users who already have the admin role, and a smaller "Claim admin access" link for the very first user (only shown when no admin exists yet). This way you don't have to remember the URL.

2. **Direct link right now (no code change needed):** Open this URL in your browser while signed in →
   `https://id-preview--919a0eec-4904-4552-a317-8eb48c9a8544.lovable.app/admin`
   Then click **"Claim admin (first user only)"**. After that the "Admin" link appears in the top header automatically.

3. **Investigate the Vite error overlay** seen in the session replay on `/` and fix whatever is breaking the home page render — that may also be why no nav options are showing for you.

## Scope

- `src/routes/_authenticated/dashboard.tsx` — add admin entry card / claim button.
- Diagnose and fix the Vite error currently shown on the home page.
- No DB changes, no auth changes, no changes to the existing `/admin` route logic.
