import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { drawings, votes } from "@/lib/db/schema";
import { fail, getAnonId, ok } from "@/lib/api";
import { validateVote } from "@/lib/validation";
import { FLAG_THRESHOLD } from "@/lib/constants";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type VoteResponse = {
  thumbsUp: number;
  flagCount: number;
  hidden: boolean;
  alreadyVoted: boolean;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return fail(400, "Invalid id", "invalid_id");
  }

  const anonId = getAnonId(request);
  if (!anonId) {
    return fail(400, "Missing or invalid anon id", "missing_anon_id");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Invalid JSON");
  }

  const v = validateVote(body);
  if (!v.ok) {
    return fail(400, v.error, "invalid_payload");
  }

  const existing = await db
    .select({ id: drawings.id, thumbsUp: drawings.thumbsUp, flagCount: drawings.flagCount, status: drawings.status })
    .from(drawings)
    .where(eq(drawings.id, id))
    .limit(1);

  if (existing.length === 0) {
    return fail(404, "Drawing not found", "not_found");
  }

  const insertResult = await db
    .insert(votes)
    .values({
      drawingId: id,
      anonId,
      type: v.value.type,
    })
    .onConflictDoNothing({
      target: [votes.drawingId, votes.anonId],
    })
    .returning({ id: votes.id });

  const alreadyVoted = insertResult.length === 0;

  if (alreadyVoted) {
    const row = existing[0];
    const response: VoteResponse = {
      thumbsUp: row.thumbsUp,
      flagCount: row.flagCount,
      hidden: row.status === "hidden",
      alreadyVoted: true,
    };
    return ok(response);
  }

  const updateField =
    v.value.type === "thumb"
      ? { thumbsUp: sql`${drawings.thumbsUp} + 1` }
      : { flagCount: sql`${drawings.flagCount} + 1` };

  const [updated] = await db
    .update(drawings)
    .set(updateField)
    .where(eq(drawings.id, id))
    .returning({
      thumbsUp: drawings.thumbsUp,
      flagCount: drawings.flagCount,
      status: drawings.status,
    });

  let hidden = updated.status === "hidden";
  if (
    !hidden &&
    v.value.type === "flag" &&
    updated.flagCount >= FLAG_THRESHOLD
  ) {
    await db
      .update(drawings)
      .set({ status: "hidden" })
      .where(and(eq(drawings.id, id), eq(drawings.status, "active")));
    hidden = true;
  }

  const response: VoteResponse = {
    thumbsUp: updated.thumbsUp,
    flagCount: updated.flagCount,
    hidden,
    alreadyVoted: false,
  };
  return ok(response);
}
