# Logic Looper

Client-first daily puzzle game (Phases 1–4).

## What’s included

- Vite + React + Tailwind
- Neon Postgres + Prisma (minimal tables)
- Vercel-style serverless API routes under `api/`
- Client auth scaffolding (Guest works; Google/Truecaller optional via env vars)
- IndexedDB storage (Dexie) for offline daily progress caching
- Phase 2: deterministic daily puzzle engine + 5 puzzle types + validators + basic UI
- Phase 3: streaks + heatmap, daily reset, hints + scoring, responsive polish
- Phase 4: Framer Motion transitions, PWA offline support, optional client analytics

## Local development

### Option A: Frontend only (no `/api/*` locally)

```bash
npm install
npm run dev
```

### Option B: Full stack locally (recommended)

This project uses Vercel serverless functions under `api/`. To run those locally:

```bash
npm install
npm i -g vercel
vercel dev
```

Then open:

- `http://localhost:3000/api/health`
- `http://localhost:3000`

If you use `vercel dev`, set in `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

## Database (Neon + Prisma)

1) Create a Neon project and copy the connection string.
2) Put it in `.env` as `DATABASE_URL`.
3) Sync schema:

```bash
npx prisma validate
npx prisma db push
```

## Environment variables

Required:

- `DATABASE_URL`

Optional (enable logins):

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_TRUECALLER_SDK_URL`
- `VITE_TRUECALLER_PARTNER_KEY`

Optional (client analytics):

- `VITE_ANALYTICS_ENDPOINT` (POST JSON events; if unset, analytics is disabled)

See `.env.example`.

## Deploy to Vercel

1) Import this repo in Vercel.
2) Add env vars in Vercel Project Settings → Environment Variables:
   - `DATABASE_URL`
   - any optional `VITE_*` variables you need
3) Deploy.

## PWA / Offline

The app registers a service worker in production builds. After you deploy (or run `npm run preview`), it can work offline for already-cached pages/assets.
