# Leave Schedule — Claude notes

## Running the dev server
Claude should start the dev server itself when the user wants to test something — the user does **not** want to run `npm run dev` manually. Always start it with `run_in_background: true` so the conversation isn't blocked. Default URL: http://localhost:3000.

Scripts (from `package.json`):
- `npm run dev` — Next.js dev server (background)
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — `next lint`

## Stack
- Next.js 15 App Router, React 19, TypeScript
- Tailwind for styling, `date-fns` for dates, `react-day-picker` for date pickers
- Supabase (Postgres) for persistence — server uses the service-role key and scopes by `team_id`; RLS is on for safety but bypassed by the service role
- Auth via `iron-session` cookie

## Database migrations
SQL lives in `supabase/migrations/`. They are **not** auto-applied — paste them into the Supabase SQL editor manually after pulling new code. The latest one adds half-day variants for medical/childcare leave (`0003_add_half_day_medical_childcare.sql`).

## Public holidays
Singapore public holidays are hardcoded in [lib/holidays.ts](lib/holidays.ts). Source: https://www.mom.gov.sg/employment-practices/public-holidays. Only 2026 is published; extend the list when 2027 is released.

## Leave types
Defined in [lib/colors.ts](lib/colors.ts). Categories (annual, medical, childcare, block) × period (full, AM, PM) map to enum values via `toLeaveType` / `categoryAndPeriod`. Block has no AM/PM. Half-day variants count as 0.5 days. Weekends and public holidays are filtered server-side in `POST /api/leave` so leave never lands on them.

## "Push to the site" workflow
When the user says "push to the site" (or similar), this is the deploy. Vercel auto-deploys from pushes to `origin/main` (the previous commit `Trigger Vercel rebuild` confirms this). Claude should do the whole sequence without asking:

1. `npm run build` — confirm it compiles.
2. `git status` + `git diff` to sanity-check what's about to ship; **never** stage `.env*` or `.vercel/`.
3. Stage the actual changed files by name (avoid `git add -A`).
4. Commit with a short message describing the user-visible change (no "Co-Authored-By" trailer unless requested).
5. `git push origin main`.
6. Tell the user the commit/branch was pushed and that Vercel will rebuild.

**The only thing that needs the user**: when a migration in `supabase/migrations/` is part of the push, give them step-by-step instructions to paste it into the Supabase SQL editor before the new code goes live. Claude cannot run SQL on Supabase from here.
