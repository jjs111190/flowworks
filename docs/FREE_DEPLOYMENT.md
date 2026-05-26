# FlowWorks Free Deployment

FlowWorks supports two zero-backend modes.

## 1. Native iPhone/Android App Wrapper

Uses Capacitor to package the standalone app into native iOS and Android projects.

```bash
npm run build:native
npm run ios:open
npm run android:open
```

Data is stored locally on the device. No FlowWorks server is required.

For iPhone direct install, use Xcode with a free Apple ID personal team. This is not App Store distribution.

For Android APK builds, Android Studio or an Android SDK must be installed and `ANDROID_HOME` or `android/local.properties` must point to the SDK.

## 2. Installable PWA

Build once:

```bash
npm run build:pwa
```

Upload the `dist/` directory to a free static host such as Cloudflare Pages or GitHub Pages.

Cloudflare Pages can host static files on the Free plan. Do not enable paid add-ons, Workers Paid, R2 paid usage, or other metered products if the goal is strictly zero cost.

Cloudflare Pages deploy command:

```bash
npm run deploy:cloudflare
```

This requires logging in to Cloudflare through Wrangler. Use the Free plan and keep the project static.

## GitHub Pages

GitHub Pages is the simplest option when you do not want to run any server yourself.

1. Push this repository to GitHub.
2. In the GitHub repository, open `Settings > Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to the `main` branch.
5. The workflow `.github/workflows/deploy-github-pages.yml` builds and deploys `dist/`.

The resulting URL can be opened from outside your network. On iPhone/Android, open that URL and install it to the home screen.

## Netlify Or Vercel

These configs are included:

- `netlify.toml`
- `vercel.json`

Use the free plan only, keep the app static, and do not enable serverless functions if the goal is zero backend/server cost.

## Free Server Boundary

The only truly free server architecture here is no custom server:

- Static hosting serves the app files.
- The app stores workspace data on the device.
- No backend database is required.
- No file storage bucket is required.

If you need real-time sync between devices or users, you need a backend. Cloudflare Workers/D1 can start on a free tier, but it has limits and is no longer equivalent to "no server cost forever at any usage level."
