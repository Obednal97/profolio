import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authCookie";

// Auto-detect backend URL with proper protocol
const getBackendUrl = () => {
  // Use environment variable if available (should be set in production)
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  // Development fallback
  return "http://localhost:3001";
};

const BACKEND_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    // Accept either an explicit Authorization header or the httpOnly auth
    // cookie, matching every other proxy route. This route previously required
    // the header, so it rejected cookie-authenticated callers - including the
    // session check that runs on page load.
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

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    // Get the response data
    const data = await backendResponse.json();

    // Forward the response with the same status
    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ [Proxy] Profile GET proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Proxy error - unable to reach backend service",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Header or httpOnly cookie, as with GET above.
    let authHeader = request.headers.get("authorization");
    if (!authHeader) {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (token) authHeader = `Bearer ${token}`;
    }
    const body = await request.json();

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization required" },
        { status: 401 }
      );
    }

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Get the response data
    const data = await backendResponse.json();

    // Forward the response with the same status
    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ [Proxy] Profile PATCH proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Proxy error - unable to reach backend service",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
