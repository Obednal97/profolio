import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  clearedAuthCookieOptions,
} from "@/lib/authCookie";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Clears the auth session.
 *
 * The auth cookie is httpOnly, so the client cannot delete it itself - this
 * route is the only way to end a session. The backend call is best-effort:
 * the cookie is cleared regardless, so a backend outage cannot leave a user
 * stuck in a session they have asked to end.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    try {
      await fetch(`${BACKEND_URL}/api/auth/signout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Backend sign-out failed, clearing cookie anyway:", error);
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_COOKIE_NAME, "", clearedAuthCookieOptions(req));
  return res;
}
