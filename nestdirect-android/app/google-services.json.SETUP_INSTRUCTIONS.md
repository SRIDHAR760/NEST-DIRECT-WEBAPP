# google-services.json — REQUIRED before this project will build

This native Android app needs the SAME Firebase project as your web app
(`nestdirect-prod`), but Android requires its own config file, separate
from the web app's `firebase-applet-config.json`.

## How to get it
1. Go to https://console.firebase.google.com → select the **nestdirect-prod** project
2. Click the ⚙️ gear icon → **Project settings** → scroll to **"Your apps"**
3. Click **"Add app"** → choose the **Android** icon
4. Enter this exact package name (must match `applicationId` in `app/build.gradle.kts`):
   ```
   com.nestdirect.app
   ```
5. Skip the SHA-1 field for now (only needed later for Google Sign-In / Play Integrity)
6. Click through and **download `google-services.json`**
7. Place that downloaded file at: `app/google-services.json` (same folder as this file, replacing this placeholder)

## Why this matters
Without a real `google-services.json` in place, the build will fail at the
`com.google.gms.google-services` Gradle plugin step — this is expected and
intentional; Google requires this file to contain your actual Firebase
project's API keys and app ID, which can't be safely hardcoded or guessed.
