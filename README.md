# Logic Looper (Phase 1)

Client-first daily puzzle game foundation.

## What’s included

- Vite + React + Tailwind
- Neon Postgres + Prisma (minimal tables)
- Vercel-style serverless API routes under `api/`
- Client auth scaffolding (Guest works; Google/Truecaller optional via env vars)
- IndexedDB storage (Dexie) for offline daily progress caching

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

See `.env.example`.

## Deploy to Vercel

1) Import this repo in Vercel.
2) Add env vars in Vercel Project Settings → Environment Variables:
   - `DATABASE_URL`
   - any optional `VITE_*` variables you need
3) Deploy.
