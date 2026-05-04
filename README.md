# Leave Schedule

A small, private leave-tracking calendar for teams. Anyone with the team password can log full-day, half-day, travel, medical, or childcare leave for any member; mark important dates (public holidays, big meetings); and see the whole team at a glance.

- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres) · iron-session
- **Hosting:** designed for Vercel + Supabase free tiers
- **Corporate-firewall friendly:** no third-party fonts, analytics, CDNs, or trackers; strict CSP; single domain (`*.vercel.app`)

## Local development

```bash
# 1. install
pnpm install         # or `npm install` / `yarn`

# 2. configure env
cp .env.example .env.local
#   SUPABASE_URL=https://xxxxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=...           (Supabase project settings → API)
#   SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
#   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# 3. create the schema
#    Open Supabase → SQL Editor and run the contents of:
#    supabase/migrations/0001_init.sql

# 4. run the app
pnpm dev
# → http://localhost:3000
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** the repo.
3. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (32+ chars)
   - `NEXT_PUBLIC_SUPABASE_URL`
4. Deploy. Run `supabase/migrations/0001_init.sql` once in the Supabase SQL editor (if not already).

## How it works

- **Auth.** Each team has a single shared password (bcrypt-hashed). On login, an `iron-session` cookie carries the `team_id` for 30 days.
- **Authorisation.** Every API route reads the cookie and scopes its DB query to that `team_id`. The Supabase service role key is used server-side only; RLS is enabled so anonymous clients cannot read tables directly.
- **Data.** Members live in columns; dates in rows. Each `leave_entry` is one (member, date, leave_type) row, allowing AM half-day and PM travel on the same day.
- **Important dates** are per-team labels with a colour and optional notes; rendered as a left accent stripe + chip on the date row.

## Smoke test (manual)

1. **Create team:** open `/`, switch to "Create team", enter "Demo" + a 6+ char password.
2. **Add 3 members** via the "Members" button.
3. **Log a full day** for member A today → soft sage pill appears.
4. **Log AM half-day + PM travel** for member B same day → cell shows two pills.
5. **Mark a public holiday** with amber colour → row gets left stripe + chip.
6. **Scroll a few months** → Saturday/Sunday rows are warm grey.
7. **Sign out** → revisiting `/team` redirects to `/`.
8. **Wrong password** is rejected; correct password loads only that team's data.
9. **DevTools → Network** during use: only `localhost`/your domain and `*.supabase.co` connections.

## Project layout

```
app/
  layout.tsx, page.tsx, LoginForm.tsx
  globals.css
  team/
    page.tsx
    components/{Dashboard, Grid, Legend, LeaveModal, MemberDialog, ImportantDateDialog, RangePicker, Modal, types}.tsx
  api/
    teams/route.ts
    auth/{login,logout}/route.ts
    team/data/route.ts
    members/{route,[id]/route}.ts
    leave/{route,[id]/route}.ts
    important-dates/{route,[id]/route}.ts
lib/
  supabase.ts, auth.ts, colors.ts, dates.ts, schema.ts, api.ts
supabase/
  migrations/0001_init.sql
```

## Notes for corporate networks

The app intentionally avoids:
- Google Fonts / external font CDNs (uses the system font stack).
- Analytics SDKs (PostHog, GA, Sentry).
- Third-party `<script>` or `<link>` references.

`next.config.ts` sets a strict Content-Security-Policy that only allows `'self'` plus your Supabase host for `connect-src`, plus HSTS, X-Frame-Options DENY, and `Permissions-Policy` lockdowns. Cookies are HttpOnly + Secure (in production) + SameSite=Lax.

If your organisation requires a custom domain, add it in Vercel → Domains and update `NEXT_PUBLIC_SUPABASE_URL` if you self-host Supabase on a different host.
