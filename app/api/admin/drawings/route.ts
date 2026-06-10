import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  listDrawings,
  type AdminListSort,
  type AdminListStatus,
} from "@/lib/adminDrawings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUS = new Set<AdminListStatus>(["all", "active", "hidden"]);
const VALID_SORT = new Set<AdminListSort>([
  "created_desc",
  "flags_desc",
  "thumbs_desc",
]);

export async function GET(request: Request) {
  const unauth = await requireAdmin(request);
  if (unauth) return unauth;

  const url = new URL(request.url);
  const statusRaw = url.searchParams.get("status") ?? "all";
  const sortRaw = url.searchParams.get("sort") ?? "created_desc";
  const status = (VALID_STATUS.has(statusRaw as AdminListStatus)
    ? statusRaw
    : "all") as AdminListStatus;
  const sort = (VALID_SORT.has(sortRaw as AdminListSort)
    ? sortRaw
    : "created_desc") as AdminListSort;

  const q = url.searchParams.get("q");
  const page = parseIntParam(url.searchParams.get("page"), 1);
  const pageSize = parseIntParam(url.searchParams.get("pageSize"), 25);

  const result = await listDrawings({ status, q, page, pageSize, sort });
  return NextResponse.json(result);
}

function parseIntParam(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}
