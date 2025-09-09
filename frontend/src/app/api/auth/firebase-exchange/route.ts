import { NextRequest, NextResponse } from "next/server";

// Auto-detect backend URL with proper protocol
const getBackendUrl = () => {
  // Use environment variable if available
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  // Development fallback - for API routes, we can't access window
  // so we'll assume HTTP for localhost development
  return "http://localhost:3001";
};

const BACKEND_URL = getBackendUrl();

// SECURITY: Input validation for Firebase token
const validateFirebaseToken = (token: unknown): string | null => {
  if (!token || typeof token !== "string") {
    return null;
  }

  // Basic Firebase JWT format validation (three parts separated by dots)
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    return null;
  }

  // Validate token length (Firebase tokens are typically 1000-2000 characters)
  if (token.length < 100 || token.length > 5000) {
    return null;
  }

  // SECURITY: Sanitize token to prevent injection
  const sanitizedToken = token.replace(/[^a-zA-Z0-9\-_.]/g, "");
  if (sanitizedToken !== token) {
    return null; // Token contains invalid characters
  }

  return token;
};

// SECURITY: Get client IP for advanced rate limiting
const getClientIP = (request: NextRequest): string => {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-host") ||
    "unknown"
  );
};

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {

    // SECURITY: Parse and validate request body
    const body = await request.json();

    // SECURITY: Validate required fields
    const firebaseToken = validateFirebaseToken(body.firebaseToken);
    if (!firebaseToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing Firebase token",
        },
        { status: 400 }
      );
    }

    // SECURITY: Create clean request body with only validated data
    const cleanBody = {
      firebaseToken: firebaseToken,
    };

    // SECURITY: Forward to backend with sophisticated rate limiting
    // Backend uses advanced rate limiting with:
    // - 10 attempts per minute with progressive exponential backoff
    // - Bot detection with user agent analysis
    // - CAPTCHA integration at 80% threshold  
    // - Redis-based distributed rate limiting
    // - Audit logging and monitoring
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/auth/firebase-exchange`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // SECURITY: Forward client information for advanced rate limiting and bot detection
          "X-Client-IP": clientIP,
          "X-Forwarded-For": request.headers.get("x-forwarded-for") || clientIP,
          "X-Real-IP": request.headers.get("x-real-ip") || clientIP,
          "User-Agent": request.headers.get("user-agent") || "unknown",
          // SECURITY: Forward original request headers for bot detection analysis
          "X-Original-Host": request.headers.get("host") || "unknown",
        },
        body: JSON.stringify(cleanBody),
        // SECURITY: Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    // Get the response data
    const data = await backendResponse.json();

    // SECURITY: Validate backend response structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format from backend");
    }

    // SECURITY: Create response with security headers
    const response = NextResponse.json(data, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
        // SECURITY: Add security headers
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });

    // SECURITY: Set httpOnly cookie if backend provided a token
    if (data.success && data.token) {
      response.cookies.set("auth-token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    return response;
  } catch (error) {
    // SECURITY: Enhanced error logging without exposing sensitive information
    console.error("❌ [Proxy] Firebase token exchange error:", {
      clientIP,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.name : "Unknown error",
      // Don't log the actual error message to prevent sensitive info disclosure
    });

    // SECURITY: Generic error response to prevent information disclosure
    return NextResponse.json(
      {
        success: false,
        error: "Authentication service temporarily unavailable",
      },
      {
        status: 503, // Service Unavailable
        headers: {
          "Content-Type": "application/json",
          // SECURITY: Add security headers even for error responses
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
        },
      }
    );
  }
}
