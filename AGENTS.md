<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Laund — project context

Personal PWA for a laundromat/snooker owner in Thailand, installed on their
iPhone. Tracks cash collections by banknote/coin denomination and reconciles
them against washing-machine revenue. Single user, passcode login. Money is
whole Thai baht (integers everywhere).

**Stack:** Next.js App Router (Turbopack) · React 19 · Tailwind v4 (theme vars
in `app/globals.css`) · Prisma 7 with `@prisma/adapter-pg`, client generated
into `./generated/prisma` (run `npx prisma generate` before typechecking) ·
Neon Postgres (free tier, auto-suspends — see warmup below) · Recharts ·
Vercel.

## Tabs / pages

| Tab | Route | What it does |
|---|---|---|
| Home | `/` | New session form (denomination counts; draft kept in localStorage; machine total since last collection streams in via Suspense — the form never waits on the DB) |
| History | `/sessions` | Session cards, paid toggle, delete, CSV export |
| Dashboard | `/dashboard` | Monthly report for one month (default: current, ‹ › to page back) |
| Match | `/compare` | Counted cash vs machine revenue windows; CSV upload; per-day/all clear |
| Branches | `/branches` | Machine-data-only performance: views Both(stacked totals)/B1/B2, month nav, daily/monthly/weekday/hourly charts |
| (All time) | `/dashboard/all-time` | Lifetime aggregates of counted cash (type-blind, by day), linked top-right from Dashboard. `/report` redirects to `/dashboard` |

## Data model (prisma/schema.prisma)

- `CollectionSession` — one cash count: date, kind (LAUNDRY/SNOOKER/LUMP_SUM),
  paid flag, per-denomination counts, totalBaht.
- `MachineDay` — one row per branch per day: revenue + txnCount. Written only
  by CSV imports (upsert per day, idempotent).
- `MachineTxn` — per-transaction timestamp + amount for time-of-day analysis.
  Only accumulates from transactional CSVs (agent uploads since 2026-07-09).
  `occurredAt` stores ICT wall-clock **as if UTC** — read with `getUTCHours`,
  never convert timezones.

## Domain facts

- Branch 1 = "washclub" (English CSV: `No,startDate,startTime,...,Amount`,
  M/D/Y). Branch 2 = "washclub v2" (Thai CSV, Buddhist years e.g. 2569; สำเร็จ
  AND กำลังทำงาน rows both count — machines still running at the ~midnight
  export are paid, that-day revenue — other statuses like ยกเลิก are
  skipped). Third format: daily summary (`Date,Total,Orders`, used
  for the Jan 1–Jul 3 2026 historical backfill — no txn times exist for it).
  All three auto-detected in `lib/machineCsv.ts`.
- An agent POSTs each day's CSV ~23:50 ICT to
  `POST /api/machine-import?branch=1|2` (bearer `MACHINE_IMPORT_TOKEN`).
- `COMPARE_START = 2026-07-04` in `lib/data/compare.ts`: machines were emptied
  uncounted on Jul 3, so Match comparison windows never reach into the
  backfill. The Branches tab intentionally uses ALL machine data.
- Branch identity colors are fixed in `lib/chartColors.ts` `BRANCH_COLORS`
  (B1 Marina terracotta, B2 LeBush forest green) — never reassign by rank.

## Conventions

- Server components + server actions; every machine-data mutation calls
  `revalidatePath` for `/compare`, `/branches` AND `/` (Home streams the
  machine total since the last collection via `getPendingMachine`).
- Machine/live pages export `dynamic = "force-dynamic"`; every tab route has
  a `loading.tsx` skeleton (dead taps feel like bugs on the phone).
- `BottomTabBar` is rendered once in `app/layout.tsx` (hidden on `/login`) —
  pages and `loading.tsx` files must NOT render it. It publishes its height
  as the `--tabbar-h` CSS var (Home's pinned Save bar sits on it).
- Recharts is lazy-loaded (`next/dynamic`, `components/charts/*`) with a
  same-height placeholder — keep new charts that way.
- Home's in-progress count persists in localStorage (`laund:count-draft:v1`)
  until saved or cleared.
- Auth: `proxy.ts` gates everything by cookie except `/login`, `api/backup`,
  `api/machine-import` (those carry bearer tokens). Env: `APP_PASSCODE`,
  `COOKIE_SECRET`, `DATABASE_URL`, `MACHINE_IMPORT_TOKEN`, `CRON_SECRET`.
- `/api/warmup` (SELECT 1) is pinged from the root layout on app open to wake
  Neon before the first tab tap — don't remove it.
- Mobile-first: `max-w-md`, test at 402×874 (iPhone 16/17 Pro logical viewport).
  Destructive buttons use the
  two-tap "Sure? Tap again" pattern (see `ClearMachineButton`).

## Git / deploy

- Functions run in `sin1` (Singapore, `vercel.json` `regions`) next to the
  Neon database (also Singapore) — keep them in the same region.
- Default branch: `claude/main`. Vercel (project `laund`, team `bushy`)
  deploys production from it — merged PR = live in ~1 min. Deploys from any
  other branch are previews only (the production-branch setting must stay
  `claude/main`).
- Build runs `prisma generate && prisma migrate deploy && next build`, so
  schema changes ship as committed migration files (create with
  `prisma migrate dev` against the local DB below).
- The PWA service worker caches the shell — after a deploy the user must
  fully close and reopen the app (sometimes twice) to see changes. When a
  navigation fails it serves `public/offline.html` (bump `CACHE_VERSION` in
  `public/sw.js` when changing it).
- Owner prefers: small PRs into `claude/main`, squash-merge, verified
  end-to-end before pushing.

## Verifying locally (no DB in the dev container)

```bash
# throwaway Postgres (must run as non-root):
su ubuntu -s /bin/bash -c "PGBIN=/usr/lib/postgresql/16/bin; \
  mkdir -p ~/pgdata ~/pgsock && \$PGBIN/initdb -D ~/pgdata -U laund --auth=trust >/dev/null; \
  \$PGBIN/pg_ctl -D ~/pgdata -o '-p 5433 -k /home/ubuntu/pgsock -c listen_addresses=127.0.0.1' -l ~/pg.log start"
/usr/lib/postgresql/16/bin/createdb -h 127.0.0.1 -p 5433 -U laund laund
DATABASE_URL="postgresql://laund@127.0.0.1:5433/laund" npx prisma migrate deploy

DATABASE_URL="postgresql://laund@127.0.0.1:5433/laund" COOKIE_SECRET=test \
  APP_PASSCODE=1234 MACHINE_IMPORT_TOKEN=test npx next dev -p 3100
```

- Drive with Playwright: `chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })`.
- Use `http://localhost:3100`, NOT `127.0.0.1` (dev server blocks cross-origin
  assets → page never hydrates).
- The splash overlay fades right after hydration and never takes taps, but
  wait ~1s after load before filling the passcode so the page is hydrated.
  The Next dev-tools "N" badge covers the Home tab in dev — click tabs via
  `el.click()` in `evaluate` if Playwright reports it intercepting. Recharts bars animate in — wait ~2-3s or screenshot
  the chart card element, not fullPage.
- `next build` fails at prerender without a reachable DB — that's expected in
  the container; `tsc --noEmit` + dev-server e2e is the verification bar.
