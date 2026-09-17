## Migrate MedEuAi from Lovable Cloud to an independent Supabase project

## What Lovable officially provides

Lovable Cloud does **not** offer a one-click migration to an independent Supabase project. The only official export path is:

- **More → Cloud → Overview → Advanced settings → Export data**
- Lovable prepares the export and notifies you when it is ready.
- You then download the export and manually import it into your own Supabase project.

After export, you would typically create a **new Lovable project connected to your own Supabase project** and ask Lovable to rebuild the schema/auth/functions there, or you can recreate everything manually in Supabase.

## Critical constraint for this project

Lovable Cloud **cannot be disconnected** from this project once it has been enabled. The project will remain tied to the current Lovable Cloud backend. A "full move away" therefore means:

- Build and deploy a brand-new application stack (frontend + Supabase backend) outside Lovable.
- Stop using the existing Lovable-hosted app / custom domain, or redirect traffic to the new stack.
- The Lovable Cloud backend will keep running in the background but will no longer be the live app backend.

## Can the existing backend stay live during migration?

Yes, with caveats:

- The Lovable Cloud backend can remain live and serving users **while you prepare the new Supabase project**.
- There is **no live sync** between Lovable Cloud and the new Supabase project.
- To avoid data loss, the cutover must include a **write freeze** on the Lovable app, a final export/import of recent data, and then a DNS/redirect switch to the new stack.

## Recommended migration phases

### Phase 1. Inventory and export preparation

- Document all current tables, RLS policies, functions, triggers, storage buckets, and edge functions.
- Request the official Lovable Cloud export: **More → Cloud → Overview → Advanced settings → Export data**.
- While waiting, audit environment variables and third-party credentials (Razorpay, Google OAuth, email, AI gateway, etc.).

### Phase 2. Create the new Supabase project

- Create a new Supabase project at supabase.com.
- Save the new `SUPABASE_URL`, `anon key`, and `service_role key`.
- Configure auth providers (Google OAuth, email templates, redirects) directly in the Supabase dashboard.

### Phase 3. Recreate schema, security, and backend logic

- Re-run the SQL migrations in the new Supabase project in the correct order (tables, grants, RLS, policies, functions, triggers, indexes).
- Recreate storage buckets and bucket policies.
- Recreate edge functions (or replace them with equivalent Supabase Edge Functions / external functions).
- Rebuild any Supabase Auth hooks or database webhooks.

### Phase 4. Migrate users and authentication

- Export users from Lovable Cloud via the official export.
- Note: **password hashes cannot be exported** through normal Supabase auth APIs. Existing users will need to use "Forgot password" / magic-link flows to set passwords on the new project, or you must plan a re-invitation campaign.
- Preserve user metadata, roles, and profile records by mapping old UUIDs to new UUIDs or by importing with matching UUIDs where possible.

### Phase 5. Migrate application data

- Import the database dump from the Lovable export into the new Supabase project.
- Validate row counts, foreign-key integrity, and RLS behavior.
- Re-run any seed data or singleton rows (e.g., `about_content`, default plans, payment settings).

### Phase 6. Migrate storage files

- Download files from Lovable Cloud storage buckets (official export may include storage; otherwise use Supabase Storage API).
- Re-upload to matching buckets in the new Supabase project.
- Update references in the database to new public/signed URLs.

### Phase 7. Prepare and deploy the frontend elsewhere

- Keep the current React/TanStack Start codebase.
- Replace all environment variables with the new Supabase project credentials.
- Remove or bypass Lovable-specific integrations if necessary.
- Deploy to a non-Lovable host (e.g., Cloudflare Workers, Vercel, Netlify) since the app targets an edge runtime.

### Phase 8. Cutover

- Announce maintenance window or put the Lovable app in read-only mode.
- Do a final export/import to capture latest data.
- Switch DNS / domain configuration to point to the new deployment.
- Update OAuth redirect URIs and any email/webhook URLs to the new domain.
- Keep the Lovable project available for rollback during the stabilization period.

## What will not migrate automatically

- **Passwords**: users must reset them.
- **Active sessions**: all users will be logged out at cutover.
- **Edge functions**: must be recreated/redeployed.
- **OAuth app credentials**: must be reconfigured in Supabase and in Google Cloud Console.
- **Lovable build/deploy pipeline**: you will manage CI/CD on the new host.

## Verification

- Smoke-test auth (signup, login, password reset).
- Verify mock-test flow, paper pool, payments, AI Teacher, and admin panel.
- Confirm storage images load, emails send, and payments work in the new project.

## Decision needed before proceeding

Because this project has a large schema, custom RLS, storage, edge functions, and live users, the safest approach is to first complete a proof-of-concept migration of one small module (for example, the `articles` table and its storage bucket) to validate the export/import workflow before migrating everything.