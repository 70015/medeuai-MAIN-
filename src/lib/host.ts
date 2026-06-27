/**
 * Host-aware helpers.
 *
 * "Admin host" = the app is loaded from a subdomain whose first label is
 * `admin`. e.g. admin.parikshasathi.com, admin.localhost. When true, the
 * app renders in Admin Mode and hides the student-facing UI.
 *
 * SSR-safe: returns `false` on the server (no window). The home/admin
 * decision happens after hydration, which is fine because the admin
 * subtree is already client-rendered (`_authenticated` is ssr:false).
 */
export function isAdminHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host === "admin" || host.startsWith("admin.");
}
