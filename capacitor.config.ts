import type { CapacitorConfig } from "@capacitor/cli";

/**
 * MedEuAi Android wrapper.
 *
 * The web app is server-rendered (TanStack Start), so the Android app loads the
 * live hosted site instead of a static bundle. This keeps backend, auth, AI and
 * payment behaviour identical to the website — nothing is duplicated natively.
 *
 * Change `server.url` to your production domain before building a release APK.
 */
const config: CapacitorConfig = {
  appId: "ai.medeu.app",
  appName: "MedEuAi",
  // Only used as a fallback shell; the app loads server.url at runtime.
  webDir: "public",
  server: {
    // Launch straight into the authenticated app home. Unauthenticated users
    // are redirected to sign in by the existing /_authenticated route gate.
    url: "https://medeu-ai.lovable.app/dashboard",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: ["medeu-ai.lovable.app", "*.lovable.app", "*.supabase.co"],
  },
  appendUserAgent: "MedEuAiAndroid",
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
