# HackRadar — Personalized Hackathon Discovery (Phase 1 MVP)

A hackathon-first discovery platform for Indian students: search, filters,
deadline countdowns, a basic explainable match score, save/bookmark, and a
secondary coding-contests view — built as a real, runnable Phase 1 MVP.

## Stack (and why)

- **Backend:** Node.js + Express
- **Database:** SQLite via `better-sqlite3` — zero setup, one file (`dev.db`),
  no server to install or manage. The schema is deliberately written so it's
  a one-line change to move to Postgres later (see "Moving to Postgres" below).
- **Frontend:** Plain HTML/CSS/JS, no build step. Tailwind-less, custom CSS
  system in `frontend/css/style.css`. This was a deliberate choice to match
  where you're at with web dev right now — you can open any `.html` file and
  read the whole page top to bottom, no JSX/bundler/config to learn first.

This is a smaller stack than the original spec (which asked for React/TS,
Prisma+Postgres, auth, and background scraper workers). Everything in that
spec is still possible on top of this — the data model, API shape, and
folder structure were built to extend, not to throw away. See "Roadmap"
below for what Phase 2/3 would add and where.

## Project structure

```
hackradar/
  backend/
    src/
      db.js         — SQLite connection, loads schema.sql on boot
      schema.sql     — table definitions (events, user_profiles, saved_events)
      utils.js       — id generation, status derivation, csv helpers
      matchScore.js  — the explainable recommendation engine
      seed.js        — realistic mock data (18 hackathons + 5 contests)
      routes.js      — all /api endpoints
      server.js      — Express app entry point
    prisma/
      schema.prisma  — the SAME data model, written for Postgres+Prisma.
                        Reference for Phase 2, not currently run.
    package.json
    .env             — DATABASE_URL, PORT
  frontend/
    index.html       — dashboard
    explore.html      — search + filters
    closing-soon.html
    saved.html
    calendar.html
    contests.html
    profile.html
    detail.html
    css/style.css
    js/               — api.js, format.js, cards.js, home.js, explore.js
```

## Running it

You need Node.js installed (v18+; this was built and tested on v22).

```bash
cd backend
npm install
npm run seed      # populates dev.db with mock hackathons + contests
npm run dev        # starts the server
```

Then open **http://localhost:4000** — the backend also serves the frontend,
so that one URL is the whole app. No separate frontend server needed.

To reset the data at any point, just run `npm run seed` again — it wipes
and re-inserts everything (including the demo profile, `id: "demo-user"`,
which every match score is currently computed against).

## What's implemented (Phase 1 checklist from the spec)

- [x] Normalized event model (hackathons + contests in one table, `type` field)
- [x] Hackathon listing with search, filters (mode, status, theme, location), sort
- [x] Hackathon detail page (all sections from the spec, including team-finder UI)
- [x] Deadline countdowns, computed live (not stale seed data)
- [x] "Closing Soon" view, bucketed into Today / Tomorrow / This week
- [x] A few data sources represented (Unstop, Devfolio, HackerEarth, Devpost,
      college/company/government pages) — currently mocked, behind a clean
      seed script that's easy to swap for real adapters later
- [x] Basic personalized dashboard (stat row, top matches, closing soon, city breakdown)
- [x] Save/bookmark, backed by the database (not just localStorage)
- [x] Simple explainable match-scoring engine with a plain-English "why" string
- [x] Editable profile (skills, interests, mode preference, team size) that
      actually changes your match scores
- [x] Coding contests as a clearly secondary section
- [x] Calendar (chronological list of deadlines/dates — not a month grid yet)
- [x] Team finder UI (per-hackathon role list; currently saved to
      `localStorage` per the spec's own note that Phase 1 doesn't need a
      real messaging system)

## The match-scoring engine

`backend/src/matchScore.js` implements exactly the formula from the spec —
interest match + skill match + mode preference + location + team size +
"quality" (prize pool tier as a placeholder for real reputation data) —
normalized to 0–100, with weights that sum to 100 and a generated
explanation string. It's intentionally simple so you can swap in a smarter
model later without changing any caller — every route just calls
`scoreEvent(event, profile)` and gets `{ score, breakdown, explanation }` back.

## Moving to Postgres later (Phase 2)

1. `cd backend && npm install @prisma/client && npm install -D prisma`
2. Update `backend/prisma/schema.prisma`'s `datasource` block: change
   `provider = "sqlite"` to `"postgresql"`, and set `DATABASE_URL` in `.env`
   to your Postgres connection string.
3. `npx prisma migrate dev --name init` — this creates real Postgres tables
   matching the same model you've already been using.
4. Swap `backend/src/db.js` and the raw SQL in `routes.js`/`seed.js` for
   Prisma Client calls (`prisma.event.findMany(...)`, etc). The API
   endpoints and response shapes don't need to change — the frontend won't
   notice the difference.

(This step needed network access to Prisma's binary CDN, which wasn't
available in the sandbox this was built in — that's the only reason it
wasn't done as SQLite-with-Prisma from the start. On your own machine with
normal internet access, you could actually run Prisma+SQLite directly if
you'd rather stay off Postgres a while longer.)

## Roadmap: Phase 2 and Phase 3

**Phase 2**
- Real authentication (so `demo-user` becomes real accounts)
- Real scrapers/API clients behind the same seed-script shape — each source
  becomes an "adapter" that outputs the same normalized event object
- Duplicate detection (title+organizer+date similarity — start here before
  reaching for embeddings)
- Email digest, notifications
- A real month-grid calendar view

**Phase 3**
- Persisted, discoverable team finder (currently local-only)
- India map with per-city density
- Smarter recommendation model behind the same `scoreEvent()` interface

## A note on scope

The original brief specified a considerably larger system (React/TypeScript,
Postgres, background scraper workers with rate limiting, real auth,
semantic dedup). All of that is a reasonable end state — it's just not a
one-session build, and layering it onto a stack you're still learning would
slow you down more than it'd help for a hackathon-timeline project. This MVP
is deliberately built so every one of those upgrades is additive rather than
a rewrite.
