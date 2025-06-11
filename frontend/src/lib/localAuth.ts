// Local Authentication Service - No Firebase dependency
// This service talks to the backend API for self-hosted authentication

export interface LocalUser {
  id: string;
  email: string;
  name?: string | null;
  token: string;
}

export interface AuthResponse {
  token: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface SignUpResponse {
  token: string;
}

// Secure token management for httpOnly cookies
function getSecureToken(): string | null {
  if (typeof window !== "undefined" && window.isSecureContext) {
    // Read from httpOnly cookie set by server
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth-token="))
      ?.split("=")[1];
    return cookieValue || null;
  }
  return null;
}

function setSecureToken(token: string): void {
  // Note: httpOnly cookies must be set by the server
  // This is a client-side fallback for development
  if (typeof window !== "undefined") {
    if (process.env.NODE_ENV === "development") {
      // Development: Use secure cookie attributes
      document.cookie = `auth-token=${token}; Secure; SameSite=Strict; Path=/; Max-Age=86400`;
    } else {
      // Production: Token should be set by server as httpOnly cookie
      console.warn(
        "Token should be set by server as httpOnly cookie in production"
      );
    }
  }
}

function clearSecureToken(): void {
  if (typeof window !== "undefined") {
    // Clear the cookie by setting expired date
    document.cookie =
      "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict";
  }
}

// Secure user data storage (non-sensitive data only)
function getSecureUserData(): Partial<LocalUser> | null {
  if (typeof window !== "undefined") {
    try {
      const userData = sessionStorage.getItem("user-profile");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to parse stored user profile:", error);
      }
      clearSecureUserData();
      return null;
    }
  }
  return null;
}

function setSecureUserData(user: Partial<LocalUser>): void {
  if (typeof window !== "undefined") {
    try {
      // Store only non-sensitive profile data (no token)
      const profileData = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
      sessionStorage.setItem("user-profile", JSON.stringify(profileData));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to store user profile:", error);
      }
    }
  }
}

function clearSecureUserData(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("user-profile");
    localStorage.removeItem("demo-mode"); // Demo mode flag is safe in localStorage
  }
}

// Generate secure demo session token
function generateDemoSessionToken(): string {
  const timestamp = Date.now();
  const randomBytes = crypto.getRandomValues
    ? Array.from(crypto.getRandomValues(new Uint8Array(16)))
    : Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));

  const randomHex = randomBytes
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `demo-${timestamp}-${randomHex}`;
}

class LocalAuthService {
  private baseUrl: string;
  private currentUser: LocalUser | null = null;
  private authListeners: ((user: LocalUser | null) => void)[] = [];

  constructor() {
    this.baseUrl = this.getBaseUrl();

    // Initialize user from secure storage on startup
    this.initializeFromStorage();
  }

  private getBaseUrl(): string {
    // Use environment variable if available
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    // Auto-detect protocol and host for production
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;

      // In production, use same protocol as frontend
      if (protocol === "https:") {
        // For HTTPS, assume backend is on port 3001 with HTTPS
        return `https://${hostname}:3001`;
      }
    }

