// Smart API Service - Automatically detects deployment mode
// Switches between mock API (development/demo) and real API (production/self-hosted)

import { logger } from "./logger";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  [key: string]: unknown;
}

interface CustomHeaders {
  [key: string]: string;
}

class ApiService {
  private useMockApi: boolean;
  private baseUrl: string;

  constructor() {
    this.baseUrl = this.detectApiBaseUrl();
    this.useMockApi = this.shouldUseMockApi();

    logger.info(
      `[ApiService] Mode: ${this.useMockApi ? "Mock" : "Real"}, Base URL: ${
        this.baseUrl
      }`
    );
  }

  private detectApiBaseUrl(): string {
    // In production builds, the API is served from the same domain
    if (typeof window !== "undefined") {
      const { protocol, hostname, port } = window.location;

      // Self-hosted: API is on same domain with /api prefix
      if (this.isSelHosted()) {
        return `${protocol}//${hostname}${port ? `:${port}` : ""}/api`;
      }

      // SaaS production: different API domain
      if (process.env.NODE_ENV === "production") {
        return (
          process.env.NEXT_PUBLIC_API_URL || `${protocol}//${hostname}/api`
        );
      }

      // For HTTPS in development/staging, use HTTPS for backend too
      if (protocol === "https:") {
        return (
          process.env.NEXT_PUBLIC_API_URL || `https://${hostname}:3001/api`
        );
      }
    }

    // Development: local backend with environment variable fallback
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  }

  private shouldUseMockApi(): boolean {
    // Check if we're in demo mode or development
    if (typeof window !== "undefined") {
      // Check for demo mode flag
      const isDemoMode =
        localStorage.getItem("demo-mode") === "true" ||
        window.location.pathname.includes("/demo");

      if (isDemoMode) {
        return true;
      }
    }

    // Check environment variables
    const forceMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
    const isDevelopment = process.env.NODE_ENV === "development";

    // Use mock API if:
    // 1. Explicitly forced via env var
    // 2. Development mode AND no backend available
    return forceMock || (isDevelopment && !this.isBackendAvailable());
  }

  private isSelHosted(): boolean {
    if (typeof window === "undefined") return false;

    // Check for self-hosted indicators
    return (
      document.documentElement.getAttribute("data-deployment") ===
        "self-hosted" ||
      localStorage.getItem("deployment-type") === "self-hosted" ||
      window.location.hostname === "localhost" ||
      /^192\.168\./.test(window.location.hostname) ||
      /^10\./.test(window.location.hostname)
    );
  }

  private async isBackendAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async call<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Use mock API if configured
    if (this.useMockApi) {
      return this.mockApiCall<T>(endpoint, options);
    }

    // Use real API
    return this.realApiCall<T>(endpoint, options);
  }

  private async mockApiCall<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<ApiResponse<T>> {
    // Dynamic import to avoid bundling mock API in production
    const { apiCall } = await import("./mockApi");
    const response = await apiCall(`/api${endpoint}`, options);
    return response.json();
  }

  private async realApiCall<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      // Add default headers
      const headers: CustomHeaders = {
        "Content-Type": "application/json",
        ...((options.headers as CustomHeaders) || {}),
      };

      // Add auth token if available
      const token = this.getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string }).message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return { data, error: undefined };
    } catch (error) {
      logger.error(`[ApiService] Error calling ${endpoint}:`, error);
      return {
        data: undefined,
        error: (error as Error).message || "An unexpected error occurred",
      };
    }
  }

  // Secure token retrieval from httpOnly cookies
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    // Read from secure httpOnly cookie set by server
    if (window.isSecureContext) {
      const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth-token="))
        ?.split("=")[1];
      return cookieValue || null;
    }

    // Fallback: check for demo mode token in sessionStorage (non-sensitive)
    if (localStorage.getItem("demo-mode") === "true") {
      return sessionStorage.getItem("demo-auth-token") || null;
    }

    return null;
  }

  // Helper methods for common API operations
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.call<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.call<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.call<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.call<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.call<T>(endpoint, { method: "DELETE" });
  }

  // Mode switching (useful for demos)
  enableMockMode(): void {
    this.useMockApi = true;
    if (typeof window !== "undefined") {
      localStorage.setItem("demo-mode", "true");
    }
    logger.info("[ApiService] Switched to Mock API mode");
  }

  enableRealMode(): void {
    this.useMockApi = false;
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo-mode");
    }
    logger.info("[ApiService] Switched to Real API mode");
  }

  // Get current mode info
  getApiInfo() {
    return {
      mode: this.useMockApi ? "mock" : "real",
      baseUrl: this.baseUrl,
      isSelHosted: this.isSelHosted(),
      environment: process.env.NODE_ENV,
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types
export type { ApiResponse };

// Legacy export for backward compatibility
export { apiService as default };
