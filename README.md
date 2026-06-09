# Share-a-Sketch

A retro collaborative drawing game. Draw a sketch on an Etch-a-Sketch-style canvas, share it, and then watch random sketches from other players replay stroke-by-stroke. The only way to view other people's sketches is to share one of your own.

A modern rebuild of an old ActionScript game.

## Tech stack

- **Next.js** (App Router) + **TypeScript**
- **Neon** serverless Postgres + **Drizzle ORM**
- **HTML5 Canvas** for drawing and replay
- Deployed on **Vercel**

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (from [Neon](https://neon.tech) or any Postgres provider).
3. Push the schema to your database:
   ```bash
   npm run db:push
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

## How it works

- Draw a sketch using the palette, stroke widths, undo and reset tools.
- Each sketch has a hard point budget (`MAX_POINTS` in `lib/constants.ts`); a small progress bar shows how much you've used.
- Strokes are stored as compact arrays of points referencing a palette color index, so palettes could be swapped on stored drawings later.
- Click **Share**, optionally enter a name, and your sketch is saved.
- Immediately afterward you're shown a random sketch from the database, replayed in the order it was drawn.
- React with thumbs up or flag. After enough flags, a sketch is soft-hidden.

## Deployment

Deployed on Vercel with the database hosted on Neon. Set `DATABASE_URL` in Vercel project env vars and you're set.

## License

MIT
