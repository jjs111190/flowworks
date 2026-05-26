# FlowWorks

FlowWorks is a full-stack MVP for work chat, team collaboration, and Jira-style project management. The API can run completely free with local JSON persistence, no paid database, no paid storage, and no mandatory third-party API.

The web app now also has a default standalone mode. In standalone mode it does not need the FlowWorks API server at all. Data is stored on the device in browser storage, and the built app is installable on iPhone and Android as a PWA.

## Stack

- Frontend: React, TypeScript, Vite, Zustand, Lucide icons
- Backend: Node.js, Express, WebSocket, JWT, rate limiting, Zod validation
- Free API persistence: local JSON file at `backend/data/flowworks.json`
- Optional database model: PostgreSQL with Prisma schema for later production migration
- Integrations: Mock Jira Provider and Real Jira Provider interface

## Run The Free API

```bash
npm install
cp .env.example .env
npm run dev:api:free
```

API base URL: `http://localhost:4000/api`
API docs endpoint: `http://localhost:4000/api/docs`

Demo login:

```text
jae@flowworks.local
flowworks123!
```

## Build The No-Server Installable App

```bash
npm install
npm run build:pwa
```

The output is in `dist/`. Host `dist/` on any free static host:

- GitHub Pages
- Cloudflare Pages free tier
- Netlify free tier
- Vercel static hosting free tier

No FlowWorks backend is required when `VITE_API_MODE=standalone`, which is the default.

For a quick local preview:

```bash
npm run preview
```

The local preview uses a static file server only so the browser can load the PWA. It is not the FlowWorks API backend.

## Install On iPhone

1. Open the hosted FlowWorks URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Open FlowWorks from the home screen.

## Install On Android

1. Open the hosted FlowWorks URL in Chrome.
2. Tap Install app, or open the menu and tap Add to Home screen.
3. Open FlowWorks from the app icon.

PWA installation requires HTTPS except on localhost. Static hosts listed above provide HTTPS for free.

## Install On iPhone With Xcode

FlowWorks now includes a Capacitor iOS project so it can be installed like an app from Xcode without running the FlowWorks API server.

First-time setup:

```bash
npm run ios:add
npm run ios:open
```

After code changes:

```bash
npm run ios:sync
npm run ios:open
```

Then in Xcode:

1. Select the `App` target.
2. Open `Signing & Capabilities`.
3. Enable automatic signing.
4. Choose your Apple ID personal team.
5. Select your iPhone and press Run.

See `docs/IOS_XCODE_FREE_INSTALL.md`.

## Android Native Install

First-time setup:

```bash
npm run android:add
npm run android:open
```

After code changes:

```bash
npm run android:sync
npm run android:open
```

Android Studio can build a local APK for direct installation. Google Play Store distribution requires a Play Console account.

## Environment

Use `.env.example` as the baseline. Important values:

- `JWT_SECRET` and `REFRESH_TOKEN_SECRET`: set long random values outside local development.
- `ENCRYPTION_KEY`: base64-encoded 32-byte key for integration token encryption.
- `FLOWWORKS_DATA_PATH`: free local JSON persistence path.
- `VITE_API_MODE`: `standalone` for no-server app, `server` for backend API mode.
- `DATABASE_URL`: optional PostgreSQL connection for Prisma migration later.
- `JIRA_PROVIDER`: use `mock` for MVP, `real` when testing Jira Cloud API calls.
- `JIRA_CLOUD_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`: backend-only Jira credentials.

## Free API Endpoints

All protected endpoints use `Authorization: Bearer <accessToken>`.

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/bootstrap`
- `GET|POST|PATCH /api/workspaces`
- `GET|POST|PATCH /api/workspaces/:workspaceId/members`
- `GET|POST /api/rooms`
- `GET|POST /api/rooms/:roomId/messages`
- `PATCH|DELETE /api/messages/:messageId`
- `POST /api/messages/:messageId/issue`
- `POST /api/messages/:messageId/task`
- `GET|POST|PATCH /api/projects`
- `GET|POST|PATCH /api/issues`
- `GET|POST /api/issues/:issueId/comments`
- `GET|POST|PATCH /api/sprints`
- `GET|POST|PATCH /api/tasks`
- `GET|POST /api/attachments`
- `GET|PATCH /api/notifications`
- `POST /api/integrations/jira/connect`
- `GET /api/integrations/jira/projects`
- `POST /api/webhooks/:workspaceId/:eventType`

## Database Migration

The free API does not require a database. It persists to `FLOWWORKS_DATA_PATH`.

The optional production-ready schema is in `backend/prisma/schema.prisma`.

```bash
npm run prisma:generate
npm run prisma:migrate
```

For local PostgreSQL, create a `flowworks` database and update `DATABASE_URL` first.

## Tests And Verification

```bash
npm run typecheck
npm run test
npm run build
```

## Implemented

- Email login and registration with workspace creation
- Workspace/member/role data model
- Responsive desktop 3-column shell and mobile bottom tabs
- Chat room list, message detail, message input, optimistic sending, retry state
- Message-to-issue and message-to-task conversion
- Project list, issue list, issue detail, comments, activity feed
- Kanban board with drag-and-drop status changes and optimistic rollback
- Backlog, sprint cards, task dashboard, files view, notifications, admin/settings surfaces
- REST API with JWT auth, workspace ACL checks, rate limiting, Zod validation
- WebSocket authentication, room join/leave, message events, typing/read event hooks, issue events
- Local JSON persistence with atomic file writes
- Prisma schema for users, workspaces, rooms, messages, projects, issues, sprints, tasks, notifications, integrations, webhooks, activity logs
- Jira Mock Provider, Real Jira Provider boundary, encrypted config storage path
- Upload and notification policy helpers
- Light/dark theme and Apple-style design tokens

## Jira Setup

MVP mode uses the mock Jira provider:

```env
JIRA_PROVIDER=mock
```

To test real Jira reads:

```env
JIRA_PROVIDER=real
JIRA_CLOUD_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=your-token
```

Tokens are submitted only to the backend and encrypted before storage. Real issue creation and workflow transitions are intentionally isolated behind `RealJiraProvider` because Jira workflow transition IDs vary by project.

## Not Yet Implemented

- Prisma Client repository, only needed when moving beyond the free local JSON backend
- Refresh token rotation and session table
- Production file upload transport to Supabase Storage or Cloudflare R2
- Native iOS/Android shell with Expo
- Desktop shell with Electron or Tauri
- Push notifications and desktop notification permissions
- Full webhook secret registry and deduplication table
- Real Jira issue creation/transition mapping UI
- End-to-end tests

## Recommended Next Steps

1. Replace the in-memory repository with Prisma service methods.
2. Add refresh token persistence, token rotation, and audit log writes for auth events.
3. Add object storage adapter and signed attachment URLs.
4. Expand Jira sync workers with retry and deduplication.
5. Wrap this web client with Expo Router or split shared domain modules for native clients.
