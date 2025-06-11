import { NextRequest, NextResponse } from "next/server";
import { verify, JwtPayload } from "jsonwebtoken";

// Mark this route as dynamic to prevent static generation
export const dynamic = "force-dynamic";

interface UserJwtPayload extends JwtPayload {
  userId?: string;
  id?: string;
  email: string;
}

interface BackendApiKeyResponse {
  id: string;
  provider: string;
  user_api_key_display_name: string;
  user_api_key_environment: string;
  user_api_key_masked_value: string;
  isActive: boolean;
  testedAt?: string;
  testResult?: string;
  createdAt: string;
  expiresAt?: string;
  permissions: string[];
  rateLimitInfo?: unknown;
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// Demo token management with session-based security
const demoTokens = new Map<
  string,
  {
    expires: number;
    userId: string;
    email: string;
  }
>();

function validateDemoToken(
  token: string
): { userId: string; email: string } | null {
  const tokenData = demoTokens.get(token);
  if (!tokenData) return null;

  if (Date.now() > tokenData.expires) {
    demoTokens.delete(token);
    return null;
  }

  return {
    userId: tokenData.userId,
    email: tokenData.email,
  };
}

function getUserFromToken(
  request: NextRequest
): { userId: string; email: string; isDemo: boolean; token: string } | null {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7);

    // Secure demo token validation (session-based)
    if (token.startsWith("demo-")) {
      const demoUser = validateDemoToken(token);
      if (demoUser) {
        return {
          userId: demoUser.userId,
          email: demoUser.email,
          isDemo: true,
          token,
        };
      }
      return null;
    }

    // Verify JWT token with proper error handling
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is required");
    }

    const decoded = verify(token, process.env.JWT_SECRET) as UserJwtPayload;

    return {
      userId: decoded.userId || decoded.id || "",
      email: decoded.email,
      isDemo: false,
      token,
    };
  } catch (error) {
    // Sanitized error logging for production
    if (process.env.NODE_ENV === "development") {
      console.error("Token verification failed:", error);
    } else {
      console.error("Token verification failed: Invalid or expired token");
    }
    return null;
  }
}

// GET - Retrieve user's API keys (proxy to secure backend)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Demo users should use localStorage only
    if (user.isDemo) {
      return NextResponse.json({
        apiKeys: {},
        message: "Demo mode: API keys stored in localStorage only",
        isDemo: true,
      });
    }

    // Forward to secure backend API
    const backendResponse = await fetch(`${BACKEND_URL}/api/api-keys`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!backendResponse.ok) {
      // Handle backend errors gracefully
      if (backendResponse.status === 401) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      console.error(`Backend API error: ${backendResponse.status}`);
      return NextResponse.json(
        { error: "Failed to retrieve API keys" },
        { status: 500 }
      );
    }

    const backendData: BackendApiKeyResponse[] = await backendResponse.json();

    // Transform backend response to match frontend expectations
    // Backend returns: [{ provider: "ALPHA_VANTAGE", user_api_key_masked_value: "abc*****xyz", ... }]
    // Frontend expects: { apiKeys: { "ALPHA_VANTAGE": "abc*****xyz" } }
    const apiKeys: Record<string, string> = {};

    if (Array.isArray(backendData)) {
      backendData.forEach((keyData: BackendApiKeyResponse) => {
        if (keyData.provider && keyData.user_api_key_masked_value) {
          apiKeys[keyData.provider] = keyData.user_api_key_masked_value;
        }
      });
    }

    return NextResponse.json({ apiKeys });
  } catch (error) {
    // Sanitized error logging for production
    if (process.env.NODE_ENV === "development") {
      console.error("Error retrieving API keys:", error);
    } else {
      console.error("Error retrieving API keys: Server error");
    }
    return NextResponse.json(
      { error: "Failed to retrieve API keys" },
      { status: 500 }
    );
  }
}

// POST - Store user's API keys (proxy to secure backend)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { apiKeys } = await request.json();

    if (!apiKeys || typeof apiKeys !== "object") {
      return NextResponse.json(
        { error: "Invalid API keys format" },
        { status: 400 }
      );
    }

    // Demo users should use localStorage only - don't store on server
    if (user.isDemo) {
      return NextResponse.json({
        success: true,
        message: "Demo mode: API keys stored in localStorage only",
        providersStored: Object.keys(apiKeys),
        isDemo: true,
      });
    }

    // Transform and forward to secure backend API
    const providersStored: string[] = [];

    for (const [provider, apiKeyValue] of Object.entries(apiKeys)) {
      if (typeof apiKeyValue === "string" && apiKeyValue.trim()) {
        try {
          // Create API key via backend
          const createPayload = {
            provider: provider,
            user_api_key_raw_value: apiKeyValue.trim(),
            user_api_key_display_name: `Default ${provider} Key`,
            user_api_key_environment: "production",
          };

          const backendResponse = await fetch(`${BACKEND_URL}/api/api-keys`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${user.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(createPayload),
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          if (backendResponse.ok) {
            providersStored.push(provider);
          } else if (backendResponse.status === 400) {
            // Check if it's a duplicate error
            const errorData = await backendResponse.json();
            if (errorData.message?.includes("already exists")) {
              // Update existing key instead
              const existingKeys = await fetch(
                `${BACKEND_URL}/api/api-keys/provider/${provider}`,
                {
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (existingKeys.ok) {
                const keys: BackendApiKeyResponse[] = await existingKeys.json();
                if (keys.length > 0) {
                  // Update the first existing key
                  const updateResponse = await fetch(
                    `${BACKEND_URL}/api/api-keys/${keys[0].id}`,
                    {
                      method: "PATCH",
                      headers: {
                        Authorization: `Bearer ${user.token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        user_api_key_display_name: `Updated ${provider} Key`,
                      }),
                    }
                  );

                  if (updateResponse.ok) {
                    providersStored.push(provider);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Failed to store ${provider} API key:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "API keys stored securely in database",
      providersStored,
    });
  } catch (error) {
    // Sanitized error logging for production
    if (process.env.NODE_ENV === "development") {
      console.error("Error storing API keys:", error);
    } else {
      console.error("Error storing API keys: Server error");
    }
    return NextResponse.json(
      { error: "Failed to store API keys" },
      { status: 500 }
    );
  }
}

// DELETE - Remove specific API key (proxy to secure backend)
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      return NextResponse.json(
        { error: "Provider parameter required" },
        { status: 400 }
      );
    }

    // Demo users should use localStorage only
    if (user.isDemo) {
      return NextResponse.json({
        success: true,
        message: `Demo mode: ${provider} API key removed from localStorage only`,
        isDemo: true,
      });
    }

    // Find and delete API keys for this provider
    try {
      const existingKeys = await fetch(
        `${BACKEND_URL}/api/api-keys/provider/${provider}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (existingKeys.ok) {
        const keys: BackendApiKeyResponse[] = await existingKeys.json();

        // Delete all keys for this provider
        for (const key of keys) {
          await fetch(`${BACKEND_URL}/api/api-keys/${key.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.token}`,
              "Content-Type": "application/json",
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `${provider} API key removed from database`,
      });
    } catch (error) {
      console.error(`Error deleting ${provider} API key:`, error);
      return NextResponse.json(
        { error: "Failed to remove API key" },
        { status: 500 }
      );
    }
  } catch (error) {
    // Sanitized error logging for production
    if (process.env.NODE_ENV === "development") {
      console.error("Error removing API key:", error);
    } else {
      console.error("Error removing API key: Server error");
    }
    return NextResponse.json(
      { error: "Failed to remove API key" },
      { status: 500 }
    );
  }
}
