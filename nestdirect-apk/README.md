# NestDirect Android App

This is a Capacitor WebView wrapper that loads https://nest-direct-webapp.vercel.app/
inside a native Android app shell.

## How to get your APK

1. Create a new **empty** repository on GitHub (don't add a README there).
2. In this folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial NestDirect APK project"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
3. Go to your repo on GitHub → the **Actions** tab.
4. Wait for the "Build Android APK" workflow to finish (~2-4 minutes).
5. Click into the finished run → under **Artifacts**, download `NestDirect-debug-apk`.
6. Unzip it — inside you'll find `app-debug.apk`. Transfer it to your phone and install
   (you may need to allow "install from unknown sources" in Android settings).

## Notes

- This produces a **debug** APK — fine for personal installs and testing, but Android
  will show an "unverified developer" warning. That's normal for unsigned debug builds.
- If you ever want to publish this to the Play Store, you'll need to generate a signing
  key and build a **release** APK/AAB instead — let me know if you want that set up.
- To change the app name or icon later, edit `android/app/src/main/res/mipmap-*` (icons)
  and `capacitor.config.ts` (`appName`).
