import { NextRequest, NextResponse } from "next/server";
import { mockApi } from "@/lib/mockApi";
import { generateDemoExpenses } from "@/lib/demoData";

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

    const body = await request.json();

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization required - no token found" },
        { status: 401 }
      );
    }

    // Handle demo mode
    if (isDemoMode) {
      // For demo mode POST, we just return success since we don't persist
      const newExpense = {
        ...body,
        id: `demo-expense-${Date.now()}`,
        userId: "demo-user-id"
      };
      return NextResponse.json({ expense: newExpense, error: null });
    }

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/expenses`, {
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
        transformedData = { expenses: data, error: null };
      } else if (data && typeof data === "object") {
        // Backend returned single object, wrap it
        transformedData = { expense: data, error: null };
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
    console.error("❌ [Proxy] Expenses POST proxy error:", error);

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
      // Generate demo expenses directly since localStorage isn't available on server
      let expenses = generateDemoExpenses();
      
      // Check for days parameter in query string
      const url = new URL(request.url);
      const days = url.searchParams.get('days');
      if (days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        expenses = expenses.filter(
          expense => new Date(expense.date) >= cutoffDate
        );
      }
      
      return NextResponse.json({ expenses, error: null });
    }

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/expenses`, {
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
        transformedData = { expenses: data, error: null };
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
    console.error("❌ [Proxy] Expenses GET proxy error:", error);

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

    // Get the expense ID from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const expenseId = pathParts[pathParts.length - 1];

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
      // For demo mode PUT, we just return the updated expense
      const updatedExpense = {
        ...body,
        id: expenseId || body.id,
        userId: "demo-user-id"
      };
      return NextResponse.json({ expense: updatedExpense, error: null });
    }

    // Forward the request to the backend
    const backendUrl = expenseId ? `${BACKEND_URL}/api/expenses/${expenseId}` : `${BACKEND_URL}/api/expenses`;
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
    console.error("❌ [Proxy] Expenses PUT proxy error:", error);
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
    const expenseId = body.id;

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization required - no token found" },
        { status: 401 }
      );
    }

    if (!expenseId) {
      return NextResponse.json(
        { success: false, error: "Expense ID is required" },
        { status: 400 }
      );
    }

    // Handle demo mode
    if (isDemoMode) {
      // For demo mode DELETE, just return success
      return NextResponse.json({ success: true, error: null });
    }

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/expenses/${expenseId}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("❌ [Proxy] Expenses DELETE proxy error:", error);
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