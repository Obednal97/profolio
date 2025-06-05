import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/auth/profile/route";
import { NextRequest } from "next/server";

// Mock environment variables
vi.mock("process", () => ({
  env: {
    BACKEND_URL: "http://localhost:3001",
    NODE_ENV: "test",
  },
}));

// Mock fetch
global.fetch = vi.fn();
const mockFetch = vi.mocked(global.fetch);

interface MockResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

describe("/api/auth/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe("GET /api/auth/profile", () => {
    it("forwards request to backend with authorization header", async () => {
      const mockBackendResponse: MockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          user: { id: "123", email: "test@example.com" },
        }),
      };

      mockFetch.mockResolvedValue(mockBackendResponse as Response);

      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "GET",
          headers: {
            authorization: "Bearer test-token",
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/auth/profile",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("returns 401 when authorization header is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "GET",
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Authorization header required");
    });

    it("forwards backend error responses", async () => {
      const mockBackendResponse: MockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: "User not found",
        }),
      };

      mockFetch.mockResolvedValue(mockBackendResponse as Response);

      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "GET",
          headers: {
            authorization: "Bearer test-token",
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User not found");
    });

    it("handles network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "GET",
          headers: {
            authorization: "Bearer test-token",
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Proxy error - unable to reach backend service");
    });
  });

  describe("PATCH /api/auth/profile", () => {
    it("forwards request to backend with body and authorization", async () => {
      const mockBackendResponse: MockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          user: { id: "123", email: "updated@example.com" },
        }),
      };

      mockFetch.mockResolvedValue(mockBackendResponse as Response);

      const requestBody = { email: "updated@example.com" };
      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "PATCH",
          headers: {
            authorization: "Bearer test-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/auth/profile",
        {
          method: "PATCH",
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("returns 401 when authorization header is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ email: "test@example.com" }),
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Authorization header required");
    });

    it("handles invalid JSON in request body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "PATCH",
          headers: {
            authorization: "Bearer test-token",
            "content-type": "application/json",
          },
          body: "invalid json",
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
    });
  });

  describe("CORS and Security", () => {
    it("includes proper security headers in responses", async () => {
      const mockBackendResponse: MockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true }),
      };

      mockFetch.mockResolvedValue(mockBackendResponse as Response);

      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "GET",
          headers: {
            authorization: "Bearer test-token",
          },
        }
      );

      const response = await GET(request);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("prevents unauthorized access attempts", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "GET",
          headers: {
            authorization: "", // Empty authorization
          },
        }
      );

      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
