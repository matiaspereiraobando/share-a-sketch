import { fail, ok } from "@/lib/api";
import { getDrawingById } from "@/lib/drawings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return fail(400, "Invalid id", "invalid_id");
  }

  const drawing = await getDrawingById(id);
  if (!drawing) {
    return fail(404, "Drawing not found", "not_found");
  }
  return ok({ drawing });
}
