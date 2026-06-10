import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { drawings, votes } from "@/lib/db/schema";
import type { AdminStatsDTO } from "@/lib/types";

/**
 * Extended, admin-only stats. Counts span the entire pool (active and
 * hidden) so the dashboard reflects what an operator can actually see and
 * moderate, not just what is publicly visible.
 */
export async function getAdminStats(): Promise<AdminStatsDTO> {
  const [drawingsRow] = await db
    .select({
      totalDrawings: sql<number>`count(*)::int`,
      activeDrawings: sql<number>`count(*) filter (where ${drawings.status} = 'active')::int`,
      hiddenDrawings: sql<number>`count(*) filter (where ${drawings.status} = 'hidden')::int`,
      totalInk: sql<number>`coalesce(sum(${drawings.pointCount}), 0)::int`,
      uniqueCreators: sql<number>`count(distinct ${drawings.creatorAnonId})::int`,
      totalThumbs: sql<number>`coalesce(sum(${drawings.thumbsUp}), 0)::int`,
      totalFlags: sql<number>`coalesce(sum(${drawings.flagCount}), 0)::int`,
    })
    .from(drawings);

  const [votesRow] = await db
    .select({ totalVotes: sql<number>`count(*)::int` })
    .from(votes);

  const dailyRows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${drawings.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(drawings)
    .where(sql`${drawings.createdAt} >= now() - interval '7 days'`)
    .groupBy(sql`date_trunc('day', ${drawings.createdAt})`)
    .orderBy(sql`date_trunc('day', ${drawings.createdAt})`);

  const submissionsLast7Days = fillMissingDays(
    dailyRows.map((r) => ({ date: r.date, count: r.count })),
    7,
  );

  return {
    totalDrawings: drawingsRow?.totalDrawings ?? 0,
    activeDrawings: drawingsRow?.activeDrawings ?? 0,
    hiddenDrawings: drawingsRow?.hiddenDrawings ?? 0,
    totalInk: drawingsRow?.totalInk ?? 0,
    uniqueCreators: drawingsRow?.uniqueCreators ?? 0,
    totalVotes: votesRow?.totalVotes ?? 0,
    totalThumbs: drawingsRow?.totalThumbs ?? 0,
    totalFlags: drawingsRow?.totalFlags ?? 0,
    submissionsLast7Days,
  };
}

/**
 * Pad the daily submissions series with zero-count days so the UI gets a
 * dense N-day window even when no sketches were submitted on a given day.
 */
function fillMissingDays(
  rows: { date: string; count: number }[],
  days: number,
): { date: string; count: number }[] {
  const byDate = new Map<string, number>();
  for (const r of rows) byDate.set(r.date, r.count);

  const out: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: byDate.get(key) ?? 0 });
  }
  return out;
}
