/**
 * Android APK download config.
 *
 * Set APK_URL to the public HTTPS link of the signed release APK
 * (see ANDROID_RELEASE.md). While it is empty, the landing page shows an
 * honest "coming soon" state instead of a broken download link.
 */
export const APK_URL = "";
export const APK_VERSION = "1.0.0";
export const APK_SIZE = "~6 MB";
export const APK_MIN_ANDROID = "Android 7.0+";

export const apkAvailable = APK_URL.length > 0;
