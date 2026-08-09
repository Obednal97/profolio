import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  clearedAuthCookieOptions,
} from "@/lib/authCookie";

/**
 * Response helpers for the two moments a route touches the session cookie.
 *
 * Kept in one place because the previous per-route inlining drifted: the
 * firebase-exchange route set a 30-day cookie holding a 24-hour token and
 * derived `secure` from NODE_ENV, so a self-hosted install over plain HTTP
 * dropped the cookie entirely and a Vercel one appeared signed in for 29 days
 * after the token had expired.
 */

/** JSON response that also issues the session cookie. */
export function jsonWithSession<T>(
  request: NextRequest,
  body: T,
  token: string,
): NextResponse {
  const response = NextResponse.json(body);
  response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions(request));
  return response;
}

/** JSON response that clears the session cookie. */
export function jsonClearingSession<T>(
  request: NextRequest,
  body: T,
): NextResponse {
  const response = NextResponse.json(body);
  response.cookies.set(AUTH_COOKIE_NAME, "", clearedAuthCookieOptions(request));
  return response;
}
