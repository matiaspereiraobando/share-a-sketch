import { fail, getAnonId, ok } from "@/lib/api";
import { anonHasSubmitted, pickRandomDrawing } from "@/lib/drawings";
import type { DrawingDTO } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RandomResponse = {
  drawing: DrawingDTO | null;
};

export async function GET(request: Request) {
  const anonId = getAnonId(request);
  if (!anonId) {
    return fail(400, "Missing or invalid anon id", "missing_anon_id");
  }

  const hasSubmitted = await anonHasSubmitted(anonId);
  if (!hasSubmitted) {
    return fail(
      403,
      "Share a sketch first to start viewing others.",
      "must_share_first",
    );
  }

  const url = new URL(request.url);
  const excludeId = url.searchParams.get("excludeId");

  const drawing = await pickRandomDrawing(excludeId);
  const response: RandomResponse = { drawing };
  return ok(response);
}
