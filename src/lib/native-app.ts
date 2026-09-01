/**
 * Native (Capacitor Android) detection.
 *
 * The Android app is a Capacitor wrapper that loads the live site, so the same
 * React app runs in both places. When it runs inside the native shell we send
 * users straight to the authenticated app home (/dashboard) instead of the
 * public marketing landing page. The existing `_authenticated` route gate still
 * redirects unauthenticated users to sign in, auth logic is untouched.
 *
 * SSR-safe: always false on the server.
 */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  return /MedEuAiAndroid/i.test(window.navigator.userAgent);
}
