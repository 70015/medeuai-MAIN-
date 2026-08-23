# MedEu.Ai — Android APK release guide

The Android app is a Capacitor wrapper that loads the live MedEu.Ai site
(`capacitor.config.ts` → `server.url`). Backend, auth, AI Teacher and payments
behave exactly as on the web. No product logic is duplicated natively.

> **No APK has been generated in this environment.** Lovable's sandbox has no
> Android SDK, no JDK/Gradle Android toolchain and no signing keystore, so a
> signed release artifact cannot be produced here. Run the steps below on your
> own machine (Windows/macOS/Linux) with Android Studio installed.

## What you must provide

| Requirement | Why |
| --- | --- |
| Android Studio (+ Android SDK, Platform 35, Build Tools) | compiles the APK |
| JDK 21 (bundled with Android Studio) | Gradle build |
| A signing keystore (`.jks`) + key alias + passwords | Android refuses to install unsigned release APKs |
| Your production domain in `capacitor.config.ts` | the app must point at the live site |

## 1. Generate the Android project (one time)

```bash
npm install
npx cap add android
npx cap sync android
```

## 2. Create a signing key (one time — keep it safe forever)

```bash
keytool -genkey -v -keystore medeu-release.jks -keyalg RSA \
  -keysize 2048 -validity 10000 -alias medeu
```

Then create `android/key.properties` (never commit it):

```properties
storeFile=../medeu-release.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=medeu
keyPassword=YOUR_KEY_PASSWORD
```

And in `android/app/build.gradle`, load it and add a `signingConfigs.release`
block referencing those values, wired to `buildTypes.release`.

## 3. Build the signed APK

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

(For Play Store use `./gradlew bundleRelease` → `.aab`.)

## 4. Host the APK and wire the download button

Upload `app-release.apk` to any public HTTPS host — for example:

- `public/downloads/medeu-ai.apk` in this project (then re-publish), served at
  `https://your-domain/downloads/medeu-ai.apk`
- or Cloud storage / GitHub Releases / Google Drive direct link

Then set the URL and version in **`src/lib/app-download.ts`**:

```ts
export const APK_URL = "https://your-domain/downloads/medeu-ai.apk";
export const APK_VERSION = "1.0.0";
export const APK_SIZE = "6 MB";
```

Until `APK_URL` is set, the landing page shows an honest "coming soon" state
instead of a broken link.

## 5. Version bumps

Increase `versionCode` / `versionName` in `android/app/build.gradle`, rebuild,
re-upload, update `APK_VERSION`.
