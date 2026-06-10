/**
 * Admin authentication helpers. Single-password login, signed httpOnly
 * session cookie. Uses Web Crypto so the same module is safe in both Node
 * route handlers and the Edge middleware.
 */
import { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "sas-admin-session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const FAILED_LOGIN_LIMIT = 5;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;

type SessionPayload = { exp: number };

function getSecretBytes(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set or is too short (need 16+ chars).",
    );
  }
  return new TextEncoder().encode(secret);
}

async function hmacSha256(message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    getSecretBytes() as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message) as BufferSource,
  );
  return new Uint8Array(sig);
}

function base64urlEncodeBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlEncodeString(input: string): string {
  return base64urlEncodeBytes(new TextEncoder().encode(input));
}

function base64urlDecodeBytes(input: string): Uint8Array | null {
  try {
    const padded = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const bin = atob(padded + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = base64urlEncodeString(JSON.stringify({ exp }));
  const sig = await hmacSha256(payload);
  return `${payload}.${base64urlEncodeBytes(sig)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);

  const expected = await hmacSha256(payload);
  const actual = base64urlDecodeBytes(sigPart);
  if (!actual) return null;
  if (!constantTimeEqual(expected, actual)) return null;

  const decoded = base64urlDecodeBytes(payload);
  if (!decoded) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(decoded));
    if (
      !data ||
      typeof data !== "object" ||
      typeof (data as { exp: unknown }).exp !== "number"
    ) {
      return null;
    }
    const exp = (data as { exp: number }).exp;
    if (exp < Date.now()) return null;
    return { exp };
  } catch {
    return null;
  }
}

/**
 * Constant-time password check. Both sides are SHA-256 hashed first so
 * comparison is over fixed-length buffers regardless of input length.
 */
export async function verifyPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const hashA = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(input) as BufferSource,
    ),
  );
  const hashB = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(expected) as BufferSource,
    ),
  );
  return constantTimeEqual(hashA, hashB);
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim() || "unknown";
  return "unknown";
}

const failedAttempts = new Map<string, { count: number; firstAt: number }>();

export function checkLoginRateLimit(ip: string): {
  ok: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry) return { ok: true };
  if (now - entry.firstAt > FAILED_LOGIN_WINDOW_MS) {
    failedAttempts.delete(ip);
    return { ok: true };
  }
  if (entry.count >= FAILED_LOGIN_LIMIT) {
    return {
      ok: false,
      retryAfterSec: Math.ceil(
        (FAILED_LOGIN_WINDOW_MS - (now - entry.firstAt)) / 1000,
      ),
    };
  }
  return { ok: true };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || now - entry.firstAt > FAILED_LOGIN_WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
}

export function clearFailedLogins(ip: string): void {
  failedAttempts.delete(ip);
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    if (k === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}

/**
 * Defense-in-depth check used inside admin API handlers. The middleware
 * already gates these routes, but verifying again ensures handlers cannot
 * be reached if the matcher is ever misconfigured.
 */
export async function requireAdmin(
  request: Request,
): Promise<NextResponse | null> {
  const token = readCookie(request.headers.get("cookie"), ADMIN_COOKIE_NAME);
  const session = await verifySessionToken(token);
  if (session) return null;
  return NextResponse.json(
    { error: "Unauthorized", code: "unauthorized" },
    { status: 401 },
  );
}
