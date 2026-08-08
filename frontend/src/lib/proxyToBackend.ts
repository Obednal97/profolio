import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authCookie";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Forwards a request to the backend, attaching the caller's credentials.
 *
 * Browser code must never address the backend directly: in any deployment the
 * API is not reachable from the browser at the URL the server knows it by, and
 * the auth token lives in an httpOnly cookie the client cannot read. Routing
 * through here keeps both concerns server-side.
 *
 * Streaming responses (Server-Sent Events) are passed through unbuffered so
 * progress endpoints keep working.
 */
export async function proxyToBackend(
  request: NextRequest,
  backendPath: string
): Promise<NextResponse | Response> {
  let authHeader = request.headers.get("authorization");
  if (!authHeader) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (token) authHeader = `Bearer ${token}`;
  }

  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: "Authorization required" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const target = `${BACKEND_URL}${backendPath}${url.search}`;

  const headers: Record<string, string> = {
    Authorization: authHeader,
  };

  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const accept = request.headers.get("accept");
  if (accept) headers["Accept"] = accept;

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const raw = await request.text();
    if (raw) body = raw;
  }

  try {
    const backendResponse = await fetch(target, {
      method: request.method,
      headers,
      body,
      // Do not buffer: an SSE endpoint must stream.
      cache: "no-store",
    });

    // Pass streams straight through rather than awaiting the whole body.
    if (
      backendResponse.headers.get("content-type")?.includes("text/event-stream")
    ) {
      return new Response(backendResponse.body, {
        status: backendResponse.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const text = await backendResponse.text();
    const data = text ? JSON.parse(text) : null;
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`Proxy to ${backendPath} failed:`, error);
    return NextResponse.json(
      { success: false, error: "Backend unavailable" },
      { status: 502 }
    );
  }
}
