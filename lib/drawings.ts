import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { drawings, type StoredStroke } from "@/lib/db/schema";
import type { DrawingDTO } from "@/lib/types";

export async function pickRandomDrawing(
  excludeId: string | null,
): Promise<DrawingDTO | null> {
  const whereClause = excludeId
    ? and(eq(drawings.status, "active"), ne(drawings.id, excludeId))
    : eq(drawings.status, "active");

  const rows = await db
    .select({
      id: drawings.id,
      authorName: drawings.authorName,
      paletteId: drawings.paletteId,
      strokes: drawings.strokes,
      thumbsUp: drawings.thumbsUp,
      flagCount: drawings.flagCount,
      pointCount: drawings.pointCount,
      createdAt: drawings.createdAt,
    })
    .from(drawings)
    .where(whereClause)
    .orderBy(sql`random()`)
    .limit(1);

  if (rows.length === 0) return null;
  return toDTO(rows[0]);
}

export async function getDrawingById(id: string): Promise<DrawingDTO | null> {
  const rows = await db
    .select({
      id: drawings.id,
      authorName: drawings.authorName,
      paletteId: drawings.paletteId,
      strokes: drawings.strokes,
      thumbsUp: drawings.thumbsUp,
      flagCount: drawings.flagCount,
      pointCount: drawings.pointCount,
      createdAt: drawings.createdAt,
      status: drawings.status,
    })
    .from(drawings)
    .where(eq(drawings.id, id))
    .limit(1);

  if (rows.length === 0) return null;
  if (rows[0].status !== "active") return null;
  return toDTO(rows[0]);
}

export async function anonHasSubmitted(anonId: string): Promise<boolean> {
  const rows = await db
    .select({ id: drawings.id })
    .from(drawings)
    .where(eq(drawings.creatorAnonId, anonId))
    .limit(1);
  return rows.length > 0;
}

type RowLike = {
  id: string;
  authorName: string;
  paletteId: string;
  strokes: unknown;
  thumbsUp: number;
  flagCount: number;
  pointCount: number;
  createdAt: Date;
};

function toDTO(row: RowLike): DrawingDTO {
  return {
    id: row.id,
    authorName: row.authorName,
    paletteId: row.paletteId,
    strokes: row.strokes as StoredStroke[],
    thumbsUp: row.thumbsUp,
    flagCount: row.flagCount,
    pointCount: row.pointCount,
    createdAt: row.createdAt.toISOString(),
  };
}
