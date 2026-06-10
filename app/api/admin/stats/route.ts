import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminStats } from "@/lib/adminStats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauth = await requireAdmin(request);
  if (unauth) return unauth;
  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
