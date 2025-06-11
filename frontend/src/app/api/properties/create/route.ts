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

    // Remove userId from body as it's handled by authentication
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId, ...propertyData } = body;

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/properties`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(propertyData),
    });

    // Get the response data
    const data = await backendResponse.json();

    // Return the response
    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ [Proxy] Properties create proxy error:", error);

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
