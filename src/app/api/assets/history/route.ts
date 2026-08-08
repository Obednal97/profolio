import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization required - no token found" },
        { status: 401 }
      );
    }

    // Extract days from request body and convert to query parameter
    const days = body.days;
    const queryParam = days ? `?days=${days}` : "";

    // Forward the request to the backend (GET request with query parameter)
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/assets/history${queryParam}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    // Get the response data
    const data = await backendResponse.json();

    // Transform response to match frontend expectations
    let transformedData;
    if (backendResponse.ok) {
      // Backend returns history data, wrap it in expected format
      if (Array.isArray(data)) {
        transformedData = { history: data, error: null };
      } else if (data && typeof data === "object" && data.history) {
        // Already wrapped
        transformedData = data;
      } else {
        // Assume data is the history array
        transformedData = { history: data, error: null };
      }
    } else {
      // Error response
      transformedData = {
        success: false,
        error: data.message || data.error || "Backend error",
        ...data,
      };
    }

    return NextResponse.json(transformedData, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ [Proxy] Assets history proxy error:", error);

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
