# Google Authentication Setup

This guide explains how contributors should run Google authentication locally in the Expo mobile app, and what maintainers must configure before merging or deploying Google auth changes.

## What This App Uses

- `expo-auth-session`
- `expo-web-browser`
- `expo-dev-client` for native Android/iOS redirects
- Existing backend endpoint: `POST /api/auth/google`
- Existing token/session storage in the app

For reliable native Android/iOS OAuth testing, use an Expo development build. Expo Go may work when the configured redirect URI and Google OAuth client allow the current Expo Go redirect mode, but it should not be treated as the production-like test path.

## Contributor Local Setup

### 1. Install dependencies

```bash
npm install
```

The Google auth packages should already be in `package.json`. If they are missing, install SDK-compatible versions:

```bash
npx expo install expo-auth-session expo-web-browser expo-dev-client
```

### 2. Create `.env`

Copy `.env.example` to `.env`, then add the Google values supplied by the maintainers:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000/api

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.your-ios-client-id-prefix
EXPO_PUBLIC_GOOGLE_AUTH_ENDPOINT=/auth/google
```

Use your computer's LAN IP for `EXPO_PUBLIC_API_URL` when testing on a physical phone. Do not use `localhost` from a physical device.

Restart Expo after changing `.env` because `EXPO_PUBLIC_*` values are read when the bundle starts.

### 3. Confirm app config

`app.json` must include schemes that match the auth redirect used by Expo Auth Session:

```json
"scheme": [
  "voiceybill",
  "com.voiceybill.mobile"
]
```

Android package and iOS bundle ID must match the Google OAuth clients:

```json
"android": {
  "package": "com.voiceybill.mobile"
},
"ios": {
  "bundleIdentifier": "com.voiceybill.mobile"
}
```

### 4. Build a development client

Android:

```powershell
cmd /c npx expo run:android
```

iOS:

```bash
npx expo run:ios
```

After the build installs, open the installed `VoiceyBill` app. Expo Go can be useful for quick checks, but use the development build when validating native Google redirect behavior.

If the Android project has not been generated yet, `expo run:android` will create it. After that, the local debug keystore should exist at `android/app/debug.keystore`.

### 5. Test the flow

1. Start the backend server.
2. Start the mobile app development server if needed:

   ```bash
   npm run start
   ```

3. Open the installed development build when validating native behavior. Expo Go may be used only if your Google redirect setup supports it.
4. Go to Sign In or Sign Up.
5. Tap `Continue with Google`.
6. Complete Google sign-in.
7. Confirm the app returns from the browser and lands on Home/Dashboard.

## Google Cloud Requirements

Maintainers must configure these clients in the same Google Cloud project.

### OAuth Consent Screen

- Configure the OAuth consent screen for `VoiceyBill`.
- In testing mode, add each contributor's Google account as a test user.
- Add the required app support/developer contact emails.

### Web OAuth Client

Used by the web app and also accepted by the backend.

- Application type: Web application
- Authorized JavaScript origins:
  - `http://localhost:5173`
  - production web origin
- Authorized redirect URIs:
  - any production/local redirect URIs required by the web app

### Android OAuth Client

Used by the Expo Android development build and production Android builds.

- Application type: Android
- Package name: `com.voiceybill.mobile`
- SHA-1 certificate fingerprint:
  - contributors need their local debug SHA-1 if using a local development build
  - production needs the release/EAS signing SHA-1
- Custom URI scheme: enabled

For a local generated Android project, get the debug SHA-1 from:

```powershell
& "C:\Program Files\Java\jdk-21\bin\keytool.exe" -list -v -keystore "C:\path\to\voiceyBill-App\android\app\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

The SHA-1 must be added to the Android OAuth client before that contributor's local development build can sign in.

### iOS OAuth Client

Used by iOS development and production builds.

- Application type: iOS
- Bundle ID: `com.voiceybill.mobile`
- URL scheme from the iOS client ID, for example:

```env
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.your-ios-client-id-prefix
```

For production iOS builds, confirm the Google Cloud iOS client and the app bundle identifier both use `com.voiceybill.mobile`.

## Backend Must Accept Mobile Audiences

The backend must verify Google ID tokens against all supported client IDs:

- `GOOGLE_CLIENT_ID` for web
- `GOOGLE_ANDROID_CLIENT_ID` for Android
- `GOOGLE_IOS_CLIENT_ID` for iOS

If Android/iOS IDs are missing on the server, mobile sign-in can fail with:

```text
Wrong recipient, payload audience != requiredAudience
```

## Common Errors

### Expo Go or redirect message

```text
Google sign-in needs an Expo development build.
```

If Expo Go shows redirect, policy, or development-build errors, install and open a development build with `npx expo run:android` or `npx expo run:ios`.

### Google error: custom URI scheme is not enabled

Enable custom URI scheme on the Android OAuth client in Google Cloud Console.

### Browser does not return to app

Confirm `app.json` contains both `voiceybill` and `com.voiceybill.mobile` schemes, then rebuild the development client.

### Token used too early

The backend machine clock is out of sync. Sync system date/time and restart the backend.

### Wrong recipient

The backend is verifying the token against the wrong client ID. Add Android/iOS client IDs to the backend environment.

## Maintainer Merge Checklist

- Google Cloud has Web, Android, and iOS OAuth clients.
- Android OAuth client has the correct package name and all required SHA-1 fingerprints.
- Android custom URI scheme is enabled.
- iOS OAuth client has the correct bundle ID and URL scheme.
- Server production env includes all Google client IDs.
- Web production env includes `VITE_GOOGLE_CLIENT_ID`.
- Mobile production env includes all `EXPO_PUBLIC_GOOGLE_*` values.
- OAuth consent screen is published or production users are allowed.
- Sign In and Sign Up work for existing users and first-time users.
- Email/password authentication still works.
