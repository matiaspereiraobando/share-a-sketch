import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { drawings, votes, type StoredStroke } from "@/lib/db/schema";
import type {
  AdminDrawingDTO,
  AdminDrawingListResponse,
  AdminDrawingSummary,
  AdminVote,
  DrawingStatus,
} from "@/lib/types";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

export type AdminListSort = "created_desc" | "flags_desc" | "thumbs_desc";
export type AdminListStatus = "all" | "active" | "hidden";

export type ListDrawingsParams = {
  status?: AdminListStatus;
  q?: string | null;
  page?: number;
  pageSize?: number;
  sort?: AdminListSort;
};

function buildWhere(status: AdminListStatus, q: string | null): SQL | undefined {
  const conditions: SQL[] = [];
  if (status === "active" || status === "hidden") {
    conditions.push(eq(drawings.status, status));
  }
  if (q) {
    const trimmed = q.trim();
    if (trimmed.length > 0) {
      const like = `%${trimmed}%`;
      const idLike = ilike(sql`${drawings.id}::text`, like);
      const nameLike = ilike(drawings.authorName, like);
      const orClause = or(idLike, nameLike);
      if (orClause) conditions.push(orClause);
    }
  }
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function buildOrder(sort: AdminListSort) {
  switch (sort) {
    case "flags_desc":
      return [desc(drawings.flagCount), desc(drawings.createdAt)];
    case "thumbs_desc":
      return [desc(drawings.thumbsUp), desc(drawings.createdAt)];
    case "created_desc":
    default:
      return [desc(drawings.createdAt)];
  }
}

export async function listDrawings(
  params: ListDrawingsParams,
): Promise<AdminDrawingListResponse> {
  const status = params.status ?? "all";
  const q = params.q ?? null;
  const sort = params.sort ?? "created_desc";
  const pageSize = clampPageSize(params.pageSize ?? DEFAULT_PAGE_SIZE);
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const where = buildWhere(status, q);
  const order = buildOrder(sort);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(drawings)
    .where(where);

  const rows = await db
    .select({
      id: drawings.id,
      authorName: drawings.authorName,
      paletteId: drawings.paletteId,
      pointCount: drawings.pointCount,
      thumbsUp: drawings.thumbsUp,
      flagCount: drawings.flagCount,
      status: drawings.status,
      createdAt: drawings.createdAt,
      promptText: drawings.promptText,
      creatorAnonId: drawings.creatorAnonId,
    })
    .from(drawings)
    .where(where)
    .orderBy(...order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const items: AdminDrawingSummary[] = rows.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    paletteId: r.paletteId,
    pointCount: r.pointCount,
    thumbsUp: r.thumbsUp,
    flagCount: r.flagCount,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    promptText: r.promptText,
    creatorAnonId: r.creatorAnonId,
  }));

  return { items, total: count ?? 0, page, pageSize };
}

function clampPageSize(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE;
  if (n > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
  return Math.floor(n);
}

export async function getAdminDrawingById(
  id: string,
): Promise<AdminDrawingDTO | null> {
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
      promptText: drawings.promptText,
      status: drawings.status,
      creatorAnonId: drawings.creatorAnonId,
    })
    .from(drawings)
    .where(eq(drawings.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    authorName: row.authorName,
    paletteId: row.paletteId,
    strokes: row.strokes as StoredStroke[],
    thumbsUp: row.thumbsUp,
    flagCount: row.flagCount,
    pointCount: row.pointCount,
    createdAt: row.createdAt.toISOString(),
    promptText: row.promptText,
    status: row.status,
    creatorAnonId: row.creatorAnonId,
  };
}

export async function setDrawingStatus(
  id: string,
  status: DrawingStatus,
): Promise<AdminDrawingDTO | null> {
  await db.update(drawings).set({ status }).where(eq(drawings.id, id));
  return getAdminDrawingById(id);
}

export async function getVotesForDrawing(id: string): Promise<AdminVote[]> {
  const rows = await db
    .select({
      type: votes.type,
      createdAt: votes.createdAt,
      anonId: votes.anonId,
    })
    .from(votes)
    .where(eq(votes.drawingId, id))
    .orderBy(asc(votes.createdAt));

  return rows.map((r) => ({
    type: r.type,
    createdAt: r.createdAt.toISOString(),
    anonIdPreview: previewAnonId(r.anonId),
  }));
}

export async function listDrawingsByCreator(
  anonId: string,
): Promise<AdminDrawingSummary[]> {
  const rows = await db
    .select({
      id: drawings.id,
      authorName: drawings.authorName,
      paletteId: drawings.paletteId,
      pointCount: drawings.pointCount,
      thumbsUp: drawings.thumbsUp,
      flagCount: drawings.flagCount,
      status: drawings.status,
      createdAt: drawings.createdAt,
      promptText: drawings.promptText,
      creatorAnonId: drawings.creatorAnonId,
    })
    .from(drawings)
    .where(eq(drawings.creatorAnonId, anonId))
    .orderBy(desc(drawings.createdAt));

  return rows.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    paletteId: r.paletteId,
    pointCount: r.pointCount,
    thumbsUp: r.thumbsUp,
    flagCount: r.flagCount,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    promptText: r.promptText,
    creatorAnonId: r.creatorAnonId,
  }));
}

/**
 * Truncated anon id shown in admin tables. Full id stays server-side; the
 * preview is enough to spot patterns without putting the full identifier
 * in the DOM.
 */
export function previewAnonId(anonId: string): string {
  if (anonId.length <= 8) return anonId;
  return `${anonId.slice(0, 8)}...`;
}
