import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    // Get authorization from header or httpOnly cookie
    let authHeader = request.headers.get("authorization");

    // If no auth header, try to get token from httpOnly cookie
    if (!authHeader) {
      const authToken = request.cookies.get("auth-token")?.value;
      if (authToken) {
        authHeader = `Bearer ${authToken}`;
      }
    }

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization required - no token found" },
        { status: 401 }
      );
    }

    // Forward the request to the backend
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/notifications/unread-count`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await backendResponse.json();

    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ [Proxy] Notifications unread-count proxy error:", error);

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
