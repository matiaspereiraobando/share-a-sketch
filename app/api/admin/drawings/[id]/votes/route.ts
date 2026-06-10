import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getVotesForDrawing } from "@/lib/adminDrawings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauth = await requireAdmin(request);
  if (unauth) return unauth;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "Invalid id", code: "invalid_id" },
      { status: 400 },
    );
  }

  const votes = await getVotesForDrawing(id);
  return NextResponse.json({ votes });
}
