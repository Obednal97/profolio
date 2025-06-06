/**
 * Enhanced API client with automatic authentication handling
 */

// Secure token retrieval from httpOnly cookies
const getSecureToken = (): string | null => {
  if (typeof window !== 'undefined' && window.isSecureContext) {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1] || null;
  }
  return null;
};

// Handle API response errors globally
const handleApiError = (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    console.warn('🔒 [API] Received 401/403, triggering automatic sign out');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    return true;
  }
  return false;
};

// Enhanced fetch function that handles auth errors
export const authenticatedFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // Get token from secure cookies
  const token = getSecureToken();
  
  // Add authorization header if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Check for auth errors
    handleApiError(response);

    return response;
  } catch (error) {
    // Sanitize error logging for production
    if (process.env.NODE_ENV === 'development') {
      console.error(`API call failed for ${url}:`, error);
    } else {
      console.error(`API call failed for ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    throw error;
  }
};

// Convenience method for GET requests
export const apiGet = (url: string) => authenticatedFetch(url, { method: 'GET' });

// Convenience method for POST requests
export const apiPost = (url: string, data?: unknown) => 
  authenticatedFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  });

// Convenience method for PATCH requests
export const apiPatch = (url: string, data?: unknown) => 
  authenticatedFetch(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined
  });

// Convenience method for DELETE requests
export const apiDelete = (url: string) => authenticatedFetch(url, { method: 'DELETE' }); 