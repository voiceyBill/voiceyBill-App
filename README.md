# voiceyBill-App

[![CI](https://github.com/voiceyBill/voiceyBill-App/actions/workflows/ci.yml/badge.svg)](https://github.com/voiceyBill/voiceyBill-App/actions/workflows/ci.yml)
[![CodeQL](https://github.com/voiceyBill/voiceyBill-App/actions/workflows/codeql.yml/badge.svg)](https://github.com/voiceyBill/voiceyBill-App/actions/workflows/codeql.yml)
[![Release](https://github.com/voiceyBill/voiceyBill-App/actions/workflows/release.yml/badge.svg)](https://github.com/voiceyBill/voiceyBill-App/actions/workflows/release.yml)

Mobile React Native app (Expo) for the voiceyBill platform.

## What This App Does

voiceyBill-App helps users track income and expenses with a mobile-first experience, including:

- Transaction management
- Dashboard analytics and summaries
- Voice-assisted transaction flows
- Report and category insights
- **Multi-Currency Support**: Select currencies per-transaction, auto-convert amounts using live/cached exchange rates, see cached-rate warning indicators, and display cohesive dashboards converted to your chosen base currency.

## Open Source Standards

This repository is configured with professional OSS governance:

- CI checks for type safety and build validation
- PR title policy (Conventional Commits)
- PR template and issue forms (bug/feature/question)
- Dependency review and CodeQL security scanning
- Stale issue/PR management
- Release workflow support

## Tech Stack

- React Native
- Expo
- TypeScript
- Redux Toolkit + RTK Query
- React Navigation

## Prerequisites

- **Node.js 20.0.0 or later** (`node --version` to check)
- **npm 10.0.0 or later** (`npm --version` to check)
- Git
- **For Android development:** Android Studio (for emulator) or a physical Android device with Expo Go
- **For iOS development (macOS only):** Xcode and CocoaPods
- **Optional:** Expo Go app on a physical device for easier testing (install from App Store or Play Store)

> If you don't meet the Node/npm version requirement, download from https://nodejs.org/ (choose the LTS version 20+)

## Verify your setup

Before continuing, verify your machine meets the requirements:

```bash
node --version      # should be v20.0.0 or higher
npm --version       # should be 10.0.0 or higher
git --version       # should be 2.x or higher
```

**If versions are too old:**
- Download Node.js from https://nodejs.org/ (choose LTS v20+)
- Restart your terminal and verify again

**For physical devices (recommended):**
- Install "Expo Go" from App Store (iOS) or Play Store (Android)
- This lets you test the app without an emulator

## Quick Start

1. Install dependencies:

```bash
npm ci
```

2. Start Expo development server:

```bash
npm run start
```

You should see the Metro Bundler start with options like:
```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
› Press r │ reload app
› Press m │ toggle menu
› Press q │ quit
```

3. Run on Android:

```bash
npm run android
```

4. Run on iOS (macOS only):

```bash
npm run ios
```

5. Run on web preview (optional):

```bash
npm run web
```

## Google Play Release

APK builds are fine for local testing and sideloading, but Google Play requires an Android App Bundle (`.aab`) for production uploads.

1. Connect the Expo project to GitHub in the Expo dashboard:

```text
expo.dev -> voiceyBill project -> GitHub -> Connect GitHub
```

2. Make sure your Expo/EAS project is linked and you are signed in:

```bash
npx eas login
npx eas whoami
```

3. Build and submit automatically from Expo when `main` gets a merge by using the workflow in `.eas/workflows/production-release.yml`.

4. Build the Play Store package manually the first time if needed:

```bash
npx eas build -p android --profile production
```

5. Download the generated `.aab` from Expo/EAS.

6. In Google Play Console, create or open your app and upload the bundle to a release track:
- Internal testing for a quick private check
- Closed testing for reviewers/beta users
- Production when you are ready to go live

7. Complete the Play Console checklist:
- App name, icon, screenshots, feature graphic
- Privacy policy URL
- Content rating questionnaire
- Data safety form
- Store listing details

8. Set up Google Play submission access for automation:
- Create a Google service account in Google Play Console
- Link it to the app with Play Console permissions
- Keep the JSON key available in Expo/EAS submission settings or the workflow environment
- Upload the app manually once before API-based submissions can work

If you want a quick installable file for phones outside Play Store, keep using the `development` or `preview` profile, which still builds an APK.

## Configuration

**Important:** The app's `.env` file uses your **machine's local IP**, not `localhost`:

```bash
# Find your local IP
# Windows: ipconfig
# Mac/Linux: ifconfig

# Then edit .env to use it:
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

- Copy values from `.env.example` to `.env`
- Do not commit secrets or credentials

## Local Quality Checks

Before opening a PR, run:

```bash
npx tsc --noEmit
npm test --if-present
npm run lint --if-present
```

## Project Structure

```text
voiceyBill-App/
  App.tsx
  app.json
  src/
    components/
    context/
    features/
    lib/
    navigation/
    screens/
    store/
    theme/
    types/
```

## Troubleshooting

### Node or npm version mismatch

If you see errors about "node-gyp", "native modules", or version warnings:

1. Check your versions:
   ```bash
   node --version        # should be v20.0.0 or higher
   npm --version         # should be 10.0.0 or higher
   ```

2. Upgrade if needed from https://nodejs.org/

3. Clear and reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm ci
   ```

### Expo start fails or app won't load

1. Clear Expo cache:
   ```bash
   npm run start -- --clear
   ```

2. Kill and restart:
   ```bash
   npm run start
   ```

3. On the emulator or device, reload by:
   - **Android:** Press `r` in the Metro Bundler terminal
   - **iOS:** Press `r` in the Metro Bundler terminal

### "Cannot find module" or dependency errors

1. Reinstall clean dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm ci
   ```

2. If the issue persists, check if your Node version meets the requirement (20+).

### Device/Emulator can't reach backend

1. The app's `.env` file should point to your machine's local IP, not `localhost`:
   ```bash
   # Wrong:
   EXPO_PUBLIC_API_URL=http://localhost:8000/api

   # Correct (use your PC's IP):
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
   ```

2. Find your IP:
   - **Windows:** `ipconfig` → look for "IPv4 Address"
   - **Mac/Linux:** `ifconfig` → look for "inet" (not 127.0.0.1)

3. Verify the backend is running:
   ```bash
   curl http://YOUR_IP:8000/health
   ```

## Contribution Workflow

1. Fork the repo
2. Create a branch (`feat/...` or `fix/...`)
3. Make focused changes
4. Run local checks
5. Open a PR using the template

## Issues and Pull Requests

- Use the issue templates for bugs, features, and questions.
- Attach screenshots, screen recordings, or GIFs for visual issues and UI changes.
- Use the pull request template and complete every required section before review.
- Link the related issue in your PR whenever possible.

Detailed contribution rules are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Community & Policies

- Contributing guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](SECURITY.md)
- Support guide: [SUPPORT.md](SUPPORT.md)
- Branch protection checklist: [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md)
- Developer setup details: [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)

## Security Reporting

For vulnerabilities, do not open a public issue. Use GitHub Security Advisories as described in [SECURITY.md](SECURITY.md).

