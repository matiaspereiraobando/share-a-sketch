import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDrawingById, setDrawingStatus } from "@/lib/adminDrawings";
import type { DrawingStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const VALID_STATUSES: ReadonlySet<DrawingStatus> = new Set([
  "active",
  "hidden",
]);

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

  const drawing = await getAdminDrawingById(id);
  if (!drawing) {
    return NextResponse.json(
      { error: "Drawing not found", code: "not_found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ drawing });
}

export async function PATCH(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = (body as { status?: unknown } | null)?.status;
  if (typeof status !== "string" || !VALID_STATUSES.has(status as DrawingStatus)) {
    return NextResponse.json(
      {
        error: "status must be 'active' or 'hidden'",
        code: "invalid_payload",
      },
      { status: 400 },
    );
  }

  const drawing = await setDrawingStatus(id, status as DrawingStatus);
  if (!drawing) {
    return NextResponse.json(
      { error: "Drawing not found", code: "not_found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ drawing });
}
