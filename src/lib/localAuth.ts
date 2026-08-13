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
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Token storage is the server's job.
//
// The auth token lives in an httpOnly `auth-token` cookie issued by the Next
// API routes under /api/auth/*. Being httpOnly it is deliberately invisible to
// JavaScript, and every request that needs it goes through a proxy route that
// reads the cookie server-side.
//
// The previous implementation could not work: it tried to *write* the cookie
// from the client (only when NODE_ENV was development, so production stored
// nothing at all), and tried to *read* an httpOnly cookie back out of
// document.cookie, which is impossible by definition. It additionally gated
// reads on window.isSecureContext, false on a plain-HTTP LAN address - exactly
// how a self-hosted install is reached.
//
// Sign-out clears the cookie through the API rather than from the client, for
// the same reason.
async function clearSecureToken(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/auth/signout", { method: "POST" });
  } catch {
    // Best-effort: local state is cleared regardless by the caller.
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
    localStorage.removeItem("demo-mode");
    // Clear the matching cookie too, otherwise the proxy routes keep serving
    // demo data after the user has signed out of demo mode.
    document.cookie = "demo-mode=; Path=/; Max-Age=0; SameSite=Lax";
  }
}

/**
 * The demo identity. One definition, used both when demo mode is entered and
 * when it is restored in a tab that has no cached profile.
 */
const DEMO_USER: LocalUser = {
  id: "demo-user-id",
  email: "demo@profolio.com",
  name: "Demo User",
  token: "",
};

/** Demo sessions last 24 hours, matching the documented behaviour. */
const DEMO_SESSION_MAX_AGE = 60 * 60 * 24;

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
    // Same-origin. Auth requests must go through the Next API routes under
    // /api/auth/*, because those are what issue the httpOnly auth cookie.
    // Calling the backend directly - as this used to, via NEXT_PUBLIC_API_URL
    // or a guessed https://<host>:3001 - bypasses the route that sets the
    // cookie, so a "successful" sign-in left the browser with no session.
    return "";
  }

  private initializeFromStorage() {
    if (typeof window === "undefined") return;

    // A demo session is identified by the demo-mode flag rather than by a
    // cached profile: sessionStorage does not cross tabs, so opening the app
    // in a second one would otherwise look signed out while the API happily
    // served demo data off the cookie.
    if (this.isDemoMode()) {
      this.currentUser = getSecureUserData()?.email
        ? { ...(getSecureUserData() as LocalUser), token: "" }
        : { ...DEMO_USER };
      this.notifyListeners();
      return;
    }

    // The token is in an httpOnly cookie and cannot be read here, so the
    // cached profile is a hint, not proof. It is shown immediately to avoid a
    // flash of signed-out UI, then confirmed against the server.
    const userData = getSecureUserData();
    if (!userData?.email) return;

    this.currentUser = { ...(userData as LocalUser), token: "" };
    this.notifyListeners();

    void this.confirmSession();
  }

  /**
   * Verifies the httpOnly cookie is still valid. Signs the user out locally if
   * the server rejects it, so a stale cached profile cannot masquerade as a
   * live session.
   */
  private async confirmSession(): Promise<void> {
    // A demo session has no account and no auth cookie, so /api/auth/profile
    // answers 401 - correctly. Running this check against one destroyed the
    // demo the moment the page was reloaded or navigated, which is why demo
    // mode appeared not to work at all. Demo data is served off the demo-mode
    // cookie instead, and there is no session to confirm.
    if (this.isDemoMode()) return;

    try {
      const response = await fetch("/api/auth/profile", {
        credentials: "same-origin",
      });
      if (response.status === 401 || response.status === 403) {
        await this.clearStorage();
        this.currentUser = null;
        this.notifyListeners();
      }
    } catch {
      // Network failure: keep the cached profile rather than signing the user
      // out because the API was briefly unreachable.
    }
  }

  private async clearStorage() {
    if (typeof window === "undefined") return;

    await clearSecureToken();
    clearSecureUserData();
  }

  private notifyListeners() {
    this.authListeners.forEach((listener) => listener(this.currentUser));
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      // Required so the browser sends and stores the httpOnly auth cookie.
      credentials: "same-origin",
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

      // Use the id the server assigned. This previously generated a random
      // UUID client-side, so the in-app user id never matched the database
      // record it was supposed to identify.
      const user: LocalUser = {
        id: response.user?.id ?? "",
        email: response.user?.email ?? email,
        name: response.user?.name ?? displayName,
        token: response.token,
      };

      // The token itself is already stored by the API route as an httpOnly
      // cookie; only the non-sensitive profile is cached here.
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

      // Use the id the server assigned rather than a client-generated UUID.
      const user: LocalUser = {
        id: response.user?.id ?? "",
        email: response.user?.email ?? email,
        name: response.user?.name ?? email.split("@")[0] ?? "User",
        token: response.token,
      };

      // The token itself is already stored by the API route as an httpOnly
      // cookie; only the non-sensitive profile is cached here.
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

      // The endpoint answers { success, user }, so the fields are one level
      // down. Reading profile.id and profile.name off the envelope always gave
      // undefined, and the defaults below silently covered it up - the name
      // shown in the app was the email local part, never the stored one.
      const user = profile?.user ?? {};

      this.currentUser = {
        ...this.currentUser,
        id: user.id || this.currentUser.id,
        name:
          user.name ||
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

  /**
   * The token for the current session, if this tab performed the sign-in.
   *
   * Returns null after a page reload: the token lives in an httpOnly cookie
   * that JavaScript cannot read. Callers that need authenticated data should
   * go through a /api/* proxy route, which reads the cookie server-side,
   * rather than attaching a bearer token themselves.
   */
  getToken(): string | null {
    return this.currentUser?.token || null;
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
      ...DEMO_USER,
      token: generateDemoSessionToken(),
    };

    // Demo mode is entirely client-side - there is no backend session and no
    // real credential, so nothing sensitive is being stored here.
    setSecureUserData(demoUser);

    if (typeof window !== "undefined") {
      localStorage.setItem("demo-mode", "true");
      // Also set as a cookie: the /api/* proxy routes decide whether to serve
      // demo data by reading `demo-mode` server-side, and cannot see
      // localStorage. Without this the flag was invisible to every route that
      // checks it.
      document.cookie = `demo-mode=true; Path=/; Max-Age=${DEMO_SESSION_MAX_AGE}; SameSite=Lax`;
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
