/**
 * Android APK download config.
 *
 * ▶ OWNER: ONE LINE TO GO LIVE — paste the public HTTPS link of your signed
 *   release APK into APK_URL below (see ANDROID_RELEASE.md), e.g.
 *     export const APK_URL = "https://medeu-ai.lovable.app/downloads/medeu-ai.apk";
 *
 * While APK_URL is empty, the header button and landing section show an honest
 * "coming soon" state instead of a fake/broken download link.
 */
export const APK_URL = "";
export const APK_VERSION = "1.0.0";
export const APK_SIZE = "~6 MB";
export const APK_MIN_ANDROID = "Android 7.0+";

export const apkAvailable = APK_URL.length > 0;
