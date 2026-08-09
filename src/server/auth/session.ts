import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/server/db";
import { Forbidden, Unauthorized } from "@/server/http/errors";
import { demoModeAllowed } from "@/server/demo";
import { AUTH_COOKIE_NAME } from "@/lib/authCookie";

/**
 * Session resolution. This replaces JwtAuthGuard + RoleGuard.
 *
 * The critical difference from the NestJS version is WHERE it is called.
 * Guards were declarative and attached to a controller, so the framework
 * applied them. Here the check is an ordinary function call inside each
 * service, which means a forgotten call is an unauthenticated endpoint with no
 * compiler error. That is exactly how the portfolio-history IDOR happened, so
 * services take a caller and assert ownership rather than trusting an id from
 * the request.
 *
 * Authorisation deliberately does NOT live in proxy.ts: Next's own guidance is
 * that proxy may be CDN-deployed and cannot be relied on for authz, and a
 * page-level check does not protect a Server Action defined in that page.
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isDemo: boolean;
}

const DEMO_USER: SessionUser = {
  id: "demo-user-id",
  email: "demo@profolio.com",
  name: "Demo User",
  role: "USER",
  isDemo: true,
};

/**
 * Recognises the demo bearer token, preserving the original format rules:
 * `Bearer demo-token-secure-<digits>`.
 */
function isDemoToken(token: string): boolean {
  if (!demoModeAllowed()) return false;
  return /^demo-token-secure-\d+$/.test(token);
}

interface JwtPayload {
  sub?: string;
  id?: string;
  email?: string;
}

/**
 * The current user, or null when unauthenticated.
 *
 * Wrapped in React's `cache` so multiple calls within one request share a
 * single JWT verification and user lookup - the NestJS passport strategy did a
 * database read on every authenticated request, and without memoisation each
 * service call in a request would repeat it.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  for (const token of await candidateTokens()) {
    const user = await resolve(token);
    if (user) return user;
  }

  return null;
});

/**
 * Every credential the request offers, in order of preference.
 *
 * Both are tried, rather than the header winning outright. The token lives in
 * an httpOnly cookie that JavaScript cannot read, so a page that attaches its
 * own header after a reload sends `Bearer null` - and a header-only reader
 * turned a request carrying a perfectly good cookie into a 401. That is
 * exactly what happened to the asset manager on the first deployment.
 */
async function candidateTokens(): Promise<string[]> {
  const tokens: string[] = [];

  const authorization = (await headers()).get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const value = authorization.slice(7).trim();
    // "null" and "undefined" are what a template literal makes of a missing
    // token. They are not credentials.
    if (value && value !== "null" && value !== "undefined") tokens.push(value);
  }

  const cookie = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (cookie && !tokens.includes(cookie)) tokens.push(cookie);

  return tokens;
}

/** Turns one token into a user, or null if it does not identify anyone. */
async function resolve(token: string): Promise<SessionUser | null> {
  if (isDemoToken(token)) return DEMO_USER;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail closed. A missing secret must never degrade to accepting tokens,
    // which is precisely what the old `JWT_SECRET || 'fallback-secret'` did.
    console.error("JWT_SECRET is not configured; rejecting all sessions");
    return null;
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }

  const userId = payload.sub || payload.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return null;

  return { ...user, isDemo: false };
}

/** The current user, or a 401. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new Unauthorized();
  return user;
}

/** The current user, or a 403 unless they are an administrator. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Forbidden("Administrator access required");
  }
  return user;
}

/**
 * Demo sessions must not write. The demo user id does not exist in the
 * database, so a write would fail on a foreign key anyway - this turns that
 * into a clear 403 instead of a 500.
 */
export function assertNotDemo(user: SessionUser): void {
  if (user.isDemo) {
    throw new Forbidden("Demo mode is read-only");
  }
}
