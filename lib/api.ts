import { NextResponse } from "next/server";

export const ANON_ID_HEADER = "x-anon-id";

export type ApiError = {
  error: string;
  code?: string;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(
  status: number,
  message: string,
  code?: string,
): NextResponse<ApiError> {
  return NextResponse.json({ error: message, ...(code && { code }) }, {
    status,
  });
}

/**
 * Anonymous-ID format: 16+ chars, alphanumeric (and hyphens/underscores).
 * Generated client-side via crypto.randomUUID().
 */
const ANON_ID_RE = /^[A-Za-z0-9_-]{16,64}$/;

export function getAnonId(request: Request): string | null {
  const raw = request.headers.get(ANON_ID_HEADER);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!ANON_ID_RE.test(trimmed)) return null;
  return trimmed;
}

export function requireAnonId(request: Request) {
  const id = getAnonId(request);
  if (!id) return null;
  return id;
}
