export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

interface RequestParams {
  [key: string]: string | number | boolean;
}

export class ApiClient {
  private baseURL: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Get auth token from secure httpOnly cookies
    try {
      if (typeof window !== 'undefined' && window.isSecureContext) {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1];
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn('Failed to access auth token:', error);
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json() as ApiError;
      throw new ApiClientError(
        error.message || 'An error occurred',
        error.statusCode || response.status,
        error
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      const response = await fetch(url, options);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        await this.delay(this.retryDelay);
        return this.fetchWithRetry<T>(url, options, retries - 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: unknown): boolean {
    // Retry on network errors or 5xx server errors
    if (error instanceof ApiClientError) {
      return error.statusCode >= 500 && error.statusCode < 600;
    }
    // Retry on network errors (no statusCode)
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(endpoint: string, params?: RequestParams): Promise<T> {
    const headers = await this.getAuthHeaders();
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => 
        url.searchParams.append(key, String(value))
      );
    }

    return this.fetchWithRetry<T>(url.toString(), {
      method: 'GET',
      headers,
    });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    return this.fetchWithRetry<T>(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    return this.fetchWithRetry<T>(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    return this.fetchWithRetry<T>(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    return this.fetchWithRetry<T>(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
  }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: ApiError
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// Singleton instance
export const apiClient = new ApiClient(); 