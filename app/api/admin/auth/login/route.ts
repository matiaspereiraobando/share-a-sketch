import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  SESSION_TTL_MS,
  checkLoginRateLimit,
  clearFailedLogins,
  createSessionToken,
  getClientIp,
  recordFailedLogin,
  verifyPassword,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkLoginRateLimit(ip);
  if (!limit.ok) {
    const headers = new Headers();
    if (limit.retryAfterSec) {
      headers.set("Retry-After", String(limit.retryAfterSec));
    }
    return NextResponse.json(
      {
        error: "Too many failed attempts. Try again later.",
        code: "rate_limited",
      },
      { status: 429, headers },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = (body as { password?: unknown } | null)?.password;
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json(
      { error: "Password is required", code: "missing_password" },
      { status: 400 },
    );
  }

  const valid = await verifyPassword(password);
  if (!valid) {
    recordFailedLogin(ip);
    return NextResponse.json(
      { error: "Invalid password", code: "invalid_credentials" },
      { status: 401 },
    );
  }

  clearFailedLogins(ip);
  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}
