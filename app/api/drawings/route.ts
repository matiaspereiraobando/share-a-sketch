import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { drawings } from "@/lib/db/schema";
import { fail, getAnonId, ok } from "@/lib/api";
import { validateSubmitDrawing } from "@/lib/validation";
import { SUBMIT_COOLDOWN_MS } from "@/lib/constants";
import { pickRandomDrawing } from "@/lib/drawings";
import { getCurrentPrompt } from "@/lib/prompts";
import type { DrawingDTO } from "@/lib/types";

export const runtime = "nodejs";

type SubmitResponse = {
  saved: { id: string };
  next: DrawingDTO | null;
};

export async function POST(request: Request) {
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

  const result = validateSubmitDrawing(body);
  if (!result.ok) {
    return fail(400, result.error, "invalid_payload");
  }

  const recent = await db
    .select({ createdAt: drawings.createdAt })
    .from(drawings)
    .where(
      and(
        eq(drawings.creatorAnonId, anonId),
        gt(drawings.createdAt, new Date(Date.now() - SUBMIT_COOLDOWN_MS)),
      ),
    )
    .orderBy(desc(drawings.createdAt))
    .limit(1);

  if (recent.length > 0) {
    return fail(
      429,
      "Slow down a bit before sharing another sketch.",
      "rate_limited",
    );
  }

  const promptText = result.value.usedPrompt ? getCurrentPrompt() : null;

  const [inserted] = await db
    .insert(drawings)
    .values({
      paletteId: result.value.paletteId,
      authorName: result.value.authorName,
      pointCount: result.value.pointCount,
      strokes: result.value.strokes,
      creatorAnonId: anonId,
      promptText,
    })
    .returning({ id: drawings.id });

  const next = await pickRandomDrawing(inserted.id);

  const response: SubmitResponse = {
    saved: { id: inserted.id },
    next,
  };
  return ok(response);
}