    // Development fallback
    return "http://localhost:3001";
  }

  private initializeFromStorage() {
    if (typeof window === "undefined") return;

    const token = getSecureToken();
    const userData = getSecureUserData();

    if (token && userData) {
      try {
        this.currentUser = { ...(userData as LocalUser), token };
        this.notifyListeners();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to initialize from stored data:", error);
        }
        this.clearStorage();
      }
    }
  }

  private clearStorage() {
    if (typeof window === "undefined") return;

    clearSecureToken();
    clearSecureUserData();
  }

  private notifyListeners() {
    this.authListeners.forEach((listener) => listener(this.currentUser));
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP ${response.status}`
      );
    }

    return response.json();
  }

  async signUp(
    email: string,
    password: string,
    name?: string
  ): Promise<LocalUser> {
    try {
      // Provide sensible defaults for name
      const displayName = name?.trim() || email.split("@")[0] || "User";

      const response: SignUpResponse = await this.apiRequest(
        "/api/auth/signup",
        {
          method: "POST",
          body: JSON.stringify({ email, password, name: displayName }),
        }
      );

      const user: LocalUser = {
        id: crypto.randomUUID(), // Generate proper unique ID
        email,
        name: displayName,
        token: response.token,
      };

      // Store authentication data securely
      setSecureToken(response.token);
      setSecureUserData(user);

      this.currentUser = user;
      this.notifyListeners();

      return user;
    } catch (error) {
      throw new Error(
        `Sign up failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async signIn(email: string, password: string): Promise<LocalUser> {
    try {
      const response: SignUpResponse = await this.apiRequest(
        "/api/auth/signin",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      );

      const user: LocalUser = {
        id: crypto.randomUUID(), // Generate proper unique ID
        email,
        name: email.split("@")[0] || "User", // Provide default name from email
        token: response.token,
      };

      // Store authentication data securely
      setSecureToken(response.token);
      setSecureUserData(user);

      this.currentUser = user;
      this.notifyListeners();

      // Fetch user profile to get name and other details
      try {
        await this.fetchUserProfile();
      } catch (profileError) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to fetch user profile:", profileError);
        }
        // Keep the default name if profile fetch fails
      }

      return user;
    } catch (error) {
      throw new Error(
        `Sign in failed: ${
          error instanceof Error ? error.message : "Invalid credentials"
        }`
      );
    }
  }

  async signOut(): Promise<void> {
    try {
      // Check if we're in demo mode and handle it properly
      if (this.isDemoMode()) {
        const { DemoSessionManager } = await import("@/lib/demoSession");
        DemoSessionManager.endDemoSession();
        // endDemoSession() handles redirect automatically
        return;
      }

      // Call backend signout endpoint if user is authenticated
      if (this.currentUser?.token) {
        await this.apiRequest("/api/auth/signout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.currentUser.token}`,
          },
        }).catch((error) => {
          if (process.env.NODE_ENV === "development") {
            console.warn("Backend signout failed:", error);
          }
          // Continue with local signout even if backend fails
        });
      }
    } finally {
      // Always clear local state (only reached for non-demo mode)
      this.clearStorage();
      this.currentUser = null;
      this.notifyListeners();
    }
  }

  async fetchUserProfile(): Promise<void> {
    if (!this.currentUser?.token) return;

    try {
      const profile = await this.apiRequest("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${this.currentUser.token}`,
        },
      });

      // Update current user with profile data, providing defaults
      this.currentUser = {
        ...this.currentUser,
        id: profile.id || this.currentUser.id,
        name:
          profile.name ||
          this.currentUser.name ||
          this.currentUser.email.split("@")[0] ||
          "User",
      };

      // Update stored user data securely (no token)
      setSecureUserData(this.currentUser);
      this.notifyListeners();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch user profile:", error);
      }
      // Ensure we have a name even if profile fetch fails
      if (!this.currentUser.name) {
        this.currentUser.name = this.currentUser.email.split("@")[0] || "User";
        setSecureUserData(this.currentUser);
        this.notifyListeners();
      }
    }
  }

  getCurrentUser(): LocalUser | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.currentUser?.token || getSecureToken();
  }

  onAuthStateChange(callback: (user: LocalUser | null) => void): () => void {
    this.authListeners.push(callback);

    // Immediately call with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  // Demo mode support with secure session management
  async signInWithDemo(): Promise<LocalUser> {
    const demoUser: LocalUser = {
      id: "demo-user-id",
      email: "demo@profolio.com",
      name: "Demo User",
      token: generateDemoSessionToken(),
    };

    // Store demo token securely and set demo mode flag
    setSecureToken(demoUser.token);
    setSecureUserData(demoUser);

    // Demo mode flag is safe in localStorage (non-sensitive)
    if (typeof window !== "undefined") {
      localStorage.setItem("demo-mode", "true");
    }

    this.currentUser = demoUser;
    this.notifyListeners();

    return demoUser;
  }

  isDemoMode(): boolean {
    return (
      typeof window !== "undefined" &&
      localStorage.getItem("demo-mode") === "true"
    );
  }
}

// Export singleton instance
export const localAuth = new LocalAuthService();

// Export convenience functions
export const signUpWithLocal = (
  email: string,
  password: string,
  name?: string
) => localAuth.signUp(email, password, name);

export const signInWithLocal = (email: string, password: string) =>
  localAuth.signIn(email, password);

export const signOutLocal = () => localAuth.signOut();

export const onLocalAuthStateChange = (
  callback: (user: LocalUser | null) => void
) => localAuth.onAuthStateChange(callback);

export const getCurrentLocalUser = () => localAuth.getCurrentUser();

export const getLocalAuthToken = () => localAuth.getToken();

export const signInWithDemoLocal = () => localAuth.signInWithDemo();
