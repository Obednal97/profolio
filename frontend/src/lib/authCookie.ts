import type { NextRequest } from "next/server";

/**
 * The single source of truth for the auth cookie.
 *
 * Two bugs made this worth centralising:
 *  - the sign-in routes set a cookie named `token` while ~29 proxy routes read
 *    `auth-token`, so a successful login produced a cookie nobody looked at;
 *  - `secure` was hardcoded to `NODE_ENV === "production"`, and browsers reject
 *    Secure cookies over plain HTTP. A self-hosted deployment reached over
 *    http://<lan-ip>:3000 could therefore never hold a session.
 */
export const AUTH_COOKIE_NAME = "auth-token";

/** 24 hours, matching the backend's JWT lifetime. */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24;

/**
 * Whether the browser reached us over HTTPS.
 *
 * Derived from the request rather than NODE_ENV, because a production build is
 * routinely served over plain HTTP on a home network. Honours x-forwarded-proto
 * so the flag is still set correctly behind a TLS-terminating reverse proxy.
 * AUTH_COOKIE_SECURE=true forces it on for deployments where neither signal is
 * trustworthy.
 */
export function isSecureRequest(req: NextRequest): boolean {
  if (process.env.AUTH_COOKIE_SECURE === "true") return true;

  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim() === "https";
  }

  return req.nextUrl.protocol === "https:";
}

/** Cookie options for issuing the auth token. */
export function authCookieOptions(req: NextRequest) {
  return {
    httpOnly: true,
    // Set only when the connection genuinely is HTTPS; otherwise the browser
    // silently drops the cookie and the user can never stay signed in.
    secure: isSecureRequest(req),
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

/** Cookie options for clearing the auth token on sign-out. */
export function clearedAuthCookieOptions(req: NextRequest) {
  return { ...authCookieOptions(req), maxAge: 0 };
}
