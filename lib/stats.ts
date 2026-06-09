import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { drawings } from "@/lib/db/schema";
import type { StatsDTO } from "@/lib/types";

/**
 * Global, aggregate stats over the visible (active) sketch pool. Soft-hidden
 * sketches are excluded so the public numbers match what people can actually
 * see and browse. Totals are computed on read; `point_count` is already
 * denormalized per row, so this is a single cheap aggregate scan.
 */
export async function getStats(): Promise<StatsDTO> {
  const [row] = await db
    .select({
      totalDrawings: sql<number>`count(*)::int`,
      totalInk: sql<number>`coalesce(sum(${drawings.pointCount}), 0)::int`,
      uniqueCreators: sql<number>`count(distinct ${drawings.creatorAnonId})::int`,
    })
    .from(drawings)
    .where(eq(drawings.status, "active"));

  return {
    totalDrawings: row?.totalDrawings ?? 0,
    totalInk: row?.totalInk ?? 0,
    uniqueCreators: row?.uniqueCreators ?? 0,
  };
}
