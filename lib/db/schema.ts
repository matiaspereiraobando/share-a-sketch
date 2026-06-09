import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const drawingStatusEnum = pgEnum("drawing_status", [
  "active",
  "hidden",
]);

export const voteTypeEnum = pgEnum("vote_type", ["thumb", "flag"]);

/**
 * One sketch. `strokes` is the compact, replay-ordered point payload.
 * `palette_id` references a palette in lib/palettes.ts (kept in code, not DB).
 */
export const drawings = pgTable(
  "drawings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paletteId: text("palette_id").notNull(),
    authorName: text("author_name").notNull(),
    pointCount: integer("point_count").notNull(),
    strokes: jsonb("strokes").notNull(),
    thumbsUp: integer("thumbs_up").notNull().default(0),
    flagCount: integer("flag_count").notNull().default(0),
    status: drawingStatusEnum("status").notNull().default("active"),
    creatorAnonId: text("creator_anon_id").notNull(),
  },
  (t) => ({
    statusCreatedIdx: index("drawings_status_created_idx").on(
      t.status,
      t.createdAt,
    ),
    creatorIdx: index("drawings_creator_idx").on(t.creatorAnonId),
  }),
);

/**
 * One vote (thumb or flag) per anon per drawing. Enforced by the unique
 * index so dedupe is at the DB level.
 */
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    drawingId: uuid("drawing_id")
      .notNull()
      .references(() => drawings.id, { onDelete: "cascade" }),
    anonId: text("anon_id").notNull(),
    type: voteTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueVote: uniqueIndex("votes_drawing_anon_unique").on(
      t.drawingId,
      t.anonId,
    ),
  }),
);

export type DrawingRow = typeof drawings.$inferSelect;
export type NewDrawingRow = typeof drawings.$inferInsert;
export type VoteRow = typeof votes.$inferSelect;

/**
 * Stored stroke shape inside `drawings.strokes` (JSONB). Compact format:
 *   c: palette color index
 *   w: stroke-width index (into STROKE_WIDTHS)
 *   p: flat array of points [x0, y0, x1, y1, ...]
 */
export type StoredStroke = {
  c: number;
  w: number;
  p: number[];
};

export type StoredDrawing = {
  paletteId: string;
  strokes: StoredStroke[];
};

/**
 * Helper to keep TS happy when we read jsonb back.
 */
export const strokesAsJson = sql<StoredStroke[]>`${drawings.strokes}`;
