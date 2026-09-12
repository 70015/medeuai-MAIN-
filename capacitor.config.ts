import type { CapacitorConfig } from "@capacitor/cli";

/**
 * MedEuAi Android wrapper.
 *
 * The Android app loads the live MedEuAi production website.
 * This keeps authentication, AI, backend and payments consistent
 * with the web application.
 */
const config: CapacitorConfig = {
  appId: "ai.medeu.app",
  appName: "MedEuAi",

  // Fallback web directory
  webDir: "public",

  server: {
    // Production MedEuAi website
    url: "https://medeuai.in/dashboard",

    // HTTPS only
    cleartext: false,

    // Use HTTPS inside Android WebView
    androidScheme: "https",

    // Domains the Android app is allowed to navigate to
    allowNavigation: [
      "medeuai.in",
      "*.medeuai.in",
      "*.supabase.co",
    ],
  },

  // Identifies the Android app to the website
  appendUserAgent: "MedEuAiAndroid",

  android: {
    // Do not allow insecure mixed content
    allowMixedContent: false,

    // Keep WebView debugging disabled in release
    webContentsDebuggingEnabled: false,
  },
};

export default config;
