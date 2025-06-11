import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Mark this route as dynamic to prevent static generation
export const dynamic = "force-dynamic";

function getUserFromToken(request: NextRequest) {
  // Check for demo mode first
  const isDemoMode = request.headers.get("x-demo-mode") === "true";

  if (isDemoMode) {
    return {
      id: "demo-user-id",
      name: "Demo User",
      email: "demo@profolio.com",
      isDemo: true,
    };
  }

  // For real users, would validate JWT token here
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // In production, validate the real JWT token
    return {
      id: "real-user-id",
      isDemo: false,
    };
  }

  return null; // No valid authentication
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const symbol = resolvedParams.symbol?.toUpperCase();

    if (!symbol) {
      return NextResponse.json(
        {
          error: "Symbol parameter is required",
          price: null,
        },
        { status: 400 }
      );
    }

    // Determine API base URL
    const apiBaseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_API_URL ||
          `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api`
        : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    const backendUrl = `${apiBaseUrl}/market-data/cached-price/${encodeURIComponent(
      symbol
    )}`;

    // Use demo token for demo users, real token for real users
    const authToken = user.isDemo
      ? "demo-token-secure-123"
      : request.headers.get("authorization")?.slice(7) ||
        request.cookies.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json(
        {
          symbol: symbol,
          price: null,
          error: "No authentication token available",
        },
        { status: 401 }
      );
    }

    logger.cache(
      `Getting cached price for: ${symbol} (${
        user.isDemo ? "demo" : "real"
      } user)`
    );

    const response = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "X-Demo-Mode": user.isDemo ? "true" : "false",
      },
    });

    if (!response.ok) {
      logger.error(`Backend error: ${response.status} ${response.statusText}`);

      return NextResponse.json({
        symbol: symbol,
        price: null,
        message: "Cached price not available",
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error fetching cached price:", error);

    const resolvedParams = await params;
    return NextResponse.json({
      symbol: resolvedParams.symbol?.toUpperCase() || "UNKNOWN",
      price: null,
      error: "Failed to fetch cached price",
    });
  }
}
