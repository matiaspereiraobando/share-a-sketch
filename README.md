# Share-a-Sketch

A retro collaborative drawing game. Draw a sketch on an Etch-a-Sketch-style canvas, share it, and then watch random sketches from other players replay stroke-by-stroke. The only way to view other people's sketches is to share one of your own.

A modern rebuild of an old ActionScript game.

## Tech stack

- **Next.js** (App Router) + **TypeScript**
- **Neon** serverless Postgres + **Drizzle ORM**
- **HTML5 Canvas** for drawing and replay
- Deployed on **Vercel**

## How it works

- Pick a palette and start drawing. Each stroke is captured as a list of points referencing a palette color index, so palettes can be tweaked or swapped on stored drawings later.
- Each sketch has a hard point budget (`MAX_POINTS` in `lib/constants.ts`); a small progress bar shows how much you've used. When you hit the cap, the current stroke ends.
- Click **Share**, optionally enter a name, and your sketch is saved.
- Immediately afterward you're shown a random sketch from the database, replayed at `REPLAY_POINTS_PER_SECOND` points per second.
- React with thumbs up or flag (only after the replay finishes). After `FLAG_THRESHOLD` flags, a sketch is soft-hidden.
- Click **Show another** to see another random sketch, or **Draw new** to start a new one.

Tunable constants live in [`lib/constants.ts`](./lib/constants.ts).

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Postgres database. Easiest option: a free [Neon](https://neon.tech) project. Copy the **pooled** connection string.
3. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL`.
4. Push the schema to your database:
   ```bash
   npm run db:push
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000).

### Smoke test

With the dev server (or a deployed instance) reachable, run:

```bash
npm run smoke
# or against a deployed URL:
BASE_URL=https://yourapp.vercel.app npm run smoke
```

This exercises submit, random, get-by-id and vote (with dedupe) end-to-end.

## Deploy to Vercel

1. Push the repo to GitHub.
2. On [Vercel](https://vercel.com), import the project. Defaults are fine (Next.js is auto-detected).
3. In **Project Settings -> Environment Variables**, add:
   - `DATABASE_URL` = your Neon pooled connection string.
4. Deploy. Vercel will run `next build` automatically.
5. Push the schema to production (one-time):
   ```bash
   DATABASE_URL="<prod-url>" npm run db:push
   ```
6. (Optional) Run the smoke test against the deployed URL.

## Project layout

```
app/
  api/drawings/             POST + random GET
  api/drawings/[id]/        GET by id
  api/drawings/[id]/vote/   POST vote
  components/               EtchCanvas, EtchFrame, Toolbar, ViewerControls, ShareDialog, Window95, ShortIdChip
  page.tsx                  main draw/view state machine
drizzle/                    generated migrations
lib/
  db/                       drizzle schema and lazy client
  anonId.ts                 client-side anon browser id
  api.ts                    server-side helpers (json + anon header)
  apiClient.ts              typed fetch wrapper
  constants.ts              tunable knobs (MAX_POINTS, REPLAY_POINTS_PER_SECOND, FLAG_THRESHOLD)
  drawings.ts               db helpers (random pick, by id)
  palettes.ts               palette catalog (index-based color storage)
  replay.ts                 time-based replay hook
  types.ts                  shared DTOs
  validation.ts             payload validation
scripts/smoke.mjs           end-to-end smoke test
```

## License

MIT
