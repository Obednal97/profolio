import { NextRequest, NextResponse } from "next/server";
import { mockApi } from "@/lib/mockApi";
import { generateDemoAssets } from "@/lib/demoData";

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

    // Check if this is a demo mode request
    const isDemoMode = authHeader?.includes("demo-token") || 
                       request.cookies.get("demo-mode")?.value === "true";

    // Safety check for request body
    let body;
    try {
      const rawBody = await request.text();
      if (rawBody.trim()) {
        body = JSON.parse(rawBody);
      } else {
        // Empty body - return error
        return NextResponse.json(
          {
            success: false,
            error: "Request body is required for POST requests",
          },
          { status: 400 }
        );
      }
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details:
            parseError instanceof Error
              ? parseError.message
              : "JSON parse failed",
        },
        { status: 400 }
      );
    }

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization required - no token found" },
        { status: 401 }
      );
    }

    // Handle demo mode
    if (isDemoMode) {
      // For demo mode POST, we just return success since we don't persist
      const newAsset = {
        ...body,
        id: `demo-asset-${Date.now()}`,
        userId: "demo-user-id"
      };
      return NextResponse.json({ asset: newAsset, error: null });
    }

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/assets`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Get the response data
    const data = await backendResponse.json();

    // Transform response to match frontend expectations
    let transformedData;
    if (backendResponse.ok) {
      if (Array.isArray(data)) {
        // Backend returned array directly, wrap it
        transformedData = { assets: data, error: null };
      } else if (data && typeof data === "object") {
        // Backend returned single object, wrap it
        transformedData = { asset: data, error: null };
      } else {
        transformedData = data;
      }
    } else {
      // Error response, keep as-is but ensure error format
      transformedData = {
        success: false,
        error: data.message || data.error || "Backend error",
        ...data,
      };
    }

    // Forward the response with the same status
    return NextResponse.json(transformedData, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ [Proxy] Assets POST proxy error:", error);

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

    // Check if this is a demo mode request
    const isDemoMode = authHeader?.includes("demo-token") || 
                       request.cookies.get("demo-mode")?.value === "true";

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization required - no token found" },
        { status: 401 }
      );
    }

    // Handle demo mode
    if (isDemoMode) {
      // Generate demo assets directly since localStorage isn't available on server
      const assets = generateDemoAssets();
      return NextResponse.json({ assets, error: null });
    }

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/assets`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    // Get the response data
    const data = await backendResponse.json();

    // Transform response to match frontend expectations
    let transformedData;
    if (backendResponse.ok) {
      if (Array.isArray(data)) {
        // Backend returned array directly, wrap it
        transformedData = { assets: data, error: null };
      } else {
        transformedData = data;
      }
    } else {
      // Error response
      transformedData = {
        success: false,
        error: data.message || data.error || "Backend error",
        ...data,
      };
    }

    // Forward the response with the same status
    return NextResponse.json(transformedData, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ [Proxy] Assets GET proxy error:", error);

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

export async function PUT(request: NextRequest) {
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

    // Check if this is a demo mode request
    const isDemoMode = authHeader?.includes("demo-token") || 
                       request.cookies.get("demo-mode")?.value === "true";

    // Get the asset ID from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const assetId = pathParts[pathParts.length - 1];

    // Parse request body
    const body = await request.json();

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization required - no token found" },
        { status: 401 }
      );
    }

    // Handle demo mode
    if (isDemoMode) {
      // For demo mode PUT, we just return the updated asset
      const updatedAsset = {
        ...body,
        id: assetId || body.id,
        userId: "demo-user-id"
      };
      return NextResponse.json({ asset: updatedAsset, error: null });
    }

    // Forward the request to the backend
    const backendUrl = assetId ? `${BACKEND_URL}/api/assets/${assetId}` : `${BACKEND_URL}/api/assets`;
    const backendResponse = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("❌ [Proxy] Assets PUT proxy error:", error);
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

export async function DELETE(request: NextRequest) {
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

    // Check if this is a demo mode request
    const isDemoMode = authHeader?.includes("demo-token") || 
                       request.cookies.get("demo-mode")?.value === "true";

    // Parse request body for the ID
    const body = await request.json();
    const assetId = body.id;

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization required - no token found" },
        { status: 401 }
      );
    }

    if (!assetId) {
      return NextResponse.json(
        { success: false, error: "Asset ID is required" },
        { status: 400 }
      );
    }

    // Handle demo mode
    if (isDemoMode) {
      // For demo mode DELETE, just return success
      return NextResponse.json({ success: true, error: null });
    }

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/assets/${assetId}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("❌ [Proxy] Assets DELETE proxy error:", error);
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