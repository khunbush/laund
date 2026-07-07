# Laund

A cash collection tracker for the laundromat. Log each collection session (date +
banknote/coin counts), track running totals, and see historical performance and
projections on a dashboard. Installable as a PWA on iPhone.

## Stack

Next.js (App Router) · Prisma ORM + PostgreSQL (Neon) · Tailwind CSS · Recharts

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in real values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` / `DIRECT_URL`: a Postgres connection string. For local dev
     you can point both at a local Postgres database.
   - `APP_PASSCODE`: the passcode used to unlock the app.
   - `COOKIE_SECRET`: a random 32+ byte secret (`openssl rand -hex 32`).

3. Apply the database schema:

   ```bash
   npx prisma migrate dev
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Visit http://localhost:3000 — you'll be redirected to `/login` until you
   enter `APP_PASSCODE`.

## Deploying to production (Vercel + Neon)

1. Push this repo to GitHub and import it into [Vercel](https://vercel.com/new).
2. In the Vercel project's **Storage** tab, connect a **Neon** Postgres
   database (or create one at [neon.tech](https://neon.tech) and paste the
   connection strings manually). This populates `DATABASE_URL` (pooled) and
   `DIRECT_URL` (direct/unpooled) automatically.
3. Set `APP_PASSCODE` and `COOKIE_SECRET` in the Vercel project's environment
   variables (Production). No other configuration is needed — the `build`
   script already runs `prisma generate && prisma migrate deploy` before
   `next build`, so pending migrations apply automatically on every deploy
   (and a bad migration fails the build instead of silently breaking
   production).
4. Deploy. Visit the deployed URL and confirm the passcode gate appears.

## Installing on an iPhone home screen

Open the deployed URL in Safari → Share → **Add to Home Screen**. The app
launches standalone (no browser chrome) using the icon and theme colors
defined in `public/manifest.json`.

## Optional: automatic monthly backup email

A Vercel Cron job (`vercel.json`) hits `/api/backup` on the 1st of each month,
which emails the full sessions CSV. It stays disabled until three env vars are
set on the Vercel project:

1. `RESEND_API_KEY` — free key from [resend.com](https://resend.com). Sign up
   with the same email you want backups sent to (the default
   `onboarding@resend.dev` sender can only deliver to the account owner).
2. `BACKUP_EMAIL` — the destination inbox.
3. `CRON_SECRET` — any random string (`openssl rand -hex 32`); Vercel Cron
   automatically presents it as a bearer token so nobody else can trigger the
   endpoint.

Redeploy after setting them. Manual on-demand backups are always available via
the "Export CSV" button in History.

## Notes on data safety

- There is no delete UI for sessions — this is intentional for a financial
  record. If a session needs to be removed, do it directly via the Neon SQL
  console.
- Every save recomputes the total server-side from the denomination counts —
  the client-submitted total is never trusted.
