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

## 1. Native project — already generated ✅

`android/` is committed and ready (`appId ai.medeu.app`, release signing block
already wired in `android/app/build.gradle`). After pulling the project, just:

```bash
npm install
npx cap sync android
```

A build was attempted in this environment and failed with:
`ERROR: JAVA_HOME is not set and no 'java' command could be found` — no JDK and
no Android SDK exist here, and no keystore was provided, so no APK was produced.

## 2. Create a signing key (one time — keep it safe forever)

```bash
cd android
keytool -genkey -v -keystore medeu-release.jks -keyalg RSA \
  -keysize 2048 -validity 10000 -alias medeu
```

Then create `android/key.properties` (git-ignored):

```properties
storeFile=medeu-release.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=medeu
keyPassword=YOUR_KEY_PASSWORD
```

`android/app/build.gradle` picks this up automatically and signs the release
build. If the file is missing, Gradle builds unsigned (debug only).


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

## 6. Launch behaviour

The installed app opens `/dashboard` (app home) instead of the marketing page —
`capacitor.config.ts` → `server.url`. Signed-out users are redirected to sign in
by the existing authenticated-route gate. Re-run `npx cap sync android` after
changing the URL.
