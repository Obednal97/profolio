import { NextRequest, NextResponse } from "next/server";

// Mark this route as dynamic to prevent static generation
export const dynamic = "force-dynamic";

// IMPROVEMENT: Input validation utility
const validateDaysParameter = (days: string | null): number => {
  if (!days) return 30; // Default to 30 days

  const numDays = parseInt(days, 10);

  // IMPROVEMENT: Validate range to prevent abuse
  if (isNaN(numDays) || numDays < 1 || numDays > 365) {
    return 30; // Default to 30 days for invalid input
  }

  return numDays;
};

// IMPROVEMENT: Validate authorization header format
const validateAuthHeader = (authHeader: string | null): string => {
  if (!authHeader) return "";

  // Basic validation for Bearer token format
  if (
    !authHeader.startsWith("Bearer ") &&
    !authHeader.startsWith("demo-token-")
  ) {
    return "";
  }

  // IMPROVEMENT: Sanitize header to prevent injection
  return authHeader.replace(/[^\w\s\-\.]/g, "").substring(0, 500);
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDays = searchParams.get("days");
    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    // IMPROVEMENT: Validate and sanitize inputs
    const validatedDays = validateDaysParameter(rawDays);

    // IMPROVEMENT: Validate userId parameter
    if (!userId || !/^[a-zA-Z0-9\-_]+$/.test(userId)) {
      return NextResponse.json(
        {
          status: "ERROR",
          error: "Invalid user ID format",
          data: [],
        },
        { status: 400 }
      );
    }

    // Check if user is in demo mode
    const isDemoMode =
      request.headers.get("x-demo-mode") === "true" ||
      searchParams.get("demo") === "true";

    if (isDemoMode) {
      // For demo mode, return empty array since we don't have real historical data
      return NextResponse.json({
        status: "OK",
        data: [],
        message: "Demo mode: No historical data available",
      });
    }

    // Get the backend URL from environment or default
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

    // IMPROVEMENT: Validate and sanitize authorization header
    const authHeader = validateAuthHeader(request.headers.get("authorization"));

    // Forward request to backend
    const backendResponse = await fetch(
      `${backendUrl}/api/market-data/portfolio-history/${encodeURIComponent(
        userId
      )}?days=${validatedDays}`,
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        // IMPROVEMENT: Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!backendResponse.ok) {
      // IMPROVEMENT: Log backend errors for debugging but don't expose to client
      console.error(
        `Backend portfolio history error: ${backendResponse.status} ${backendResponse.statusText}`
      );

      return NextResponse.json(
        {
          status: "ERROR",
          error: "Unable to fetch portfolio history",
          data: [],
        },
        { status: backendResponse.status === 404 ? 404 : 500 }
      );
    }

    const data = await backendResponse.json();

    // IMPROVEMENT: Validate response structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format from backend");
    }

    return NextResponse.json(data);
  } catch (error) {
    // IMPROVEMENT: Enhanced error logging without exposing sensitive information
    if (error instanceof Error) {
      console.error("Portfolio history API error:", {
        message: error.message,
        name: error.name,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error("Portfolio history API error: Unknown error type");
    }

    // IMPROVEMENT: Generic error response to prevent information disclosure
    return NextResponse.json(
      {
        status: "ERROR",
        error: "Unable to process request",
        data: [],
      },
      { status: 500 }
    );
  }
}
