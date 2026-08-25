import { createHmac, timingSafeEqual, createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "sunvolt_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface SessionPayload {
  sub: string;
  exp: number;
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short — set it in .env");
  }
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", sessionSecret()).update(data).digest("base64url");
}

export function createSessionToken(email: string): string {
  const payload: SessionPayload = { sub: email, exp: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Read the admin session from cookies; null when not signed in. */
export async function getAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Use inside admin pages/actions — redirects to login when unauthorized. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** Constant-time credential check against the env-configured admin. */
export function verifyCredentials(email: string, password: string): boolean {
  const envEmail = process.env.ADMIN_EMAIL ?? "";
  const envPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!envEmail || !envPassword) return false;
  return (
    safeEqual(email.trim().toLowerCase(), envEmail.trim().toLowerCase()) &&
    safeEqual(password, envPassword)
  );
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Very small in-memory login throttle: max 5 failed attempts per
 * identifier within 10 minutes (plan §37 — rate limiting where appropriate).
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export function isThrottled(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (entry.resetAt < Date.now()) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < Date.now()) {
    attempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
